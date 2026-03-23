from rest_framework import serializers
from .models import Announcement


class AnnouncementListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True, default='Admin')
    course_title = serializers.CharField(source='course.title', read_only=True, default=None)
    target_student_name = serializers.CharField(source='target_student.name', read_only=True, default=None)
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'is_pinned',
            'teacher', 'teacher_name', 'course', 'course_title', 'attachment',
            'target_audience', 'target_student', 'target_student_name', 'created_by_admin',
            'created_at', 'is_author'
        ]

    def get_is_author(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if request.user.role == 'admin' and obj.created_by_admin:
                return True
            return obj.teacher == request.user
        return False


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['title', 'content', 'course', 'priority', 'is_pinned', 'attachment', 'target_audience']

    def create(self, validated_data):
        validated_data['teacher'] = self.context['request'].user
        return super().create(validated_data)
