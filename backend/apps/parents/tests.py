from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.parents.models import ParentAccount

User = get_user_model()

class ParentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.parent_user = User.objects.create_user(
            email='parent@mentiq.com',
            password='password123',
            name='Test Parent',
            role='parent'
        )
        self.student_user = User.objects.create_user(
            email='student@mentiq.com',
            password='password123',
            name='Test Student',
            role='student'
        )

    def test_parent_profile_auto_creation(self):
        self.client.force_authenticate(user=self.parent_user)
        response = self.client.get('/api/v1/parents/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_children_list(self):
        self.client.force_authenticate(user=self.parent_user)
        response = self.client.get('/api/v1/parents/children/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
