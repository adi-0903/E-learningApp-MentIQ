"""
Email Models - Tracks all emails sent/received for the MentiQ platform.
"""
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class EmailLog(TimeStampedModel):
    """Records every outbound email for audit + analytics."""

    class StatusChoices(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SENT = 'sent', 'Sent'
        FAILED = 'failed', 'Failed'

    class TypeChoices(models.TextChoices):
        WELCOME = 'welcome', 'Welcome'
        PASSWORD_RESET = 'password_reset', 'Password Reset'
        PROMOTIONAL = 'promotional', 'Promotional'
        ANNOUNCEMENT = 'announcement', 'Announcement'
        CONTACT_REPLY = 'contact_reply', 'Contact Reply'
        GENERIC = 'generic', 'Generic'

    recipient_email = models.EmailField(db_index=True)
    recipient_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=500)
    email_type = models.CharField(
        max_length=20, choices=TypeChoices.choices, default=TypeChoices.GENERIC
    )
    status = models.CharField(
        max_length=10, choices=StatusChoices.choices, default=StatusChoices.PENDING
    )
    error_message = models.TextField(blank=True)
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='sent_emails',
    )

    class Meta:
        db_table = 'email_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['email_type', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.email_type}] → {self.recipient_email} ({self.status})"


class EmailCampaign(TimeStampedModel):
    """Promotional email campaign (sent in bulk via Celery)."""

    class StatusChoices(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SCHEDULED = 'scheduled', 'Scheduled'
        SENDING = 'sending', 'Sending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    class AudienceChoices(models.TextChoices):
        ALL = 'all', 'All Users'
        STUDENTS = 'students', 'Students Only'
        TEACHERS = 'teachers', 'Teachers Only'

    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=500)
    body_html = models.TextField(help_text='HTML content of the email')
    body_text = models.TextField(blank=True, help_text='Plain-text fallback')
    audience = models.CharField(
        max_length=20, choices=AudienceChoices.choices, default=AudienceChoices.ALL
    )
    status = models.CharField(
        max_length=15, choices=StatusChoices.choices, default=StatusChoices.DRAFT
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='email_campaigns',
    )

    class Meta:
        db_table = 'email_campaigns'
        ordering = ['-created_at']

    def __str__(self):
        return f"📧 {self.title} [{self.status}] → {self.audience}"


class ContactMessage(TimeStampedModel):
    """Stores contact form submissions from the app."""

    class StatusChoices(models.TextChoices):
        NEW = 'new', 'New'
        READ = 'read', 'Read'
        REPLIED = 'replied', 'Replied'
        CLOSED = 'closed', 'Closed'

    sender_name = models.CharField(max_length=255)
    sender_email = models.EmailField()
    subject = models.CharField(max_length=500)
    message = models.TextField()
    status = models.CharField(
        max_length=10, choices=StatusChoices.choices, default=StatusChoices.NEW
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='contact_messages',
    )
    reply_text = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'contact_messages'
        ordering = ['-created_at']

    def __str__(self):
        return f"✉️  From {self.sender_name} ({self.sender_email}): {self.subject[:40]}"


class InboxEmail(TimeStampedModel):
    """Emails pulled from Gmail IMAP inbox."""

    sender_email = models.EmailField(db_index=True)
    sender_name = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=500, blank=True)
    body = models.TextField(blank=True)
    received_at = models.DateTimeField()
    message_id = models.CharField(max_length=500, unique=True, db_index=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = 'inbox_emails'
        ordering = ['-received_at']

    def __str__(self):
        return f"📥 From {self.sender_email}: {self.subject[:40]}"
