from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class AttendanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(
            email='teacher@mentiq.com',
            password='password123',
            name='Test Teacher',
            role='teacher'
        )

    def test_attendance_history_endpoint(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/attendance/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
