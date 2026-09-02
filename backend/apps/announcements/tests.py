import time
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.db import connection
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.notifications.models import Notification, NotificationSetting

User = get_user_model()


class AnnouncementNotificationBenchmarkTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/announcements/'

        # Create teacher user who posts the announcement
        self.teacher = User.objects.create_user(
            email='teacher_announcer@mentiq.com',
            password='password123',
            name='Teacher Announcer',
            role='teacher',
        )

        # Create 30 students, 10 teachers, 10 parents (50 users total)
        self.students = [
            User.objects.create_user(
                email=f'student_{i}@mentiq.com',
                password='password123',
                name=f'Student {i}',
                role='student',
            )
            for i in range(30)
        ]
        self.teachers = [
            User.objects.create_user(
                email=f'other_teacher_{i}@mentiq.com',
                password='password123',
                name=f'Other Teacher {i}',
                role='teacher',
            )
            for i in range(10)
        ]
        self.parents = [
            User.objects.create_user(
                email=f'parent_{i}@mentiq.com',
                password='password123',
                name=f'Parent {i}',
                role='parent',
            )
            for i in range(10)
        ]

        self.client.force_authenticate(user=self.teacher)

    def test_announcement_creation_creates_notifications_correctly(self):
        """Verify that creating an announcement creates notifications for all active target users."""
        payload = {
            'title': 'School Holiday Notice',
            'content': 'School will be closed tomorrow due to weather.',
            'target_audience': 'all',
            'priority': 'normal',
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Expected recipients: 30 students + (10 + 1 announcer) teachers + 10 parents = 51 users
        total_recipients = User.objects.filter(role__in=['student', 'teacher', 'parent'], is_active=True).count()
        notifications_count = Notification.objects.filter(notification_type='announcement').count()

        self.assertEqual(notifications_count, total_recipients)

    def test_announcement_creation_query_count_and_performance(self):
        """Measure query count during announcement notification creation."""
        payload = {
            'title': 'Exam Schedule Release',
            'content': 'Final exam schedule is now published on the portal.',
            'target_audience': 'all',
            'priority': 'high',
        }

        start_time = time.time()
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.post(self.url, payload, format='json')
        duration = time.time() - start_time

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        query_count = len(ctx.captured_queries)
        print(f"\n[Announcement Baseline Benchmark] {query_count} SQL queries executed in {duration:.4f}s for institutional announcement.")
