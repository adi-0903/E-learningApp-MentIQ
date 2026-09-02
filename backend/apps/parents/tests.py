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


from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.db import connection
import time
from apps.parents.tasks import generate_weekly_reports
from apps.parents.models import WeeklyProgressReport

class GenerateWeeklyReportsBenchmarkTestCase(TestCase):
    def setUp(self):
        # Create 10 parents, each with 3 children
        for i in range(10):
            p_user = User.objects.create_user(
                email=f'parent{i}@example.com',
                password='password123',
                name=f'Parent {i}',
                role='parent'
            )
            parent_acc, _ = ParentAccount.objects.get_or_create(user=p_user, receive_weekly_reports=True)
            for j in range(3):
                s_user = User.objects.create_user(
                    email=f'student_{i}_{j}@example.com',
                    password='password123',
                    name=f'Student {i}-{j}',
                    role='student'
                )
                parent_acc.children.add(s_user)

    def test_generate_weekly_reports_benchmark(self):
        start_time = time.time()
        with CaptureQueriesContext(connection) as ctx:
            result = generate_weekly_reports()
        elapsed = time.time() - start_time
        print(f"\n[BENCHMARK OPTIMIZED FIRST RUN] Queries: {len(ctx.captured_queries)}, Elapsed time: {elapsed:.4f}s")
        self.assertEqual(result, "Generated 30 weekly reports.")
        self.assertEqual(WeeklyProgressReport.objects.count(), 30)

        # Second run: All reports already exist, should skip generation and avoid per-student report existence checks
        start_time = time.time()
        with CaptureQueriesContext(connection) as ctx:
            result_second = generate_weekly_reports()
        elapsed_second = time.time() - start_time
        print(f"\n[BENCHMARK OPTIMIZED SECOND RUN - SKIPPED] Queries: {len(ctx.captured_queries)}, Elapsed time: {elapsed_second:.4f}s")
        self.assertEqual(result_second, "Generated 0 weekly reports.")
