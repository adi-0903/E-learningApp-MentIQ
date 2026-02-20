"""
Email Sending Utilities - Gmail SMTP + HTML Templates
Handles all outbound email for MentiQ platform.
"""
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

logger = logging.getLogger(__name__)


# ─── HTML Email Templates ─────────────────────────────────────────

def _base_template(content_html: str, title: str = "MentiQ") -> str:
    """Wraps content in a beautiful, branded HTML email shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a; color: #e2e8f0; line-height: 1.6;
    }}
    .wrapper {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; }}
    .header {{
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      padding: 36px 40px; text-align: center;
    }}
    .logo {{ font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }}
    .logo span {{ opacity: 0.85; }}
    .tagline {{ font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }}
    .divider {{
      height: 4px;
      background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
    }}
    .content {{ padding: 40px; }}
    .greeting {{ font-size: 22px; font-weight: 700; color: #f1f5f9; margin-bottom: 16px; }}
    .body-text {{ font-size: 15px; color: #94a3b8; line-height: 1.8; margin-bottom: 20px; }}
    .btn {{
      display: inline-block; padding: 14px 32px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff !important; font-weight: 600; font-size: 15px;
      text-decoration: none; margin: 20px 0;
    }}
    .info-box {{
      background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 10px; padding: 20px; margin: 24px 0;
    }}
    .info-box p {{ font-size: 14px; color: #94a3b8; }}
    .info-box strong {{ color: #c4b5fd; }}
    .footer {{
      background: #0f172a; padding: 28px 40px; text-align: center;
      border-top: 1px solid rgba(255,255,255,0.06);
    }}
    .footer p {{ font-size: 12px; color: #475569; }}
    .footer a {{ color: #6366f1; text-decoration: none; }}
    .social {{ margin: 12px 0; }}
    .social a {{ 
      display: inline-block; margin: 0 6px; color: #6366f1; 
      font-size: 12px; text-decoration: none;
    }}
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a; padding: 30px 16px;">
    <tr><td align="center">
      <div class="wrapper">
        <div class="header">
          <div class="logo">🧠 MentiQ</div>
          <div class="tagline">Your Intelligent E-Learning Platform</div>
        </div>
        <div class="divider"></div>
        <div class="content">
          {content_html}
        </div>
        <div class="footer">
          <div class="social">
            <a href="#">Website</a> · <a href="#">Support</a> · <a href="#">Unsubscribe</a>
          </div>
          <p>© 2026 MentiQ. All rights reserved.</p>
          <p style="margin-top:6px;">You're receiving this because you have an account on MentiQ.</p>
        </div>
      </div>
    </td></tr>
  </table>
</body>
</html>"""


def welcome_email_html(name: str) -> str:
    content = f"""
    <p class="greeting">Welcome to MentiQ, {name}! 🎉</p>
    <p class="body-text">
      We're thrilled to have you on board. MentiQ is your intelligent learning companion — 
      designed to help you grow, explore, and master new skills every day.
    </p>
    <div class="info-box">
      <p>🚀 <strong>Get started in 3 steps:</strong></p>
      <p style="margin-top:10px;">1. Browse our curated course library</p>
      <p>2. Enroll in your first course</p>
      <p>3. Track your progress on the dashboard</p>
    </div>
    <p class="body-text">
      If you have any questions, our support team is always here to help.
    </p>
    <p class="body-text" style="color:#64748b; font-size:13px;">
      Happy learning! ✨<br/>
      <strong style="color:#c4b5fd;">The MentiQ Team</strong>
    </p>
    """
    return _base_template(content, "Welcome to MentiQ!")


def promotional_email_html(subject: str, body_html: str) -> str:
    return _base_template(body_html, subject)


def contact_reply_html(name: str, original_subject: str, reply_text: str) -> str:
    content = f"""
    <p class="greeting">Hi {name},</p>
    <p class="body-text">
      Thank you for reaching out to MentiQ Support. Here's our response to your inquiry:
    </p>
    <div class="info-box">
      <p><strong>Your query:</strong> {original_subject}</p>
      <p style="margin-top:12px; color:#e2e8f0;">{reply_text}</p>
    </div>
    <p class="body-text">
      If you have any follow-up questions, feel free to reply to this email or contact us again.
    </p>
    <p class="body-text" style="color:#64748b; font-size:13px;">
      Best regards,<br/>
      <strong style="color:#c4b5fd;">MentiQ Support Team</strong>
    </p>
    """
    return _base_template(content, "Re: " + original_subject)


def admin_contact_notification_html(sender_name: str, sender_email: str, subject: str, message: str) -> str:
    content = f"""
    <p class="greeting">📬 New Contact Form Submission</p>
    <div class="info-box">
      <p><strong>From:</strong> {sender_name} ({sender_email})</p>
      <p style="margin-top:8px;"><strong>Subject:</strong> {subject}</p>
      <p style="margin-top:12px; color:#e2e8f0; background: rgba(255,255,255,0.05); padding:12px; border-radius:6px;">{message}</p>
    </div>
    <p class="body-text">Please log in to the admin panel to respond.</p>
    """
    return _base_template(content, "New Contact Message - MentiQ")


def contact_acknowledgement_html(name: str, subject: str, message: str, ticket_ref: str) -> str:
    """Professional auto-acknowledgement sent to the user right after they submit a contact form."""
    content = f"""
    <p class="greeting">Dear {name},</p>
    <p class="body-text">
      Thank you for reaching out to the <strong style="color:#c4b5fd;">MentiQ Support Team</strong>.
      We have successfully received your inquiry and want to assure you that it is being handled
      with the highest priority.
    </p>

    <div class="info-box">
      <p style="font-size:13px; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Submission Details</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0; color:#64748b; font-size:13px; width:40%;">Reference No.</td>
          <td style="padding:6px 0; color:#c4b5fd; font-size:13px; font-weight:600; font-family:monospace;">{ticket_ref}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#64748b; font-size:13px;">Subject</td>
          <td style="padding:6px 0; color:#e2e8f0; font-size:13px;">{subject}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#64748b; font-size:13px;">Your Message</td>
          <td style="padding:6px 0; color:#94a3b8; font-size:13px; font-style:italic;">&ldquo;{message[:120]}{'...' if len(message) > 120 else ''}&rdquo;</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#64748b; font-size:13px;">Expected Response</td>
          <td style="padding:6px 0; color:#10b981; font-size:13px; font-weight:600;">Within 24 business hours</td>
        </tr>
      </table>
    </div>

    <p class="body-text">
      Our support specialists are reviewing your request. You will receive a detailed response
      at this email address shortly. Please retain your reference number for future correspondence.
    </p>

    <p class="body-text">
      In the meantime, you may find answers to common questions in our Help Center, or
      continue exploring courses on the MentiQ platform.
    </p>

    <p class="body-text" style="color:#64748b; font-size:13px; border-top:1px solid rgba(255,255,255,0.06); padding-top:20px; margin-top:8px;">
      This is an automated confirmation. Please do not reply directly to this email.<br/>
      For urgent matters, contact us through the MentiQ app.<br/><br/>
      Warm regards,<br/>
      <strong style="color:#c4b5fd;">MentiQ Customer Support</strong><br/>
      <span style="color:#475569;">mentiq.learn@gmail.com</span>
    </p>
    """
    return _base_template(content, "We've Received Your Message — MentiQ Support")


# ─── Core Sending Function ────────────────────────────────────────

def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
    text_content: str = "",
    email_type: str = "generic",
    sent_by=None,
) -> bool:
    """
    Send an HTML email via Gmail SMTP and log the result.
    Returns True on success, False on failure.
    """
    from .models import EmailLog

    log = EmailLog.objects.create(
        recipient_email=to_email,
        recipient_name=to_name,
        subject=subject,
        email_type=email_type,
        status=EmailLog.StatusChoices.PENDING,
        sent_by=sent_by,
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content or "Please view this email in an HTML-capable client.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[f"{to_name} <{to_email}>" if to_name else to_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        log.status = EmailLog.StatusChoices.SENT
        log.save(update_fields=['status', 'updated_at'])
        logger.info(f"✅ Email sent to {to_email} | type={email_type}")
        return True

    except Exception as e:
        log.status = EmailLog.StatusChoices.FAILED
        log.error_message = str(e)
        log.save(update_fields=['status', 'error_message', 'updated_at'])
        logger.error(f"❌ Email failed to {to_email}: {e}")
        return False


# ─── Convenience Wrappers ─────────────────────────────────────────

def send_welcome_email(user) -> bool:
    """Send a styled welcome email to a newly registered user."""
    return send_email(
        to_email=user.email,
        to_name=getattr(user, 'name', '') or user.email,
        subject="Welcome to MentiQ – Your Learning Journey Starts Now! 🚀",
        html_content=welcome_email_html(getattr(user, 'name', 'there')),
        email_type='welcome',
    )


def send_contact_reply(contact_message, reply_text: str) -> bool:
    """Send reply to a user's contact form submission."""
    return send_email(
        to_email=contact_message.sender_email,
        to_name=contact_message.sender_name,
        subject=f"Re: {contact_message.subject}",
        html_content=contact_reply_html(
            name=contact_message.sender_name,
            original_subject=contact_message.subject,
            reply_text=reply_text,
        ),
        email_type='contact_reply',
    )


def notify_admin_of_contact(contact_message) -> bool:
    """Notify the admin when a user submits a contact form."""
    admin_email = settings.ADMIN_EMAIL
    if not admin_email:
        return False
    return send_email(
        to_email=admin_email,
        to_name="MentiQ Admin",
        subject=f"[Contact] {contact_message.subject}",
        html_content=admin_contact_notification_html(
            sender_name=contact_message.sender_name,
            sender_email=contact_message.sender_email,
            subject=contact_message.subject,
            message=contact_message.message,
        ),
        email_type='generic',
    )


def send_contact_acknowledgement(contact_message) -> bool:
    """Send a professional auto-acknowledgement to the user after they submit a contact form."""
    import uuid
    # Generate a short readable ticket reference like MQ-2026-A3F7
    short_id = str(contact_message.id).upper()[:4]
    ticket_ref = f"MQ-2026-{short_id}"
    return send_email(
        to_email=contact_message.sender_email,
        to_name=contact_message.sender_name,
        subject=f"[MentiQ Support] We've received your message — Ref: {ticket_ref}",
        html_content=contact_acknowledgement_html(
            name=contact_message.sender_name,
            subject=contact_message.subject,
            message=contact_message.message,
            ticket_ref=ticket_ref,
        ),
        text_content=(
            f"Dear {contact_message.sender_name},\n\n"
            f"Thank you for contacting MentiQ Support.\n"
            f"Reference No.: {ticket_ref}\n"
            f"Subject: {contact_message.subject}\n\n"
            f"We have received your inquiry and will respond within 24 business hours.\n\n"
            f"Warm regards,\nMentiQ Customer Support"
        ),
        email_type='generic',
    )
