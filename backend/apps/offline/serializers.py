"""
Serializers for offline mode - MicroLesson and OfflineDownload.
"""
from rest_framework import serializers
from .models import MicroLesson, OfflineDownload


class MicroLessonListSerializer(serializers.ModelSerializer):
    """Lightweight listing for available micro-lessons."""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    course_title = serializers.CharField(source='lesson.course.title', read_only=True)
    course_id = serializers.UUIDField(source='lesson.course.id', read_only=True)
    lesson_id = serializers.UUIDField(source='lesson.id', read_only=True)
    file_size_mb = serializers.FloatField(read_only=True)
    is_ready = serializers.BooleanField(read_only=True)
    is_downloaded = serializers.SerializerMethodField()

    class Meta:
        model = MicroLesson
        fields = [
            'id', 'lesson_id', 'lesson_title', 'course_id', 'course_title',
            'compressed_video_url', 'summary_text', 'file_size_bytes',
            'file_size_mb', 'duration_seconds', 'compression_status',
            'is_ready', 'is_downloaded', 'created_at',
        ]

    def get_is_downloaded(self, obj):
        """Check if the requesting user has already downloaded this."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.downloads.filter(
                student=request.user,
                download_status=OfflineDownload.DownloadStatus.COMPLETED,
            ).exists()
        return False


class MicroLessonDetailSerializer(serializers.ModelSerializer):
    """Full detail view of a micro-lesson."""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_description = serializers.CharField(source='lesson.description', read_only=True)
    course_title = serializers.CharField(source='lesson.course.title', read_only=True)
    course_id = serializers.UUIDField(source='lesson.course.id', read_only=True)
    lesson_id = serializers.UUIDField(source='lesson.id', read_only=True)
    file_size_mb = serializers.FloatField(read_only=True)
    is_ready = serializers.BooleanField(read_only=True)
    download_info = serializers.SerializerMethodField()

    class Meta:
        model = MicroLesson
        fields = [
            'id', 'lesson_id', 'lesson_title', 'lesson_description',
            'course_id', 'course_title',
            'compressed_video_url', 'summary_text',
            'file_size_bytes', 'file_size_mb', 'duration_seconds',
            'compression_status', 'compression_ratio',
            'original_video_url', 'is_ready', 'download_info',
            'created_at', 'updated_at',
        ]

    def get_download_info(self, obj):
        """Return download info for the requesting user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            download = obj.downloads.filter(student=request.user).first()
            if download:
                return OfflineDownloadSerializer(download).data
        return None


class OfflineDownloadSerializer(serializers.ModelSerializer):
    """Serializer for tracking download state and offline progress."""
    lesson_title = serializers.CharField(
        source='micro_lesson.lesson.title', read_only=True
    )
    course_title = serializers.CharField(
        source='micro_lesson.lesson.course.title', read_only=True
    )
    compressed_video_url = serializers.URLField(
        source='micro_lesson.compressed_video_url', read_only=True
    )
    file_size_bytes = serializers.IntegerField(
        source='micro_lesson.file_size_bytes', read_only=True
    )
    duration_seconds = serializers.IntegerField(
        source='micro_lesson.duration_seconds', read_only=True
    )

    class Meta:
        model = OfflineDownload
        fields = [
            'id', 'micro_lesson', 'lesson_title', 'course_title',
            'compressed_video_url', 'file_size_bytes', 'duration_seconds',
            'download_status', 'downloaded_at',
            'progress_percentage', 'last_position_seconds',
            'is_lesson_completed', 'completed_at_offline',
            'last_synced_at', 'device_info',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InitiateDownloadSerializer(serializers.Serializer):
    """Serializer for initiating a micro-lesson download."""
    micro_lesson_id = serializers.UUIDField()
    device_info = serializers.CharField(max_length=255, required=False, default='')

    def validate_micro_lesson_id(self, value):
        try:
            ml = MicroLesson.objects.get(id=value)
        except MicroLesson.DoesNotExist:
            raise serializers.ValidationError('Micro-lesson not found.')
        if not ml.is_ready:
            raise serializers.ValidationError(
                'This micro-lesson is not ready for download yet. '
                f'Current status: {ml.compression_status}.'
            )
        return value


class SyncProgressSerializer(serializers.Serializer):
    """Serializer for syncing offline progress back to server."""
    download_id = serializers.UUIDField()
    progress_percentage = serializers.FloatField(min_value=0, max_value=100)
    last_position_seconds = serializers.IntegerField(min_value=0)
    is_lesson_completed = serializers.BooleanField(required=False, default=False)
    completed_at_offline = serializers.DateTimeField(required=False, allow_null=True)


class BulkSyncSerializer(serializers.Serializer):
    """Serializer for bulk-syncing multiple offline progress records."""
    items = SyncProgressSerializer(many=True)
