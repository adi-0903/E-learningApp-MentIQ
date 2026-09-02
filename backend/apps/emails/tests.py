from unittest.mock import MagicMock, patch
import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.emails.models import ContactMessage, EmailCampaign, EmailLog
from apps.emails.email_utils import (
    send_email,
    send_welcome_email,
    send_contact_reply,
    notify_admin_of_contact,
    send_contact_acknowledgement,
    send_otp_email,
)
from apps.emails.tasks import fetch_inbox_task

User = get_user_model()


class FetchInboxTaskTests(TestCase):
    @patch("apps.emails.imap_reader.fetch_inbox_emails")
    def test_fetch_inbox_task_success(self, mock_fetch):
        mock_fetch.return_value = {"fetched": 10, "new": 3, "errors": []}

        result = fetch_inbox_task()

        mock_fetch.assert_called_once_with(limit=50)
        self.assertEqual(result, {"fetched": 10, "new": 3, "errors": []})

    @patch("apps.emails.imap_reader.fetch_inbox_emails")
    def test_fetch_inbox_task_exception(self, mock_fetch):
        mock_fetch.side_effect = Exception("IMAP connection failed")

        result = fetch_inbox_task()

        mock_fetch.assert_called_once_with(limit=50)
        self.assertEqual(result, {"error": "IMAP connection failed"})


class EmailUtilsTests(TestCase):
    """Tests for email sending utility functions in email_utils.py."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='teststudent@mentiq.com',
            password='password123',
            name='Test Student',
            role='student',
        )
        self.user_no_name = User.objects.create_user(
            email='noname@mentiq.com',
            password='password123',
            name='',
            role='student',
        )

    @patch('apps.emails.email_utils.settings')
    @patch('apps.emails.email_utils.EmailMultiAlternatives')
    def test_send_email_success_with_name(self, mock_email_class, mock_settings):
        """Test send_email creates EmailLog with SENT status on success."""
        mock_settings.DEFAULT_FROM_EMAIL = 'noreply@mentiq.com'
        mock_msg = MagicMock()
        mock_email_class.return_value = mock_msg

        result = send_email(
            to_email='recipient@example.com',
            to_name='Recipient Name',
            subject='Test Subject',
            html_content='<p>Hello World</p>',
            text_content='Hello World',
            email_type='welcome',
            sent_by=self.user,
        )

        self.assertTrue(result)
        mock_email_class.assert_called_once_with(
            subject='Test Subject',
            body='Hello World',
            from_email='noreply@mentiq.com',
            to=['Recipient Name <recipient@example.com>'],
        )
        mock_msg.attach_alternative.assert_called_once_with('<p>Hello World</p>', 'text/html')
        mock_msg.send.assert_called_once_with(fail_silently=False)

        log = EmailLog.objects.get(recipient_email='recipient@example.com')
        self.assertEqual(log.status, EmailLog.StatusChoices.SENT)
        self.assertEqual(log.recipient_name, 'Recipient Name')
        self.assertEqual(log.subject, 'Test Subject')
        self.assertEqual(log.email_type, 'welcome')
        self.assertEqual(log.sent_by, self.user)
        self.assertEqual(log.error_message, '')

    @patch('apps.emails.email_utils.EmailMultiAlternatives')
    def test_send_email_success_without_name(self, mock_email_class):
        """Test send_email formats recipient correctly when to_name is empty."""
        mock_msg = MagicMock()
        mock_email_class.return_value = mock_msg

        result = send_email(
            to_email='noname@example.com',
            to_name='',
            subject='No Name Subject',
            html_content='<p>No Name</p>',
        )

        self.assertTrue(result)
        mock_email_class.assert_called_once()
        _, kwargs = mock_email_class.call_args
        self.assertEqual(kwargs['to'], ['noname@example.com'])
        self.assertEqual(kwargs['body'], 'Please view this email in an HTML-capable client.')

        log = EmailLog.objects.get(recipient_email='noname@example.com')
        self.assertEqual(log.status, EmailLog.StatusChoices.SENT)

    @patch('apps.emails.email_utils.EmailMultiAlternatives')
    def test_send_email_failure_updates_log(self, mock_email_class):
        """Test send_email logs failure and returns False when EmailMultiAlternatives.send raises an exception."""
        mock_msg = MagicMock()
        mock_msg.send.side_effect = Exception('SMTP Connection Error')
        mock_email_class.return_value = mock_msg

        result = send_email(
            to_email='fail@example.com',
            to_name='Fail User',
            subject='Fail Subject',
            html_content='<p>Fail</p>',
        )

        self.assertFalse(result)
        log = EmailLog.objects.get(recipient_email='fail@example.com')
        self.assertEqual(log.status, EmailLog.StatusChoices.FAILED)
        self.assertEqual(log.error_message, 'SMTP Connection Error')

    @patch('apps.emails.email_utils.send_email')
    def test_send_welcome_email(self, mock_send_email):
        """Test send_welcome_email passes user details correctly."""
        mock_send_email.return_value = True

        res = send_welcome_email(self.user)

        self.assertTrue(res)
        mock_send_email.assert_called_once()
        kwargs = mock_send_email.call_args.kwargs
        self.assertEqual(kwargs['to_email'], 'teststudent@mentiq.com')
        self.assertEqual(kwargs['to_name'], 'Test Student')
        self.assertEqual(kwargs['email_type'], 'welcome')
        self.assertIn('Welcome to MentiQ', kwargs['subject'])
        self.assertIn('Test Student', kwargs['html_content'])

    @patch('apps.emails.email_utils.send_email')
    def test_send_welcome_email_fallback_name(self, mock_send_email):
        """Test send_welcome_email when user has no name set."""
        mock_send_email.return_value = True

        res = send_welcome_email(self.user_no_name)

        self.assertTrue(res)
        kwargs = mock_send_email.call_args.kwargs
        self.assertEqual(kwargs['to_email'], 'noname@mentiq.com')
        self.assertEqual(kwargs['to_name'], 'noname@mentiq.com')
        self.assertIn('there', kwargs['html_content'])

    @patch('apps.emails.email_utils.send_email')
    def test_send_contact_reply(self, mock_send_email):
        """Test send_contact_reply formats and sends reply email."""
        mock_send_email.return_value = True
        contact = ContactMessage.objects.create(
            sender_name='Alice Sender',
            sender_email='alice@example.com',
            subject='Course Query',
            message='I need help with Python course.',
        )

        res = send_contact_reply(contact, 'Here is the help you requested.')

        self.assertTrue(res)
        mock_send_email.assert_called_once()
        kwargs = mock_send_email.call_args.kwargs
        self.assertEqual(kwargs['to_email'], 'alice@example.com')
        self.assertEqual(kwargs['to_name'], 'Alice Sender')
        self.assertEqual(kwargs['subject'], 'Re: Course Query')
        self.assertEqual(kwargs['email_type'], 'contact_reply')
        self.assertIn('Here is the help you requested.', kwargs['html_content'])

    @override_settings(ADMIN_EMAIL='admin@mentiq.com')
    @patch('apps.emails.email_utils.send_email')
    def test_notify_admin_of_contact_success(self, mock_send_email):
        """Test notify_admin_of_contact sends notification when ADMIN_EMAIL is set."""
        mock_send_email.return_value = True
        contact = ContactMessage.objects.create(
            sender_name='Bob User',
            sender_email='bob@example.com',
            subject='Bug Report',
            message='Found a bug in dashboard.',
        )

        res = notify_admin_of_contact(contact)

        self.assertTrue(res)
        mock_send_email.assert_called_once()
        kwargs = mock_send_email.call_args.kwargs
        self.assertEqual(kwargs['to_email'], 'admin@mentiq.com')
        self.assertEqual(kwargs['to_name'], 'MentiQ Admin')
        self.assertEqual(kwargs['subject'], '[Contact] Bug Report')
        self.assertIn('Bob User', kwargs['html_content'])
        self.assertIn('Found a bug in dashboard.', kwargs['html_content'])

    @override_settings(ADMIN_EMAIL='')
    @patch('apps.emails.email_utils.send_email')
    def test_notify_admin_of_contact_no_admin_email(self, mock_send_email):
        """Test notify_admin_of_contact returns False if ADMIN_EMAIL is empty."""
        contact = ContactMessage.objects.create(
            sender_name='Bob User',
            sender_email='bob@example.com',
            subject='Bug Report',
            message='Found a bug.',
        )

        res = notify_admin_of_contact(contact)

        self.assertFalse(res)
        mock_send_email.assert_not_called()

    @patch('apps.emails.email_utils.send_email')
    def test_send_contact_acknowledgement(self, mock_send_email):
        """Test send_contact_acknowledgement generates reference and sends auto-ack email."""
        mock_send_email.return_value = True
        contact = ContactMessage.objects.create(
            sender_name='Charlie User',
            sender_email='charlie@example.com',
            subject='Feedback',
            message='Great platform!',
        )

        res = send_contact_acknowledgement(contact)

        self.assertTrue(res)
        mock_send_email.assert_called_once()
        kwargs = mock_send_email.call_args.kwargs
        self.assertEqual(kwargs['to_email'], 'charlie@example.com')
        self.assertEqual(kwargs['to_name'], 'Charlie User')
        expected_ref = f"MQ-2026-{str(contact.id).upper()[:4]}"
        self.assertIn(expected_ref, kwargs['subject'])
        self.assertIn(expected_ref, kwargs['html_content'])
        self.assertIn('Charlie User', kwargs['text_content'])

    @patch('apps.emails.email_utils.send_email')
    def test_send_otp_email(self, mock_send_email):
        """Test send_otp_email formats and sends password reset OTP."""
        mock_send_email.return_value = True

        res = send_otp_email(self.user, '123456')

        self.assertTrue(res)
        mock_send_email.assert_called_once()
        kwargs = mock_send_email.call_args.kwargs
        self.assertEqual(kwargs['to_email'], 'teststudent@mentiq.com')
        self.assertEqual(kwargs['to_name'], 'Test Student')
        self.assertIn('Password Reset Verification Code', kwargs['subject'])
        self.assertIn('123456', kwargs['html_content'])


class SendCampaignViewTests(TestCase):
    """Tests for SendCampaignView endpoint POST /api/v1/emails/campaigns/<id>/send/"""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='admin@mentiq.com',
            password='password123',
            name='Admin User',
            role='admin',
            is_staff=True,
            is_superuser=True,
        )
        self.regular_user = User.objects.create_user(
            email='student@mentiq.com',
            password='password123',
            name='Regular Student',
            role='student',
            is_staff=False,
        )

    def test_send_campaign_wrong_state_completed(self):
        """Test that sending a campaign in COMPLETED status fails with HTTP 400 Bad Request."""
        campaign = EmailCampaign.objects.create(
            title='Completed Campaign',
            subject='Subject 1',
            body_html='<p>Test</p>',
            status=EmailCampaign.StatusChoices.COMPLETED,
            created_by=self.admin_user,
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/emails/campaigns/{campaign.id}/send/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get('success'))
        self.assertEqual(
            response.data.get('error', {}).get('message'),
            f"Campaign is already {EmailCampaign.StatusChoices.COMPLETED}.",
        )

    def test_send_campaign_wrong_state_sending_and_failed(self):
        """Test that sending a campaign in SENDING or FAILED status fails with HTTP 400 Bad Request."""
        self.client.force_authenticate(user=self.admin_user)

        for invalid_status in [EmailCampaign.StatusChoices.SENDING, EmailCampaign.StatusChoices.FAILED]:
            campaign = EmailCampaign.objects.create(
                title=f'{invalid_status} Campaign',
                subject='Subject',
                body_html='<p>Test</p>',
                status=invalid_status,
                created_by=self.admin_user,
            )
            response = self.client.post(f'/api/v1/emails/campaigns/{campaign.id}/send/')

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(response.data.get('success'))
            self.assertEqual(
                response.data.get('error', {}).get('message'),
                f"Campaign is already {invalid_status}.",
            )

    @patch('apps.emails.tasks.send_campaign_task.delay')
    def test_send_campaign_valid_state_draft(self, mock_send_task):
        """Test that sending a campaign in DRAFT status succeeds."""
        campaign = EmailCampaign.objects.create(
            title='Draft Campaign',
            subject='Subject Draft',
            body_html='<p>Draft</p>',
            status=EmailCampaign.StatusChoices.DRAFT,
            created_by=self.admin_user,
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/emails/campaigns/{campaign.id}/send/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(response.data.get('data', {}).get('campaign_id'), str(campaign.id))
        mock_send_task.assert_called_once_with(campaign.id)

    @patch('apps.emails.tasks.send_campaign_task.delay')
    def test_send_campaign_valid_state_scheduled(self, mock_send_task):
        """Test that sending a campaign in SCHEDULED status succeeds."""
        campaign = EmailCampaign.objects.create(
            title='Scheduled Campaign',
            subject='Subject Scheduled',
            body_html='<p>Scheduled</p>',
            status=EmailCampaign.StatusChoices.SCHEDULED,
            created_by=self.admin_user,
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/emails/campaigns/{campaign.id}/send/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        mock_send_task.assert_called_once_with(campaign.id)

    def test_send_campaign_not_found(self):
        """Test that sending a non-existent campaign returns HTTP 404 Not Found."""
        random_id = uuid.uuid4()
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/emails/campaigns/{random_id}/send/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(response.data.get('success'))
        self.assertEqual(response.data.get('error', {}).get('message'), 'Campaign not found.')

    def test_send_campaign_unauthorized_non_admin(self):
        """Test that non-admin user cannot trigger campaign send."""
        campaign = EmailCampaign.objects.create(
            title='Draft Campaign',
            subject='Subject Draft',
            body_html='<p>Draft</p>',
            status=EmailCampaign.StatusChoices.DRAFT,
            created_by=self.admin_user,
        )
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(f'/api/v1/emails/campaigns/{campaign.id}/send/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
