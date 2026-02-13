from rest_framework import serializers
from .models import Notification, NotificationSetting


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'body', 'notification_type', 'is_read', 'data', 'created_at']
        read_only_fields = fields


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = [
            'announcements', 'assignments', 'quizzes', 'courses', 
            'general', 'sound', 'vibration', 'email_notifications'
        ]
