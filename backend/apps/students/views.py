"""
Student-specific views.
All endpoints here are restricted to users with role='student'.
"""
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsStudent
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.lessons.models import Lesson
from apps.progress.models import CourseProgress, LessonProgress
from apps.quizzes.models import QuizAttempt

from apps.live_classes.models import Attendance
from .serializers import (
    StudentCourseSerializer,
    StudentDashboardSerializer,
    StudentProgressSummarySerializer,
    StudentQuizResultSerializer,
    TeacherMentorSerializer,
    StudentSessionBookingSerializer,
)

User = get_user_model()


class StudentDashboardView(APIView):
    """
    GET /api/v1/students/dashboard/
    Returns aggregated dashboard data for the logged-in student.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = request.user

        # Enrolled courses
        enrolled_courses = Course.objects.filter(
            enrollments__student=student, 
            enrollments__is_active=True,
            is_deleted=False
        ).distinct()
        total_enrolled = enrolled_courses.count()

        # Progress stats
        course_progresses = CourseProgress.objects.filter(student=student, course__in=enrolled_courses)
        completed = course_progresses.filter(progress_percentage=100).count()
        in_progress = total_enrolled - completed

        # Lesson stats
        total_lessons_completed = LessonProgress.objects.filter(
            student=student, completed=True
        ).count()

        # Quiz stats
        quiz_attempts = QuizAttempt.objects.filter(student=student)
        total_quizzes = quiz_attempts.count()
        unique_quizzes = quiz_attempts.values('quiz').distinct().count()
        avg_score = quiz_attempts.aggregate(
            avg=Avg('score')
        )['avg'] or 0.0

        # Core Stats
        overall = course_progresses.aggregate(avg=Avg('progress_percentage'))['avg'] or 0.0
        attendances = Attendance.objects.filter(student=student)
        total_attendance = attendances.count()
        present_count = attendances.filter(is_present=True).count()
        attendance_percentage = round((present_count / total_attendance) * 100, 1) if total_attendance > 0 else 0.0

        # Per-course attendance
        course_attendance_stats = []
        for course in enrolled_courses:
            course_attendances = Attendance.objects.filter(student=student, live_class__course=course)
            c_total = course_attendances.count()
            c_present = course_attendances.filter(is_present=True).count()
            c_percentage = round((c_present / c_total) * 100, 1) if c_total > 0 else 0.0
            
            course_attendance_stats.append({
                'id': str(course.id),
                'title': course.title,
                'total': c_total,
                'present': c_present,
                'percentage': c_percentage
            })

        # Recent 5 courses
        recent_courses = enrolled_courses.order_by('-updated_at')[:5]

        data = {
            'total_enrolled_courses': total_enrolled,
            'completed_courses': completed,
            'in_progress_courses': in_progress,
            'total_quizzes_taken': total_quizzes,
            'unique_quizzes_count': unique_quizzes,
            'average_quiz_score': round(avg_score, 1),
            'total_lessons_completed': total_lessons_completed,
            'total_attendance_marked': total_attendance,
            'total_present': present_count,
            'attendance_percentage': attendance_percentage,
            'course_attendance': course_attendance_stats,
            'recent_courses': StudentCourseSerializer(
                recent_courses, many=True, context={'request': request}
            ).data,
            'overall_progress': round(overall, 1),
        }


        return Response({'success': True, 'data': data})


class StudentEnrolledCoursesView(generics.ListAPIView):
    """
    GET /api/v1/students/courses/
    Lists all courses the student is enrolled in with progress.
    """
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    pagination_class = StandardPagination

    def get_queryset(self):
        enrolled_ids = Enrollment.objects.filter(
            student=self.request.user, is_active=True
        ).values_list('course_id', flat=True)
        return Course.objects.filter(id__in=enrolled_ids).select_related('teacher')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


class StudentTeachersView(generics.ListAPIView):
    """
    GET /api/v1/students/my-teachers/
    Lists all teachers of the courses the student is enrolled in.
    """
    serializer_class = TeacherMentorSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        enrolled_course_ids = Enrollment.objects.filter(
            student=self.request.user, is_active=True
        ).values_list('course_id', flat=True)
        
        teacher_ids = Course.objects.filter(id__in=enrolled_course_ids).values_list('teacher_id', flat=True)
        return User.objects.filter(id__in=teacher_ids, role='teacher', is_active=True)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Inject Personal AI Mentor at the top
        ai_mentor = {
            'id': 'ai-mentor',
            'name': 'MentIQ AI Mentor',
            'role': 'Advanced AI Assistant',
            'bio': 'I am available 24/7 to help you with any doubts.',
            'expertise': ['Any Subject', 'Code Debugging', 'Concept Explanation'],
            'availability': 'Available 24/7',
            'rating': 5.0,
            'reviews': '10k+',
            'image': '/Logo.png',
            'phone_number': '+1 (800) MentIQ-AI',
            'subject': 'All Subjects',
            'is_ai': True
        }

        # Mark human teachers
        for mentor in data:
            mentor['is_ai'] = False

        data.insert(0, ai_mentor)

        return Response({'success': True, 'data': data})


class StudentProgressView(APIView):
    """
    GET /api/v1/students/progress/
    Returns progress summary for all enrolled courses.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = request.user
        enrolled_ids = Enrollment.objects.filter(
            student=student, is_active=True
        ).values_list('course_id', flat=True)

        courses = Course.objects.filter(id__in=enrolled_ids)
        progress_data = []

        for course in courses:
            total_lessons = course.lessons.count()
            completed_lessons = LessonProgress.objects.filter(
                student=student, lesson__course=course, completed=True
            ).count()

            progress_pct = 0
            if total_lessons > 0:
                progress_pct = round((completed_lessons / total_lessons) * 100, 1)

            # Course progress record
            cp, _ = CourseProgress.objects.get_or_create(
                student=student, course=course,
                defaults={'progress_percentage': progress_pct}
            )

            # Quiz average for this course
            quiz_avg = QuizAttempt.objects.filter(
                student=student, quiz__course=course
            ).aggregate(avg=Avg('score'))['avg']

            progress_data.append({
                'course_id': course.id,
                'course_title': course.title,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'progress_percentage': progress_pct,
                'last_accessed': cp.updated_at,
                'quiz_average': round(quiz_avg, 1) if quiz_avg else None,
            })

        return Response({'success': True, 'data': progress_data})


class StudentQuizHistoryView(generics.ListAPIView):
    """
    GET /api/v1/students/quiz-history/
    Lists all quiz attempts by the student.
    """
    serializer_class = StudentQuizResultSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    pagination_class = StandardPagination

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            student=self.request.user
        ).select_related('quiz', 'quiz__course').order_by('-completed_at')


class StudentBrowseCoursesView(generics.ListAPIView):
    """
    GET /api/v1/students/browse/
    Browse all available courses with search & filter.
    """
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = Course.objects.filter(
            is_published=True, is_deleted=False
        ).select_related('teacher')

        # Search
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(category__icontains=search)
            )

        # Filter by category
        category = self.request.query_params.get('category', '')
        if category:
            queryset = queryset.filter(category__iexact=category)

        # Filter by level
        level = self.request.query_params.get('level', '')
        if level:
            queryset = queryset.filter(level__iexact=level)

        # Sorting
        sort = self.request.query_params.get('sort', '-created_at')
        allowed_sorts = ['created_at', '-created_at', 'title', '-title']
        if sort in allowed_sorts:
            queryset = queryset.order_by(sort)

        return queryset
class StudentSessionBookingCreateView(generics.CreateAPIView):
    """
    POST /api/v1/students/book-session/
    Allows students to book a 1:1 session with a teacher.
    """
    serializer_class = StudentSessionBookingSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True, 
            'message': 'Session booked successfully.',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
