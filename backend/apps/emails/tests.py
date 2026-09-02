from unittest.mock import patch
import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.emails.models import EmailCampaign

User = get_user_model()


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
