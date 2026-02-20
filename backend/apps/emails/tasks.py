"""
Email Celery Tasks - Async email sending and scheduled inbox polling.
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email_task(self, user_id: int):
    """Send welcome email to a new user (async)."""
    try:
        from django.contrib.auth import get_user_model
        from .email_utils import send_welcome_email
        User = get_user_model()
        user = User.objects.get(id=user_id)
        success = send_welcome_email(user)
        if not success:
            raise Exception(f"Failed to send welcome email to {user.email}")
        logger.info(f"✅ Welcome email sent to {user.email}")
    except Exception as exc:
        logger.error(f"Welcome email task error: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=120)
def send_campaign_task(self, campaign_id: int):
    """
    Send a bulk promotional email campaign to all target users.
    Updates campaign progress counters in real-time.
    """
    try:
        from django.contrib.auth import get_user_model
        from .models import EmailCampaign
        from .email_utils import send_email, promotional_email_html

        User = get_user_model()
        campaign = EmailCampaign.objects.get(id=campaign_id)

        if campaign.status not in [
            EmailCampaign.StatusChoices.DRAFT,
            EmailCampaign.StatusChoices.SCHEDULED,
        ]:
            logger.warning(f"Campaign {campaign_id} already in state {campaign.status}, skipping.")
            return

        # Mark as sending
        campaign.status = EmailCampaign.StatusChoices.SENDING
        campaign.save(update_fields=['status'])

        # Build recipient queryset
        if campaign.audience == EmailCampaign.AudienceChoices.STUDENTS:
            users = User.objects.filter(role='student', is_active=True)
        elif campaign.audience == EmailCampaign.AudienceChoices.TEACHERS:
            users = User.objects.filter(role='teacher', is_active=True)
        else:
            users = User.objects.filter(is_active=True)

        campaign.total_recipients = users.count()
        campaign.save(update_fields=['total_recipients'])

        sent = 0
        failed = 0
        html_content = promotional_email_html(campaign.subject, campaign.body_html)

        for user in users.iterator():
            try:
                name = getattr(user, 'name', '') or user.email
                success = send_email(
                    to_email=user.email,
                    to_name=name,
                    subject=campaign.subject,
                    html_content=html_content,
                    text_content=campaign.body_text,
                    email_type='promotional',
                )
                if success:
                    sent += 1
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                logger.error(f"Error sending campaign to {user.email}: {e}")

        campaign.status = EmailCampaign.StatusChoices.COMPLETED
        campaign.sent_count = sent
        campaign.failed_count = failed
        campaign.sent_at = timezone.now()
        campaign.save(update_fields=['status', 'sent_count', 'failed_count', 'sent_at'])

        logger.info(f"📧 Campaign '{campaign.title}' done: {sent} sent, {failed} failed")

    except Exception as exc:
        try:
            from .models import EmailCampaign
            campaign = EmailCampaign.objects.get(id=campaign_id)
            campaign.status = EmailCampaign.StatusChoices.FAILED
            campaign.save(update_fields=['status'])
        except Exception:
            pass
        logger.error(f"Campaign send task error: {exc}")
        raise self.retry(exc=exc)


@shared_task
def fetch_inbox_task():
    """Periodic task: pull new emails from Gmail IMAP into the database."""
    try:
        from .imap_reader import fetch_inbox_emails
        result = fetch_inbox_emails(limit=50)
        logger.info(f"📥 Inbox sync: {result}")
        return result
    except Exception as e:
        logger.error(f"Inbox fetch task error: {e}")
        return {"error": str(e)}


@shared_task
def send_contact_reply_task(contact_id: int, reply_text: str):
    """Send a reply to a contact form message."""
    try:
        from .models import ContactMessage
        from .email_utils import send_contact_reply
        contact = ContactMessage.objects.get(id=contact_id)
        success = send_contact_reply(contact, reply_text)
        if success:
            contact.status = ContactMessage.StatusChoices.REPLIED
            contact.reply_text = reply_text
            contact.replied_at = timezone.now()
            contact.save(update_fields=['status', 'reply_text', 'replied_at'])
        return {"success": success}
    except Exception as e:
        logger.error(f"Contact reply task error: {e}")
        return {"error": str(e)}
