"""
Lesson serializers.
"""
from rest_framework import serializers
from .models import Lesson


class LessonListSerializer(serializers.ModelSerializer):
    """Lightweight lesson listing."""
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'sequence_number',
            'file_type', 'video_url', 'duration', 'created_at',
        ]


class LessonDetailSerializer(serializers.ModelSerializer):
    """Full lesson detail with all content and media."""
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'course_title', 'title', 'description',
            'content', 'sequence_number', 'video_url', 'video_file',
            'attachment', 'file_type', 'duration',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LessonCreateSerializer(serializers.ModelSerializer):
    """Create a new lesson (teacher only)."""
    sequence_number = serializers.IntegerField(required=False, default=None)

    class Meta:
        model = Lesson
        fields = [
            'course', 'title', 'description', 'content',
            'sequence_number', 'video_url', 'video_file',
            'attachment', 'file_type', 'duration',
        ]
        # Disable DRF's auto UniqueTogetherValidator — we handle it manually in validate()
        validators = []

    def validate(self, attrs):
        course = attrs.get('course')
        request = self.context.get('request')
        if request and course.teacher != request.user:
            raise serializers.ValidationError('You can only add lessons to your own courses.')

        # Auto-calculate sequence_number — always use max+1 from ALL lessons (including soft-deleted)
        from django.db.models import Max
        max_seq = Lesson.all_objects.filter(course=course).aggregate(
            max_seq=Max('sequence_number')
        )['max_seq'] or 0
        attrs['sequence_number'] = max_seq + 1

        return attrs


class LessonUpdateSerializer(serializers.ModelSerializer):
    """Update a lesson."""
    class Meta:
        model = Lesson
        fields = [
            'title', 'description', 'content', 'sequence_number',
            'video_url', 'video_file', 'attachment', 'file_type', 'duration',
        ]
