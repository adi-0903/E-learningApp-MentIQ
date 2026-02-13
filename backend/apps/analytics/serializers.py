from rest_framework import serializers
from .models import CourseAnalytics, DailyAnalytics, UserActivityLog


class DailyAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAnalytics
        fields = '__all__'


class CourseAnalyticsSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = CourseAnalytics
        fields = '__all__'


class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityLog
        fields = ['id', 'start_time', 'end_time', 'duration_seconds', 'device_info', 'created_at']
        read_only_fields = ['id', 'start_time', 'created_at']
