"""
Admin Panel URL Configuration

All endpoints are prefixed with /api/v1/admin/ and require admin authentication.
"""
from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # ── Dashboard ─────────────────────────────────────────────
    path('dashboard/', views.AdminDashboardView.as_view(), name='dashboard'),

    # ── Teacher Management ────────────────────────────────────
    path('teachers/', views.AdminTeacherListView.as_view(), name='teacher-list'),
    path('teachers/create/', views.AdminTeacherCreateView.as_view(), name='teacher-create'),
    path('teachers/<uuid:id>/', views.AdminTeacherDetailView.as_view(), name='teacher-detail'),
    path('teachers/<uuid:id>/update/', views.AdminTeacherUpdateView.as_view(), name='teacher-update'),
    path('teachers/<uuid:id>/deactivate/', views.AdminTeacherDeactivateView.as_view(), name='teacher-deactivate'),
    path('teachers/<uuid:id>/reset-password/', views.AdminTeacherResetPasswordView.as_view(), name='teacher-reset-password'),
    path('teachers/<uuid:id>/send-announcement/', views.AdminTeacherSendAnnouncementView.as_view(), name='teacher-send-announcement'),

    # ── Student Management ────────────────────────────────────
    path('students/', views.AdminStudentListView.as_view(), name='student-list'),
    path('students/create/', views.AdminStudentCreateView.as_view(), name='student-create'),
    path('students/<uuid:id>/', views.AdminStudentDetailView.as_view(), name='student-detail'),
    path('students/<uuid:id>/update/', views.AdminStudentUpdateView.as_view(), name='student-update'),
    path('students/<uuid:id>/deactivate/', views.AdminStudentDeactivateView.as_view(), name='student-deactivate'),
    path('students/<uuid:id>/reset-password/', views.AdminStudentResetPasswordView.as_view(), name='student-reset-password'),
    path('students/<uuid:id>/send-announcement/', views.AdminStudentSendAnnouncementView.as_view(), name='student-send-announcement'),

    # ── Course Overview ───────────────────────────────────────
    path('courses/', views.AdminCourseListView.as_view(), name='course-list'),
    path('courses/<uuid:id>/', views.AdminCourseDetailView.as_view(), name='course-detail'),
    path('courses/<uuid:id>/toggle-publish/', views.AdminCourseTogglePublishView.as_view(), name='course-toggle-publish'),

    # ── Enrollment Overview ───────────────────────────────────
    path('enrollments/', views.AdminEnrollmentListView.as_view(), name='enrollment-list'),

    # ── Attendance Overview ───────────────────────────────────
    path('attendance/', views.AdminAttendanceListView.as_view(), name='attendance-list'),
    path('attendance/students/', views.AdminAttendanceStudentSummaryView.as_view(), name='attendance-students'),
    path('attendance/alert/', views.AdminSendAttendanceAlertView.as_view(), name='attendance-alert'),

    # ── Quiz Overview ─────────────────────────────────────────
    path('quizzes/', views.AdminQuizListView.as_view(), name='quiz-list'),

    # ── Payment Overview ──────────────────────────────────────
    path('payments/', views.AdminPaymentListView.as_view(), name='payment-list'),

    # ── Announcement Overview ─────────────────────────────────
    path('announcements/', views.AdminAnnouncementListView.as_view(), name='announcement-list'),
    path('announcements/create/', views.AdminAnnouncementCreateView.as_view(), name='announcement-create'),

    # ── Live Class Overview ───────────────────────────────────
    path('live-classes/', views.AdminLiveClassListView.as_view(), name='live-class-list'),

    # ── Premium Plan Management ────────────────────────────────
    path('premium/', views.AdminPremiumPlanListView.as_view(), name='premium-list'),
    path('premium/init/', views.AdminPremiumPlanInitView.as_view(), name='premium-init'),
    path('premium/<uuid:id>/', views.AdminPremiumPlanDetailView.as_view(), name='premium-detail'),
    path('premium/<uuid:id>/subscribe/', views.AdminPremiumPlanSubscribeView.as_view(), name='premium-subscribe'),
]
