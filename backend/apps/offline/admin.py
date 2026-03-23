from django.contrib import admin
from .models import MicroLesson, OfflineDownload


@admin.register(MicroLesson)
class MicroLessonAdmin(admin.ModelAdmin):
    list_display = [
        'lesson', 'compression_status', 'file_size_mb',
        'duration_seconds', 'compression_ratio', 'created_at',
    ]
    list_filter = ['compression_status', 'created_at']
    search_fields = ['lesson__title', 'lesson__course__title']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def file_size_mb(self, obj):
        return obj.file_size_mb
    file_size_mb.short_description = 'Size (MB)'


@admin.register(OfflineDownload)
class OfflineDownloadAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'micro_lesson', 'download_status',
        'progress_percentage', 'is_lesson_completed',
        'downloaded_at', 'last_synced_at',
    ]
    list_filter = ['download_status', 'is_lesson_completed', 'created_at']
    search_fields = [
        'student__name', 'student__email',
        'micro_lesson__lesson__title',
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
