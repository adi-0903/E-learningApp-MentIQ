from rest_framework import serializers
from .models import Announcement


class AnnouncementListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True, default=None)
    is_author = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'is_pinned',
            'teacher', 'teacher_name', 'course', 'course_title', 'attachment',
            'created_at', 'is_author'
        ]

    def get_is_author(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.teacher == request.user
        return False


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['title', 'content', 'course', 'priority', 'is_pinned', 'attachment']

    def create(self, validated_data):
        validated_data['teacher'] = self.context['request'].user
        return super().create(validated_data)
