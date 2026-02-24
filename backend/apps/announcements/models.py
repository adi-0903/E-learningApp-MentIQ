"""
Announcement models - Course-scoped or global announcements by teachers/admins.
"""
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class Announcement(TimeStampedModel):
    """An announcement from a teacher or admin."""

    class PriorityChoices(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    class AudienceChoices(models.TextChoices):
        ALL = 'all', 'Everyone'
        STUDENTS = 'students', 'Students Only'
        TEACHERS = 'teachers', 'Teachers Only'

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='announcements',
        null=True,
        blank=True,
        help_text='The author. Null for admin-created announcements.',
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='announcements',
        null=True,
        blank=True,
        help_text='Null = global announcement',
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(
        max_length=10,
        choices=PriorityChoices.choices,
        default=PriorityChoices.NORMAL,
    )
    is_pinned = models.BooleanField(default=False)
    attachment = models.FileField(upload_to='announcements/%Y/%m/', blank=True, null=True)
    target_audience = models.CharField(
        max_length=10,
        choices=AudienceChoices.choices,
        default=AudienceChoices.ALL,
        help_text='Who can see this announcement',
    )
    created_by_admin = models.BooleanField(
        default=False,
        help_text='True if created by admin rather than a teacher',
    )

    class Meta:
        db_table = 'announcements'
        ordering = ['-is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['course', '-created_at']),
            models.Index(fields=['teacher', '-created_at']),
            models.Index(fields=['target_audience', '-created_at']),
        ]

    def __str__(self):
        scope = self.course.title if self.course else 'Global'
        audience = f" → {self.get_target_audience_display()}" if self.target_audience != 'all' else ''
        return f"[{scope}]{audience} {self.title}"
