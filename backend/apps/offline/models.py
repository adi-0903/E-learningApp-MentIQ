"""
Offline Mode Models
- MicroLesson: Bite-sized, compressed version of a lesson for offline consumption.
- OfflineDownload: Tracks which students have downloaded which micro-lessons.
"""
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class MicroLesson(TimeStampedModel):
    """
    A compressed, mobile-optimized version of a full Lesson.
    Created automatically when a teacher uploads lesson content.
    Contains a compressed video and a text summary for offline use.
    """

    class CompressionStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    lesson = models.OneToOneField(
        'lessons.Lesson',
        on_delete=models.CASCADE,
        related_name='micro_lesson',
        help_text='The parent lesson this micro-lesson is derived from.',
    )
    # Compressed video for mobile download
    compressed_video_url = models.URLField(
        blank=True,
        default='',
        help_text='URL of the compressed video (typically Cloudinary).',
    )
    # Text summary for offline reading
    summary_text = models.TextField(
        blank=True,
        default='',
        help_text='Distilled text summary of the lesson content.',
    )
    # Metadata
    file_size_bytes = models.BigIntegerField(
        default=0,
        help_text='Size of the compressed video in bytes.',
    )
    duration_seconds = models.PositiveIntegerField(
        default=0,
        help_text='Duration of the compressed video in seconds.',
    )
    compression_status = models.CharField(
        max_length=20,
        choices=CompressionStatus.choices,
        default=CompressionStatus.PENDING,
        db_index=True,
    )
    compression_ratio = models.FloatField(
        default=0.0,
        help_text='Ratio of compressed size to original size (e.g. 0.35 = 35%).',
    )
    # Original file reference for re-compression
    original_video_url = models.URLField(
        blank=True,
        default='',
        help_text='URL of the original (full-quality) video.',
    )

    class Meta:
        db_table = 'micro_lessons'
        verbose_name = 'Micro Lesson'
        verbose_name_plural = 'Micro Lessons'
        ordering = ['-created_at']

    def __str__(self):
        return f"MicroLesson: {self.lesson.title}"

    @property
    def file_size_mb(self):
        """Return file size in megabytes, rounded to 2 decimals."""
        if self.file_size_bytes:
            return round(self.file_size_bytes / (1024 * 1024), 2)
        return 0.0

    @property
    def is_ready(self):
        """Whether this micro-lesson is ready for download."""
        return self.compression_status == self.CompressionStatus.COMPLETED


class OfflineDownload(TimeStampedModel):
    """
    Tracks a student's download of a micro-lesson for offline access.
    Used for analytics, storage management, and sync tracking.
    """

    class DownloadStatus(models.TextChoices):
        INITIATED = 'initiated', 'Initiated'
        DOWNLOADING = 'downloading', 'Downloading'
        COMPLETED = 'completed', 'Completed'
        EXPIRED = 'expired', 'Expired'
        DELETED = 'deleted', 'Deleted'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='offline_downloads',
        limit_choices_to={'role': 'student'},
    )
    micro_lesson = models.ForeignKey(
        MicroLesson,
        on_delete=models.CASCADE,
        related_name='downloads',
    )
    # Progress tracking
    download_status = models.CharField(
        max_length=20,
        choices=DownloadStatus.choices,
        default=DownloadStatus.INITIATED,
        db_index=True,
    )
    downloaded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the download was completed on device.',
    )
    # Offline progress sync
    progress_percentage = models.FloatField(
        default=0.0,
        help_text='Lesson completion progress tracked offline (0-100).',
    )
    last_position_seconds = models.PositiveIntegerField(
        default=0,
        help_text='Last playback position in the video (for resume).',
    )
    is_lesson_completed = models.BooleanField(
        default=False,
        help_text='Whether the student completed the lesson offline.',
    )
    completed_at_offline = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp of offline completion (synced later).',
    )
    # Sync tracking
    last_synced_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last time this record synced with the server.',
    )
    device_info = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Device identifier for multi-device support.',
    )

    class Meta:
        db_table = 'offline_downloads'
        verbose_name = 'Offline Download'
        verbose_name_plural = 'Offline Downloads'
        ordering = ['-created_at']
        unique_together = ['student', 'micro_lesson']
        indexes = [
            models.Index(fields=['student', 'download_status']),
            models.Index(fields=['micro_lesson', 'download_status']),
        ]

    def __str__(self):
        return f"{self.student.name} → {self.micro_lesson.lesson.title}"
