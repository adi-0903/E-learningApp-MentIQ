"""
Gmail IMAP Inbox Reader
Pulls, parses, and stores incoming emails from Gmail into the DB for admin review.
"""
import email
import imaplib
import logging
from email.header import decode_header
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _decode_str(value):
    """Safely decode email header strings."""
    if not value:
        return ""
    decoded_parts = decode_header(value)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            try:
                result.append(part.decode(charset or 'utf-8', errors='replace'))
            except Exception:
                result.append(part.decode('utf-8', errors='replace'))
        else:
            result.append(str(part))
    return " ".join(result)


def _get_email_body(msg) -> str:
    """Extract plaintext or HTML body from email message."""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in disposition:
                continue
            if content_type == "text/plain":
                try:
                    body = part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8", errors="replace"
                    )
                    break
                except Exception:
                    pass
            elif content_type == "text/html" and not body:
                try:
                    body = part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8", errors="replace"
                    )
                except Exception:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode(
                msg.get_content_charset() or "utf-8", errors="replace"
            )
        except Exception:
            body = ""
    return body[:5000]  # Truncate to 5KB max


def fetch_inbox_emails(limit: int = 20, folder: str = "INBOX") -> dict:
    """
    Connect to Gmail IMAP, fetch recent emails, and save them to InboxEmail model.

    Returns:
        dict with keys: fetched, new, errors
    """
    from .models import InboxEmail

    imap_host = settings.IMAP_HOST
    imap_port = settings.IMAP_PORT
    imap_user = settings.IMAP_USER
    imap_pass = settings.IMAP_PASSWORD

    if not imap_user or not imap_pass:
        logger.warning("IMAP credentials not configured.")
        return {"fetched": 0, "new": 0, "errors": ["IMAP credentials not set"]}

    results = {"fetched": 0, "new": 0, "errors": []}

    try:
        if settings.IMAP_USE_SSL:
            mail = imaplib.IMAP4_SSL(imap_host, imap_port)
        else:
            mail = imaplib.IMAP4(imap_host, imap_port)

        mail.login(imap_user, imap_pass)
        mail.select(folder)

        # Search for all emails, get the latest `limit` ones
        status, data = mail.search(None, "ALL")
        if status != "OK":
            return {"fetched": 0, "new": 0, "errors": ["IMAP search failed"]}

        all_ids = data[0].split()
        recent_ids = all_ids[-limit:] if len(all_ids) > limit else all_ids

        for email_id in reversed(recent_ids):
            try:
                status, msg_data = mail.fetch(email_id, "(RFC822)")
                if status != "OK":
                    continue

                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                # Extract headers
                message_id = _decode_str(msg.get("Message-ID", "")).strip()
                if not message_id:
                    message_id = f"no-id-{email_id.decode()}"

                # Skip if already stored
                if InboxEmail.objects.filter(message_id=message_id).exists():
                    results["fetched"] += 1
                    continue

                sender_raw = _decode_str(msg.get("From", ""))
                # Parse "Name <email@example.com>"
                sender_name, sender_email = "", sender_raw
                if "<" in sender_raw and ">" in sender_raw:
                    parts = sender_raw.rsplit("<", 1)
                    sender_name = parts[0].strip().strip('"')
                    sender_email = parts[1].strip(">" ).strip()

                subject = _decode_str(msg.get("Subject", "(No Subject)"))
                date_str = msg.get("Date", "")
                try:
                    from email.utils import parsedate_to_datetime
                    received_at = parsedate_to_datetime(date_str)
                    if received_at.tzinfo is None:
                        received_at = timezone.make_aware(received_at)
                except Exception:
                    received_at = timezone.now()

                body = _get_email_body(msg)

                InboxEmail.objects.create(
                    sender_email=sender_email[:254],
                    sender_name=sender_name[:255],
                    subject=subject[:500],
                    body=body,
                    received_at=received_at,
                    message_id=message_id[:500],
                    is_read=False,
                )
                results["fetched"] += 1
                results["new"] += 1

            except Exception as e:
                results["errors"].append(str(e))
                logger.error(f"Error fetching email {email_id}: {e}")

        mail.logout()
        logger.info(f"📥 IMAP fetch complete: {results}")

    except imaplib.IMAP4.error as e:
        results["errors"].append(f"IMAP auth error: {e}")
        logger.error(f"IMAP connection error: {e}")
    except Exception as e:
        results["errors"].append(str(e))
        logger.error(f"Unexpected IMAP error: {e}")

    return results
