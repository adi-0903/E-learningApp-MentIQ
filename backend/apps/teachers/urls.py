from django.urls import path
from . import views

app_name = 'teachers'

urlpatterns = [
    path('dashboard/', views.TeacherDashboardView.as_view(), name='dashboard'),
    path('dashboard-stats/', views.TeacherDashboardStatsView.as_view(), name='dashboard-stats'),
    path('courses/', views.TeacherCoursesView.as_view(), name='courses'),
    path('students/', views.TeacherStudentsView.as_view(), name='students'),
    path('students/<uuid:student_id>/', views.TeacherStudentDetailView.as_view(), name='student-detail'),
    path('courses/<uuid:course_id>/students/', views.TeacherCourseStudentsView.as_view(), name='course-students'),
    path('bookings/', views.TeacherSessionBookingListView.as_view(), name='bookings-list'),
    path('bookings/<int:pk>/', views.TeacherSessionBookingUpdateView.as_view(), name='bookings-update'),
    path('parents/', views.TeacherParentListView.as_view(), name='parents-list'),
    path('parents/contact/', views.TeacherParentContactView.as_view(), name='parents-contact'),
]
