"""
Teacher-specific views.
All endpoints here are restricted to users with role='teacher'.
"""
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsTeacher
from apps.courses.models import Course, CourseReview
from apps.courses.serializers import CourseReviewSerializer
from apps.enrollments.models import Enrollment
from apps.lessons.models import Lesson
from apps.progress.models import CourseProgress, LessonProgress
from apps.quizzes.models import Quiz, QuizAttempt

from .serializers import (
    CourseStudentProgressSerializer,
    TeacherCourseStatsSerializer,
    TeacherDashboardSerializer,
    TeacherStudentDetailSerializer,
)

User = get_user_model()


class TeacherDashboardView(APIView):
    """
    GET /api/v1/teachers/dashboard/
    Returns aggregated dashboard data for the logged-in teacher.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        teacher = request.user
        courses = Course.objects.filter(teacher=teacher, is_deleted=False)

        total_courses = courses.count()
        published = courses.filter(is_published=True).count()
        draft = total_courses - published

        # Total unique students across all courses
        total_students = Enrollment.objects.filter(
            course__in=courses, is_active=True
        ).values('student').distinct().count()

        # Lesson & Quiz counts
        total_lessons = Lesson.objects.filter(course__in=courses).count()
        total_quizzes = Quiz.objects.filter(course__in=courses).count()

        # Quiz attempt stats
        attempts = QuizAttempt.objects.filter(quiz__course__in=courses)
        total_attempts = attempts.count()
        avg_score = attempts.aggregate(avg=Avg('score'))['avg'] or 0.0

        # Review stats
        reviews = CourseReview.objects.filter(course__in=courses, is_deleted=False)
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0.0
        recent_reviews = reviews.select_related('student', 'course').order_by('-created_at')[:5]

        # Recent courses
        recent = courses.order_by('-updated_at')[:5]

        data = {
            'total_courses': total_courses,
            'published_courses': published,
            'draft_courses': draft,
            'total_students': total_students,
            'total_lessons': total_lessons,
            'total_quizzes': total_quizzes,
            'total_quiz_attempts': total_attempts,
            'average_quiz_score': round(avg_score, 1),
            'total_reviews': total_reviews,
            'average_rating': round(avg_rating, 1),
            'recent_reviews': CourseReviewSerializer(recent_reviews, many=True).data,
            'recent_courses': TeacherCourseStatsSerializer(
                recent, many=True, context={'request': request}
            ).data,
        }

        return Response({'success': True, 'data': data})


class TeacherCoursesView(generics.ListAPIView):
    """
    GET /api/v1/teachers/courses/
    Lists all courses owned by the teacher with stats.
    """
    serializer_class = TeacherCourseStatsSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = Course.objects.filter(
            teacher=self.request.user, is_deleted=False
        ).select_related('teacher')

        # Filter by publish status
        published = self.request.query_params.get('published')
        if published is not None:
            queryset = queryset.filter(is_published=published.lower() == 'true')

        # Search
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        return queryset.order_by('-updated_at')


class TeacherStudentsView(APIView):
    """
    GET /api/v1/teachers/students/
    Lists all students enrolled in the teacher's courses with their progress.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        teacher = request.user
        courses = Course.objects.filter(teacher=teacher, is_deleted=False)

        enrollments = Enrollment.objects.filter(
            course__in=courses, is_active=True
        ).select_related('student', 'course').order_by('-enrolled_at')

        students_data = []
        for enrollment in enrollments:
            student = enrollment.student
            course = enrollment.course

            # Get progress from CourseProgress model
            progress_obj = CourseProgress.objects.filter(student=student, course=course).first()
            progress_pct = progress_obj.progress_percentage if progress_obj else 0.0

            # Progress details for this specific enrollment
            total_lessons = course.lessons.count()
            completed_lessons = LessonProgress.objects.filter(
                student=student, lesson__course=course, completed=True
            ).count()

            # Average quiz for this course
            avg_quiz = QuizAttempt.objects.filter(
                student=student, quiz__course=course
            ).aggregate(avg=Avg('score'))['avg']

            # Last active
            last_progress = LessonProgress.objects.filter(
                student=student, lesson__course=course
            ).order_by('-updated_at').first()

            students_data.append({
                'student_id': student.id,
                'student_name': student.name,
                'student_email': student.email,
                'course_id': course.id,
                'course_title': course.title,
                'progress_percentage': progress_pct,
                'total_lessons': total_lessons,
                'lessons_completed': completed_lessons,
                'average_quiz_score': round(avg_quiz, 1) if avg_quiz else None,
                'last_active': last_progress.updated_at if last_progress else enrollment.enrolled_at,
                'enrolled_at': enrollment.enrolled_at,
            })

        return Response({'success': True, 'data': students_data})


class TeacherCourseStudentsView(APIView):
    """
    GET /api/v1/teachers/courses/<course_id>/students/
    Lists all students enrolled in a specific course with their progress.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, teacher=request.user)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Course not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        enrollments = Enrollment.objects.filter(
            course=course, is_active=True
        ).select_related('student').order_by('-enrolled_at')

        students_data = []
        for enrollment in enrollments:
            student = enrollment.student
            
            progress_obj = CourseProgress.objects.filter(student=student, course=course).first()
            progress_pct = progress_obj.progress_percentage if progress_obj else 0.0

            completed_lessons = LessonProgress.objects.filter(
                student=student, lesson__course=course, completed=True
            ).count()

            quiz_attempts = QuizAttempt.objects.filter(
                student=student, quiz__course=course
            )
            avg_quiz = quiz_attempts.aggregate(avg=Avg('score'))['avg']

            students_data.append({
                'student_id': student.id,
                'student_name': student.name,
                'lessons_completed': completed_lessons,
                'total_lessons': course.lessons.count(),
                'progress_percentage': progress_pct,
                'quiz_attempts': quiz_attempts.count(),
                'avg_quiz_score': round(avg_quiz, 1) if avg_quiz else None,
                'enrolled_at': enrollment.enrolled_at,
            })

        return Response({'success': True, 'data': students_data})


class TeacherStudentDetailView(APIView):
    """
    GET /api/v1/teachers/students/<uuid:student_id>/
    Returns detailed progress for a student across all courses taught by the teacher.
    Or filter by ?course_id=...
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request, student_id):
        teacher = request.user
        try:
            student = User.objects.get(id=student_id)
        except (User.DoesNotExist, ValueError):
            return Response(
                {'success': False, 'error': {'message': 'Student not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        teacher_courses = Course.objects.filter(teacher=teacher, is_deleted=False)
        
        course_id = request.query_params.get('course_id')
        if course_id and course_id != 'null':
            teacher_courses = teacher_courses.filter(id=course_id)

        enrollments = Enrollment.objects.filter(
            student=student, course__in=teacher_courses, is_active=True
        ).select_related('course')

        data = {
            'student': {
                'id': student.id,
                'name': student.name,
                'email': student.email,
            },
            'courses': []
        }

        processed_course_ids = set()

        for enrollment in enrollments:
            course = enrollment.course
            
            # Prevent duplicate courses if multiple enrollments exist
            if course.id in processed_course_ids:
                continue
            processed_course_ids.add(course.id)
            
            progress_obj = CourseProgress.objects.filter(student=student, course=course).first()
            progress_pct = progress_obj.progress_percentage if progress_obj else 0.0

            # Lessons and progress
            lessons = Lesson.objects.filter(course=course).order_by('sequence_number')
            progress_map = {
                lp.lesson_id: lp 
                for lp in LessonProgress.objects.filter(student=student, lesson__course=course)
            }
            
            lesson_details = []
            for lesson in lessons:
                progress = progress_map.get(lesson.id)
                lesson_details.append({
                    'id': lesson.id,
                    'title': lesson.title,
                    'is_completed': progress.completed if progress else False,
                    'time_spent': progress.time_spent if progress else 0,
                    'last_accessed': progress.updated_at if progress else None,
                })

            # Quiz attempts - Group by quiz to show only unique quizzes or best attempts
            # For the history, we'll show unique quizzes with their best score
            # We use set() and order_by() to ensure distinctness is not compromised by default model ordering
            unique_quiz_ids = set(QuizAttempt.objects.filter(
                student=student, quiz__course=course
            ).order_by().values_list('quiz_id', flat=True).distinct())
            
            best_attempts = []
            for q_id in unique_quiz_ids:
                best_attempt = QuizAttempt.objects.filter(
                    student=student, quiz_id=q_id
                ).order_by('-score', '-created_at').first()
                if best_attempt:
                    best_attempts.append(best_attempt)

            course_data = {
                'id': course.id,
                'title': course.title,
                'progress_percentage': progress_pct,
                'enrolled_at': enrollment.enrolled_at,
                'lessons': lesson_details,
                'quizzes': [
                    {
                        'id': qa.id,
                        'quiz_id': qa.quiz.id,
                        'quiz_title': qa.quiz.title,
                        'score': qa.percentage,
                        'passed': qa.passed,
                        'attempted_at': qa.created_at,
                    } for qa in best_attempts
                ]
            }
            data['courses'].append(course_data)

        return Response({'success': True, 'data': data})
