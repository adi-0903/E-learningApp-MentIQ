from django.urls import path
from .views import CourseStudentsView, AttendanceSessionCreateView, AttendanceHistoryView

urlpatterns = [
    path('course-students/<uuid:course_id>/', CourseStudentsView.as_view(), name='course-students'),
    path('mark/', AttendanceSessionCreateView.as_view(), name='mark-attendance'),
    path('history/', AttendanceHistoryView.as_view(), name='attendance-history'),
]
