"""
Email API Views
Endpoints for contact forms, inbox reading, and campaign management.
"""
import logging
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ContactMessage, EmailCampaign, EmailLog, InboxEmail
from .serializers import (
    ContactMessageSerializer, EmailCampaignSerializer,
    EmailLogSerializer, InboxEmailSerializer,
)

logger = logging.getLogger(__name__)


# ─── Contact Form (Public) ────────────────────────────────────────

class ContactFormView(APIView):
    """
    POST /api/v1/emails/contact/
    Anyone (logged in or not) can submit a contact form.
    Saves to DB and notifies admin via email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contact = serializer.save(
            user=request.user if request.user.is_authenticated else None
        )

        # Notify admin + send professional acknowledgement to user
        try:
            from .email_utils import notify_admin_of_contact, send_contact_acknowledgement
            notify_admin_of_contact(contact)
            send_contact_acknowledgement(contact)
        except Exception as e:
            logger.warning(f"Email notification failed: {e}")

        return Response(
            {
                'success': True,
                'message': "Your message has been sent. We'll get back to you shortly!",
                'data': {'id': str(contact.id)},
            },
            status=status.HTTP_201_CREATED,
        )


# ─── My Contact Messages (Authenticated) ─────────────────────────

class MyContactMessagesView(generics.ListAPIView):
    """GET /api/v1/emails/contact/mine/ — List logged-in user's submitted messages."""
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ContactMessage.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})


# ─── Admin Contact Management ────────────────────────────────────

class AdminContactListView(generics.ListAPIView):
    """GET /api/v1/emails/admin/contacts/ — All contact messages (admin only)."""
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdminUser]
    queryset = ContactMessage.objects.all()

    def list(self, request, *args, **kwargs):
        status_filter = request.query_params.get('status')
        qs = self.get_queryset()
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = self.get_serializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})


class AdminContactReplyView(APIView):
    """POST /api/v1/emails/admin/contacts/<id>/reply/ — Reply to a contact message."""
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            contact = ContactMessage.objects.get(id=id)
        except ContactMessage.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Contact message not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        reply_text = request.data.get('reply_text', '').strip()
        if not reply_text:
            return Response(
                {'success': False, 'error': {'message': 'reply_text is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import send_contact_reply_task
        send_contact_reply_task.delay(str(contact.id), reply_text)

        return Response({
            'success': True,
            'message': f'Reply queued to {contact.sender_email}.',
        })


# ─── Email Campaigns (Admin) ──────────────────────────────────────

class EmailCampaignListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/emails/campaigns/  — List campaigns
    POST /api/v1/emails/campaigns/  — Create campaign
    """
    serializer_class = EmailCampaignSerializer
    permission_classes = [IsAdminUser]
    queryset = EmailCampaign.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return Response({'success': True, 'data': response.data}, status=status.HTTP_201_CREATED)


class SendCampaignView(APIView):
    """POST /api/v1/emails/campaigns/<id>/send/ — Fire off a campaign via Celery."""
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            campaign = EmailCampaign.objects.get(id=id)
        except EmailCampaign.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Campaign not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if campaign.status not in [
            EmailCampaign.StatusChoices.DRAFT,
            EmailCampaign.StatusChoices.SCHEDULED,
        ]:
            return Response(
                {'success': False, 'error': {'message': f"Campaign is already {campaign.status}."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import send_campaign_task
        send_campaign_task.delay(campaign.id)

        return Response({
            'success': True,
            'message': f"Campaign '{campaign.title}' is being sent to {campaign.audience} users.",
            'data': {'campaign_id': str(campaign.id)},
        })


# ─── Email Logs (Admin) ───────────────────────────────────────────

class EmailLogListView(generics.ListAPIView):
    """GET /api/v1/emails/logs/ — View all sent email logs (admin)."""
    serializer_class = EmailLogSerializer
    permission_classes = [IsAdminUser]
    queryset = EmailLog.objects.all()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        email_type = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        if email_type:
            qs = qs.filter(email_type=email_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = self.get_serializer(qs[:200], many=True)
        return Response({'success': True, 'data': serializer.data})


# ─── Inbox / Received Emails (Admin) ─────────────────────────────

class InboxEmailListView(generics.ListAPIView):
    """GET /api/v1/emails/inbox/ — List emails received in Gmail inbox."""
    serializer_class = InboxEmailSerializer
    permission_classes = [IsAdminUser]
    queryset = InboxEmail.objects.all()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs[:100], many=True)
        return Response({'success': True, 'data': serializer.data})


class SyncInboxView(APIView):
    """POST /api/v1/emails/inbox/sync/ — Pull latest emails from Gmail IMAP."""
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            from .tasks import fetch_inbox_task
            fetch_inbox_task.delay()
            return Response({
                'success': True,
                'message': 'Inbox sync started. Check /inbox/ in a moment.',
            })
        except Exception as e:
            # Fallback: run synchronously
            try:
                from .imap_reader import fetch_inbox_emails
                result = fetch_inbox_emails(limit=50)
                return Response({'success': True, 'data': result})
            except Exception as e2:
                return Response(
                    {'success': False, 'error': {'message': str(e2)}},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )


class MarkInboxReadView(APIView):
    """PATCH /api/v1/emails/inbox/<id>/read/"""
    permission_classes = [IsAdminUser]

    def patch(self, request, id):
        try:
            inbox_email = InboxEmail.objects.get(id=id)
            inbox_email.is_read = True
            inbox_email.save(update_fields=['is_read'])
            return Response({'success': True, 'message': 'Marked as read.'})
        except InboxEmail.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Email not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )


# ─── EmailJS Config (for frontend) ───────────────────────────────

class EmailJSConfigView(APIView):
    """GET /api/v1/emails/emailjs-config/ — Return public EmailJS keys to frontend."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.conf import settings
        return Response({
            'success': True,
            'data': {
                'service_id': settings.EMAILJS_SERVICE_ID,
                'template_id': settings.EMAILJS_TEMPLATE_ID,
                'public_key': settings.EMAILJS_PUBLIC_KEY,
            },
        })
