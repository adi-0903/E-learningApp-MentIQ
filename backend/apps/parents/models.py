import uuid
from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel

class ParentAccount(TimeStampedModel):
    """
    Model representing a Parent profile, linked to a User.
    A parent can be linked to multiple student accounts (children).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='parent_profile',
        limit_choices_to={'role': 'parent'}
    )
    # Linked students (children)
    children = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='parents',
        blank=True,
        limit_choices_to={'role': 'student'}
    )
    
    # Subscription/Notification settings
    receive_weekly_reports = models.BooleanField(default=True)
    receive_immediate_alerts = models.BooleanField(default=True) # e.g. missed classes

    class Meta:
        db_table = 'parent_accounts'
        verbose_name = 'Parent Account'
        verbose_name_plural = 'Parent Accounts'

    def __str__(self):
        return f"Parent: {self.user.name}"


class StudentLinkRequest(TimeStampedModel):
    """
    Handles the handshake between a parent and a student.
    A parent enters a student's ID and waits for approval.
    """
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'

    parent = models.ForeignKey(ParentAccount, on_delete=models.CASCADE, related_name='link_requests')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='parent_link_requests',
        limit_choices_to={'role': 'student'}
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    
    class Meta:
        db_table = 'student_link_requests'
        unique_together = ('parent', 'student')

    def __str__(self):
        return f"{self.parent} -> {self.student} ({self.status})"


class WeeklyProgressReport(TimeStampedModel):
    """
    Summary of a student's performance for a specific week.
    Generated on weekends for parents.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='weekly_reports'
    )
    parent = models.ForeignKey(ParentAccount, on_delete=models.CASCADE, related_name='child_reports')
    
    week_start_date = models.DateField()
    week_end_date = models.DateField()
    
    # Aggregated Metrics
    quizzes_completed = models.PositiveIntegerField(default=0)
    average_quiz_score = models.FloatField(default=0.0)
    lessons_watched = models.PositiveIntegerField(default=0)
    badges_earned = models.PositiveIntegerField(default=0)
    attendance_rate = models.FloatField(default=0.0, help_text="Percentage of live classes attended")
    time_spent_seconds = models.PositiveBigIntegerField(default=0)
    
    # Textual Summary
    ai_summary = models.TextField(blank=True, default="", help_text="AI-generated textual summary of the week")
    teacher_notes = models.TextField(blank=True, default="", help_text="Aggregated notes from teachers during the week")
    
    # Status
    is_sent = models.BooleanField(default=False)
    report_pdf_url = models.URLField(blank=True, default="", help_text="URL to generated PDF report")

    class Meta:
        db_table = 'weekly_progress_reports'
        ordering = ['-week_end_date']

    def __str__(self):
        return f"Report for {self.student.name} - Week ending {self.week_end_date}"
