from django.urls import path
from . import views

app_name = 'progress'

urlpatterns = [
    # Original Progress Endpoints
    path('complete/', views.MarkLessonCompleteView.as_view(), name='mark-complete'),
    path('course/<uuid:course_id>/', views.CourseProgressView.as_view(), name='course-progress'),
    
    # 🎮 Badge System Endpoints
    path('badges/', views.AvailableBadgesView.as_view(), name='available-badges'),
    path('my-badges/', views.MyBadgesView.as_view(), name='my-badges'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('badges/earn/', views.AwardBadgeView.as_view(), name='award-badge'),
]
