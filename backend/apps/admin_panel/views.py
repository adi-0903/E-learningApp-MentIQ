"""
Admin Panel Views — Full platform management for Admin users.

Provides:
  • Dashboard with platform-wide statistics
  • Full CRUD for Teachers (list, create, detail, update, deactivate, reset password)
  • Full CRUD for Students (list, create, detail, update, deactivate, reset password)
  • Read-only views for Courses, Enrollments, Attendance, Quizzes, Payments,
    Announcements, and Live Classes
"""
from django.contrib.auth import get_user_model
from django.db.models import Sum, Q
from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import IsAdmin
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.quizzes.models import Quiz, QuizAttempt
from apps.lessons.models import Lesson
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.payments.models import Payment
from apps.announcements.models import Announcement
from apps.live_classes.models import LiveClass

from .serializers import (
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminCreateTeacherSerializer,
    AdminCreateStudentSerializer,
    AdminUpdateUserSerializer,
    AdminResetPasswordSerializer,
    AdminCourseListSerializer,
    AdminCourseDetailSerializer,
    AdminEnrollmentSerializer,
    AdminAttendanceSessionSerializer,
    AdminQuizSerializer,
    AdminPaymentSerializer,
    AdminAnnouncementSerializer,
    AdminCreateAnnouncementSerializer,
    AdminLiveClassSerializer,
)

User = get_user_model()


# ═══════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════

class AdminDashboardView(APIView):
    """
    GET /api/v1/admin/dashboard/
    Returns platform-wide statistics for the admin dashboard.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total_revenue = Payment.objects.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0

        recent_students = User.objects.filter(role='student').order_by('-created_at')[:5]
        recent_teachers = User.objects.filter(role='teacher').order_by('-created_at')[:5]

        data = {
            'total_students': User.objects.filter(role='student', is_active=True).count(),
            'total_teachers': User.objects.filter(role='teacher', is_active=True).count(),
            'total_courses': Course.objects.count(),
            'published_courses': Course.objects.filter(is_published=True).count(),
            'total_enrollments': Enrollment.objects.filter(is_active=True).count(),
            'total_quizzes': Quiz.objects.count(),
            'total_quiz_attempts': QuizAttempt.objects.count(),
            'total_lessons': Lesson.objects.count(),
            'total_payments': Payment.objects.count(),
            'total_revenue': str(total_revenue),
            'total_live_classes': LiveClass.objects.count(),
            'total_announcements': Announcement.objects.count(),
            'recent_students': AdminUserListSerializer(recent_students, many=True).data,
            'recent_teachers': AdminUserListSerializer(recent_teachers, many=True).data,
        }

        return Response({
            'success': True,
            'data': data,
        })


# ═══════════════════════════════════════════════════════════════
# TEACHER MANAGEMENT
# ═══════════════════════════════════════════════════════════════

class AdminTeacherListView(generics.ListAPIView):
    """
    GET /api/v1/admin/teachers/
    List all teachers with search & filter support.
    """
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'teacher_id']
    ordering_fields = ['name', 'email', 'created_at', 'last_login']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = User.objects.filter(role='teacher')
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({
            'success': True,
            'count': self.get_queryset().count(),
            'data': response.data,
        })


class AdminTeacherCreateView(generics.CreateAPIView):
    """
    POST /api/v1/admin/teachers/create/
    Admin creates a new teacher account.
    """
    serializer_class = AdminCreateTeacherSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send welcome email
        try:
            from apps.emails.tasks import send_welcome_email_task
            send_welcome_email_task.delay(str(user.id))
        except Exception:
            pass

        return Response({
            'success': True,
            'message': f'Teacher account created successfully. Teacher ID: {user.teacher_id}',
            'data': AdminUserDetailSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AdminTeacherDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/admin/teachers/<id>/
    View full details of a teacher.
    """
    serializer_class = AdminUserDetailSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.filter(role='teacher')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({
            'success': True,
            'data': AdminUserDetailSerializer(instance).data,
        })


class AdminTeacherUpdateView(generics.UpdateAPIView):
    """
    PUT/PATCH /api/v1/admin/teachers/<id>/update/
    Admin updates a teacher's profile.
    """
    serializer_class = AdminUpdateUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.filter(role='teacher')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Teacher profile updated successfully.',
            'data': AdminUserDetailSerializer(instance).data,
        })


class AdminTeacherDeactivateView(APIView):
    """
    POST /api/v1/admin/teachers/<id>/deactivate/
    Deactivate or reactivate a teacher account.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            teacher = User.objects.get(id=id, role='teacher')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        teacher.is_active = not teacher.is_active
        teacher.save(update_fields=['is_active', 'updated_at'])

        action = 'activated' if teacher.is_active else 'deactivated'
        return Response({
            'success': True,
            'message': f'Teacher account {action} successfully.',
            'data': {'is_active': teacher.is_active},
        })


class AdminTeacherResetPasswordView(APIView):
    """
    POST /api/v1/admin/teachers/<id>/reset-password/
    Admin resets a teacher's password.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            teacher = User.objects.get(id=id, role='teacher')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Teacher not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        teacher.set_password(serializer.validated_data['new_password'])
        teacher.save()

        return Response({
            'success': True,
            'message': 'Teacher password reset successfully.',
        })


class AdminTeacherSendAnnouncementView(APIView):
    """
    POST /api/v1/admin/teachers/<id>/send-announcement/
    Send a personal announcement to a specific teacher.
    Body: { title, content, priority? }
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            teacher = User.objects.get(id=id, role='teacher')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Teacher not found.'},
            }, status=status.HTTP_404_NOT_FOUND)

        title = request.data.get('title', '').strip()
        content = request.data.get('content', '').strip()
        priority = request.data.get('priority', 'high')

        if not title or not content:
            return Response({
                'success': False,
                'error': {'message': 'Title and content are required.'},
            }, status=status.HTTP_400_BAD_REQUEST)

        announcement = Announcement.objects.create(
            title=title,
            content=content,
            priority=priority,
            target_audience='teachers',
            target_student=teacher,
            created_by_admin=True,
            teacher=None,
        )

        # Send in-app notification
        try:
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification

            create_notification(
                user=teacher,
                title=f"📩 Personal Message: {title}",
                body=content[:100] + ('...' if len(content) > 100 else ''),
                notification_type=Notification.TypeChoices.ANNOUNCEMENT,
                data={'announcement_id': str(announcement.id), 'personal': True}
            )
        except Exception as e:
            print(f"Personal announcement notification failed: {e}")

        return Response({
            'success': True,
            'message': f'Personal announcement sent to {teacher.name}.',
        }, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════
# STUDENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════

class AdminStudentListView(generics.ListAPIView):
    """
    GET /api/v1/admin/students/
    List all students with search & filter support.
    """
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'student_id']
    ordering_fields = ['name', 'email', 'created_at', 'last_login']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = User.objects.filter(role='student')
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({
            'success': True,
            'count': self.get_queryset().count(),
            'data': response.data,
        })


class AdminStudentCreateView(generics.CreateAPIView):
    """
    POST /api/v1/admin/students/create/
    Admin creates a new student account.
    """
    serializer_class = AdminCreateStudentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send welcome email
        try:
            from apps.emails.tasks import send_welcome_email_task
            send_welcome_email_task.delay(str(user.id))
        except Exception:
            pass

        return Response({
            'success': True,
            'message': f'Student account created successfully. Student ID: {user.student_id}',
            'data': AdminUserDetailSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AdminStudentDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/admin/students/<id>/
    View full details of a student.
    """
    serializer_class = AdminUserDetailSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.filter(role='student')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({
            'success': True,
            'data': AdminUserDetailSerializer(instance).data,
        })


class AdminStudentUpdateView(generics.UpdateAPIView):
    """
    PUT/PATCH /api/v1/admin/students/<id>/update/
    Admin updates a student's profile.
    """
    serializer_class = AdminUpdateUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.filter(role='student')

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Student profile updated successfully.',
            'data': AdminUserDetailSerializer(instance).data,
        })


class AdminStudentDeactivateView(APIView):
    """
    POST /api/v1/admin/students/<id>/deactivate/
    Deactivate or reactivate a student account.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            student = User.objects.get(id=id, role='student')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        student.is_active = not student.is_active
        student.save(update_fields=['is_active', 'updated_at'])

        action = 'activated' if student.is_active else 'deactivated'
        return Response({
            'success': True,
            'message': f'Student account {action} successfully.',
            'data': {'is_active': student.is_active},
        })


class AdminStudentResetPasswordView(APIView):
    """
    POST /api/v1/admin/students/<id>/reset-password/
    Admin resets a student's password.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            student = User.objects.get(id=id, role='student')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Student not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student.set_password(serializer.validated_data['new_password'])
        student.save()

        return Response({
            'success': True,
            'message': 'Student password reset successfully.',
        })


class AdminStudentSendAnnouncementView(APIView):
    """
    POST /api/v1/admin/students/<id>/send-announcement/
    Send a personal announcement to a specific student.
    Body: { title, content, priority? }
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            student = User.objects.get(id=id, role='student')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Student not found.'},
            }, status=status.HTTP_404_NOT_FOUND)

        title = request.data.get('title', '').strip()
        content = request.data.get('content', '').strip()
        priority = request.data.get('priority', 'high')

        if not title or not content:
            return Response({
                'success': False,
                'error': {'message': 'Title and content are required.'},
            }, status=status.HTTP_400_BAD_REQUEST)

        announcement = Announcement.objects.create(
            title=title,
            content=content,
            priority=priority,
            target_audience='students',
            target_student=student,
            created_by_admin=True,
            teacher=None,
        )

        # Send in-app notification
        try:
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification

            create_notification(
                user=student,
                title=f"📩 Personal Message: {title}",
                body=content[:100] + ('...' if len(content) > 100 else ''),
                notification_type=Notification.TypeChoices.ANNOUNCEMENT,
                data={'announcement_id': str(announcement.id), 'personal': True}
            )
        except Exception as e:
            print(f"Personal announcement notification failed: {e}")

        return Response({
            'success': True,
            'message': f'Personal announcement sent to {student.name}.',
        }, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════
# COURSE OVERVIEW (Read-Only for Admin)
# ═══════════════════════════════════════════════════════════════

class AdminCourseListView(generics.ListAPIView):
    """
    GET /api/v1/admin/courses/
    List all courses on the platform.
    """
    serializer_class = AdminCourseListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'teacher__name', 'category']
    ordering_fields = ['title', 'created_at', 'price']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Course.objects.select_related('teacher').all()
        is_published = self.request.query_params.get('is_published')
        if is_published is not None:
            qs = qs.filter(is_published=is_published.lower() == 'true')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class AdminCourseDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/admin/courses/<id>/
    View full details of a course.
    """
    serializer_class = AdminCourseDetailSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'
    queryset = Course.objects.select_related('teacher').all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({
            'success': True,
            'data': AdminCourseDetailSerializer(instance).data,
        })


class AdminCourseTogglePublishView(APIView):
    """
    POST /api/v1/admin/courses/<id>/toggle-publish/
    Admin can publish or unpublish any course.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            course = Course.objects.get(id=id)
        except Course.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Course not found.',
            }, status=status.HTTP_404_NOT_FOUND)

        course.is_published = not course.is_published
        course.save(update_fields=['is_published', 'updated_at'])

        action = 'published' if course.is_published else 'unpublished'
        return Response({
            'success': True,
            'message': f'Course {action} successfully.',
            'data': {'is_published': course.is_published},
        })


# ═══════════════════════════════════════════════════════════════
# ENROLLMENT OVERVIEW
# ═══════════════════════════════════════════════════════════════

class AdminEnrollmentListView(generics.ListAPIView):
    """
    GET /api/v1/admin/enrollments/
    List all enrollments on the platform.
    """
    serializer_class = AdminEnrollmentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__name', 'student__email', 'course__title']
    ordering = ['-enrolled_at']

    def get_queryset(self):
        qs = Enrollment.objects.select_related('student', 'course', 'course__teacher').all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs


# ═══════════════════════════════════════════════════════════════
# ATTENDANCE OVERVIEW
# ═══════════════════════════════════════════════════════════════

class AdminAttendanceListView(generics.ListAPIView):
    """
    GET /api/v1/admin/attendance/
    List all attendance sessions on the platform.
    """
    serializer_class = AdminAttendanceSessionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['course__title', 'teacher__name']
    ordering = ['-date', '-start_time']

    def get_queryset(self):
        qs = AttendanceSession.objects.select_related('course', 'teacher').all()
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({
            'success': True,
            'count': self.get_queryset().count(),
            'data': response.data,
        })


class AdminAttendanceStudentSummaryView(APIView):
    """
    GET /api/v1/admin/attendance/students/
    Returns attendance summary for all students across all courses.
    Supports ?search= and ?course= query params.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.enrollments.models import Enrollment
        from django.db.models import Count, Q, Subquery, OuterRef, Value, FloatField
        from django.db.models.functions import Coalesce

        search = request.query_params.get('search', '')
        course_id = request.query_params.get('course', '')

        # Get all enrolled students
        students_qs = User.objects.filter(role='student', is_active=True)
        if search:
            students_qs = students_qs.filter(
                Q(name__icontains=search) | Q(email__icontains=search) | Q(student_id__icontains=search)
            )

        result = []
        for student in students_qs[:100]:  # Cap at 100
            # Get enrolled courses
            enrollments = Enrollment.objects.filter(
                student=student, is_active=True
            ).select_related('course')

            if course_id:
                enrollments = enrollments.filter(course_id=course_id)

            courses_data = []
            total_sessions = 0
            total_present = 0

            for enrollment in enrollments:
                course = enrollment.course
                # All sessions for this course
                sessions = AttendanceSession.objects.filter(course=course)
                session_count = sessions.count()

                # Student's attendance for this course
                present_count = AttendanceRecord.objects.filter(
                    session__course=course,
                    student=student,
                    is_present=True
                ).count()

                absent_count = AttendanceRecord.objects.filter(
                    session__course=course,
                    student=student,
                    is_present=False
                ).count()

                recorded = present_count + absent_count
                percentage = round((present_count / recorded) * 100, 1) if recorded > 0 else 0

                courses_data.append({
                    'course_id': str(course.id),
                    'course_title': course.title,
                    'total_sessions': session_count,
                    'present': present_count,
                    'absent': absent_count,
                    'percentage': percentage,
                })

                total_sessions += session_count
                total_present += present_count

            overall_records = AttendanceRecord.objects.filter(student=student)
            overall_total = overall_records.count()
            overall_present = overall_records.filter(is_present=True).count()
            overall_pct = round((overall_present / overall_total) * 100, 1) if overall_total > 0 else 0

            result.append({
                'student_id': str(student.id),
                'student_uid': student.uid,
                'name': student.name,
                'email': student.email,
                'profile_image_url': student.profile_image_url if hasattr(student, 'profile_image_url') else '',
                'overall_percentage': overall_pct,
                'total_present': overall_present,
                'total_records': overall_total,
                'courses': courses_data,
            })

        # Sort by attendance percentage ascending (lowest first)
        result.sort(key=lambda x: x['overall_percentage'])

        return Response({
            'success': True,
            'count': len(result),
            'data': result,
        })


class AdminSendAttendanceAlertView(APIView):
    """
    POST /api/v1/admin/attendance/alert/
    Send an attendance alert notification to a specific student.
    Body: { student_id, message }
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        student_id = request.data.get('student_id')
        message = request.data.get('message', '')

        if not student_id:
            return Response({
                'success': False,
                'error': {'message': 'student_id is required.'}
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = User.objects.get(id=student_id, role='student')
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Student not found.'}
            }, status=status.HTTP_404_NOT_FOUND)

        if not message:
            message = f"Your attendance is below the required threshold. Please ensure regular attendance to avoid academic penalties."

        try:
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification

            create_notification(
                user=student,
                title="⚠️ Attendance Alert",
                body=message,
                notification_type=Notification.TypeChoices.SYSTEM,
                data={'type': 'attendance_alert', 'from': 'admin'}
            )
        except Exception as e:
            return Response({
                'success': False,
                'error': {'message': f'Failed to send notification: {str(e)}'}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'success': True,
            'message': f'Attendance alert sent to {student.name} successfully.',
        })


# ═══════════════════════════════════════════════════════════════
# QUIZ OVERVIEW
# ═══════════════════════════════════════════════════════════════

class AdminQuizListView(generics.ListAPIView):
    """
    GET /api/v1/admin/quizzes/
    List all quizzes on the platform.
    """
    serializer_class = AdminQuizSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'course__title']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Quiz.objects.select_related('course').all()
        is_published = self.request.query_params.get('is_published')
        if is_published is not None:
            qs = qs.filter(is_published=is_published.lower() == 'true')
        return qs


# ═══════════════════════════════════════════════════════════════
# PAYMENT OVERVIEW
# ═══════════════════════════════════════════════════════════════

class AdminPaymentListView(generics.ListAPIView):
    """
    GET /api/v1/admin/payments/
    List all payment transactions.
    """
    serializer_class = AdminPaymentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__name', 'student__email', 'course__title']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Payment.objects.select_related('student', 'course').all()
        payment_status = self.request.query_params.get('status')
        if payment_status:
            qs = qs.filter(status=payment_status)
        return qs


# ═══════════════════════════════════════════════════════════════
# ANNOUNCEMENTS OVERVIEW
# ═══════════════════════════════════════════════════════════════

class AdminAnnouncementListView(generics.ListAPIView):
    """
    GET /api/v1/admin/announcements/
    List all announcements on the platform.
    """
    serializer_class = AdminAnnouncementSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'teacher__name', 'course__title']
    ordering = ['-created_at']

    def get_queryset(self):
        return Announcement.objects.select_related('teacher', 'course').all()


class AdminAnnouncementCreateView(APIView):
    """
    POST /api/v1/admin/announcements/create/
    Admin creates an announcement targeted to students, teachers, or all.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AdminCreateAnnouncementSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        announcement = serializer.save()

        # Send notifications to the targeted audience
        try:
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification

            title = f"Admin Announcement: {announcement.title}"
            body = announcement.content[:100] + ('...' if len(announcement.content) > 100 else '')
            data = {'announcement_id': str(announcement.id)}
            type_val = Notification.TypeChoices.ANNOUNCEMENT

            target = announcement.target_audience
            if target == 'students' or target == 'all':
                students = User.objects.filter(role='student', is_active=True)
                for s in students:
                    create_notification(
                        user=s, title=title, body=body,
                        notification_type=type_val, data=data
                    )
            if target == 'teachers' or target == 'all':
                teachers = User.objects.filter(role='teacher', is_active=True)
                for t in teachers:
                    create_notification(
                        user=t, title=title, body=body,
                        notification_type=type_val, data=data
                    )
        except Exception as e:
            print(f'Admin Announcement Notification Error: {e}')

        return Response({
            'success': True,
            'message': f'Announcement sent to {announcement.get_target_audience_display()}.',
            'data': AdminAnnouncementSerializer(announcement).data,
        }, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════
# LIVE CLASSES OVERVIEW
# ═══════════════════════════════════════════════════════════════

class AdminLiveClassListView(generics.ListAPIView):
    """
    GET /api/v1/admin/live-classes/
    List all live classes on the platform.
    """
    serializer_class = AdminLiveClassSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'teacher__name']
    ordering = ['-scheduled_at']

    def get_queryset(self):
        qs = LiveClass.objects.select_related('teacher', 'course').all()
        live_status = self.request.query_params.get('status')
        if live_status:
            qs = qs.filter(status=live_status)
        return qs


# ═══════════════════════════════════════════════════════════════
# PREMIUM PLAN MANAGEMENT
# ═══════════════════════════════════════════════════════════════

from .models import PremiumPlan, SchoolSubscription
from .serializers import AdminPremiumPlanSerializer


class AdminPremiumPlanListView(APIView):
    """
    GET  /api/v1/admin/premium/
    POST /api/v1/admin/premium/init/  (auto-create 3 default tiers)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        plans = PremiumPlan.objects.all().order_by('quarterly_price')
        
        # Also include current school subscription if any
        subscription = SchoolSubscription.objects.filter(is_active=True).first()
        active_plan_id = subscription.plan_id if subscription else None
        
        serializer = AdminPremiumPlanSerializer(plans, many=True)
        return Response({
            'success': True,
            'count': plans.count(),
            'active_plan_id': active_plan_id,
            'data': serializer.data,
        })


class AdminPremiumPlanInitView(APIView):
    """
    POST /api/v1/admin/premium/init/
    Auto-create the 3 default tiers if they don't exist.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        defaults = [
            {
                'tier': 'custom',
                'name': 'MentiQ Custom',
                'description': 'Customized pricing and features tailored specifically for your large school network.',
                'quarterly_price': 0.00,
                'annual_price': 0.00,
                'max_courses': -1,
                'max_downloads': -1,
                'ai_tutor_access': True,
                'live_classes_access': True,
                'certificate_access': True,
                'priority_support': True,
                'analytics_access': True,
                'custom_features': ['Everything in Enterprise', 'Custom development integration', 'Multi-school support'],
                'color': '#10b981',
                'badge_text': 'Let\'s Talk',
                'is_popular': False,
            },
            {
                'tier': 'pro',
                'name': 'MentiQ Pro',
                'description': 'Unlock advanced features and accelerate your learning journey.',
                'quarterly_price': 1999.00,
                'annual_price': 4999.00,
                'max_courses': -1,
                'max_downloads': -1,
                'ai_tutor_access': True,
                'live_classes_access': True,
                'certificate_access': True,
                'priority_support': False,
                'analytics_access': True,
                'custom_features': [
                    'Unlimited courses', 'AI-powered tutoring',
                    'Live classes', 'Certificates', 'Advanced analytics',
                ],
                'color': '#7c3aed',
                'badge_text': 'Most Popular',
                'is_popular': True,
            },
            {
                'tier': 'enterprise',
                'name': 'MentiQ Enterprise',
                'description': 'Complete platform access with priority support for institutions.',
                'quarterly_price': 3999.00,
                'annual_price': 8999.00,
                'max_courses': -1,
                'max_downloads': -1,
                'ai_tutor_access': True,
                'live_classes_access': True,
                'certificate_access': True,
                'priority_support': True,
                'analytics_access': True,
                'custom_features': [
                    'Everything in Pro', 'Priority 24/7 support',
                    'Custom branding', 'API access', 'Team management',
                    'Dedicated account manager',
                ],
                'color': '#f59e0b',
                'badge_text': 'Best Value',
                'is_popular': False,
            },
        ]

        created = []
        for plan_data in defaults:
            tier = plan_data['tier']
            if 'price' in plan_data:
                del plan_data['price']
            obj, was_created = PremiumPlan.objects.get_or_create(
                tier=tier, defaults=plan_data
            )
            if was_created:
                created.append(tier)

        plans = PremiumPlan.objects.all().order_by('quarterly_price')
        return Response({
            'success': True,
            'message': f'Initialized {len(created)} plans.' if created else 'All plans already exist.',
            'created': created,
            'data': AdminPremiumPlanSerializer(plans, many=True).data,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class AdminPremiumPlanSubscribeView(APIView):
    """
    POST /api/v1/admin/premium/<id>/subscribe/
    Marks the given premium plan as the active plan for the school.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, id):
        try:
            plan = PremiumPlan.objects.get(id=id)
        except PremiumPlan.DoesNotExist:
            return Response({'success': False, 'message': 'Plan not found.'}, status=404)
            
        billing_cycle = request.data.get('billing_cycle', 'annual')
        
        # Deactivate current subscriptions
        SchoolSubscription.objects.update(is_active=False)
        
        # Create new subscription
        from datetime import timedelta
        from django.utils import timezone
        
        end_date = timezone.now() + timedelta(days=365) if billing_cycle == 'annual' else timezone.now() + timedelta(days=90)
        
        subscription = SchoolSubscription.objects.create(
            plan=plan,
            billing_cycle=billing_cycle,
            is_active=True,
            end_date=end_date
        )
        
        return Response({
            'success': True,
            'message': f'Successfully subscribed your school to {plan.name}!'
        })


class AdminPremiumPlanDetailView(APIView):
    """
    GET    /api/v1/admin/premium/<id>/
    PUT    /api/v1/admin/premium/<id>/
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_object(self, id):
        try:
            return PremiumPlan.objects.get(id=id)
        except PremiumPlan.DoesNotExist:
            return None

    def get(self, request, id):
        plan = self.get_object(id)
        if not plan:
            return Response(
                {'success': False, 'message': 'Plan not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({
            'success': True,
            'data': AdminPremiumPlanSerializer(plan).data,
        })

    def put(self, request, id):
        plan = self.get_object(id)
        if not plan:
            return Response(
                {'success': False, 'message': 'Plan not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AdminPremiumPlanSerializer(plan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': f'{plan.name} updated successfully.',
            'data': AdminPremiumPlanSerializer(plan).data,
        })

