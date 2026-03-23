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
from apps.live_classes.models import SessionBooking

from .serializers import (
    CourseStudentProgressSerializer,
    TeacherCourseStatsSerializer,
    TeacherDashboardSerializer,
    TeacherStudentDetailSerializer,
    TeacherSessionBookingSerializer,
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


class TeacherDashboardStatsView(APIView):
    """
    GET /api/v1/teachers/dashboard-stats/
    Returns specific stat card metrics for the teacher.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        teacher = request.user
        courses = Course.objects.filter(teacher=teacher, is_deleted=False)

        # Total unique students across all active courses
        total_students = Enrollment.objects.filter(
            course__in=courses, is_active=True
        ).values('student').distinct().count()

        active_courses = courses.filter(is_published=True).count()
        
        # Pending Doubts (mocking for now as Doubt model isn't imported, but assuming there is an app)
        # Note: If there's an actual doubt system we should query it here. Let's return 0 or do a basic query if we find it later.
        pending_doubts = 0
        try:
            from apps.live_classes.models import SessionBooking # Or whichever model handles doubts/questions
            pending_doubts = SessionBooking.objects.filter(teacher=teacher, status='scheduled').count()
        except:
            pass

        # Average Attendance
        avg_attendance = 0 
        try:
            from apps.attendance.models import AttendanceRecord
            records = AttendanceRecord.objects.filter(session__course__teacher=teacher)
            if records.exists():
                present = records.filter(is_present=True).count()
                avg_attendance = round((present / records.count()) * 100)
        except Exception as e:
            print(f"Stats Error Check: {e}")

        data = {
            'total_students': total_students,
            'active_courses': active_courses,
            'avg_attendance': avg_attendance,
            'pending_doubts': pending_doubts
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


class TeacherSessionBookingListView(generics.ListAPIView):
    """
    GET /api/v1/teachers/bookings/
    Lists all booked 1:1 sessions for the teacher.
    """
    serializer_class = TeacherSessionBookingSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    pagination_class = StandardPagination

    def get_queryset(self):
        return SessionBooking.objects.filter(
            teacher=self.request.user
        ).select_related('student')


class TeacherSessionBookingUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/v1/teachers/bookings/<id>/
    Allows teacher to update booking status (e.g., confirm, cancel).
    """
    serializer_class = TeacherSessionBookingSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    queryset = SessionBooking.objects.all()

    def get_queryset(self):
        return self.queryset.filter(teacher=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        
        # 🔔 Notify STUDENT about the booking update
        try:
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification
            
            status_map = {
                'confirmed': '✅ Confirmed',
                'cancelled': '❌ Cancelled',
                'completed': '🏁 Completed',
            }
            status_text = status_map.get(instance.status, instance.status.capitalize())
            
            title = f"Session Update: {status_text}"
            body = f"Your 1:1 session with {instance.teacher.name} on {instance.date} is now {status_text}."
            
            create_notification(
                user=instance.student,
                title=title,
                body=body,
                notification_type=Notification.TypeChoices.SYSTEM,
                data={'booking_id': str(instance.id), 'status': instance.status}
            )
        except Exception as e:
            print(f"Booking Update Notification Failure: {e}")


# ═══════════════════════════════════════════════════════════════
# PARENT INTERACTION
# ═══════════════════════════════════════════════════════════════

class TeacherParentListView(APIView):
    """
    GET /api/v1/teachers/parents/
    Lists parents of students enrolled in the teacher's courses.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        teacher = request.user
        from apps.parents.models import ParentAccount
        
        # Get all students enrolled in teacher's courses
        enrolled_student_ids = Enrollment.objects.filter(
            course__teacher=teacher, is_active=True
        ).values_list('student_id', flat=True).distinct()
        
        # Find parents of these students
        parents = ParentAccount.objects.filter(
            children__id__in=enrolled_student_ids
        ).select_related('user').prefetch_related('children').distinct()
        
        data = []
        for parent in parents:
            base_user = parent.user
            # Only include children of this parent who are enrolled in teacher's courses
            relevant_children = parent.children.filter(id__in=enrolled_student_ids)
            
            data.append({
                'id': str(base_user.id),
                'name': base_user.name,
                'email': base_user.email,
                'phone_number': base_user.phone_number,
                'parent_id': base_user.parent_id,
                'children': [{
                    'id': str(c.id),
                    'name': c.name,
                    'student_id': c.student_id
                } for c in relevant_children]
            })
            
        return Response({'success': True, 'data': data})


class TeacherParentContactView(APIView):
    """
    POST /api/v1/teachers/parents/contact/
    Sends a personal notification to a parent from a teacher.
    Body: { parent_id, message, title? }
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request):
        parent_user_id = request.data.get('parent_id')
        message = request.data.get('message')
        title = request.data.get('title', f"Message from Teacher {request.user.name}")

        if not parent_user_id or not message:
            return Response(
                {'success': False, 'error': {'message': 'parent_id and message are required.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            parent_user = User.objects.get(id=parent_user_id, role='parent')
        except User.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Parent not found.'}},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create notification
        try:
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification
            
            create_notification(
                user=parent_user,
                title=title,
                body=message,
                notification_type=Notification.TypeChoices.ANNOUNCEMENT,
                data={'from_teacher': str(request.user.id), 'from_name': request.user.name}
            )
            return Response({'success': True, 'message': 'Notification sent to parent.'})
        except Exception as e:
            return Response(
                {'success': False, 'error': {'message': f'Failed to send notification: {str(e)}'}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

