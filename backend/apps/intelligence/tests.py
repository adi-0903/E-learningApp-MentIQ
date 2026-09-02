from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class IntelligenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@mentiq.com',
            password='password123',
            name='Test User',
            role='student'
        )

    def test_intelligence_overview_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/intelligence/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'active')
