from django.urls import path
from . import views

app_name = 'courses'

urlpatterns = [
    path('', views.CourseListCreateView.as_view(), name='list-create'),
    path('<uuid:id>/', views.CourseDetailView.as_view(), name='detail'),
    path('<uuid:course_id>/reviews/', views.CourseReviewListCreateView.as_view(), name='course-reviews'),
]
