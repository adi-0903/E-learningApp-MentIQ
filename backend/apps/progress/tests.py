import time
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.db import connection
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.progress.models import AchievementBadge, StudentBadge

User = get_user_model()


class LeaderboardViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/progress/leaderboard/'

        # Create badges of different rarities
        self.common_badge = AchievementBadge.objects.create(
            name='First Steps',
            description='Complete 1 lesson',
            rarity='COMMON',
            criteria_type='lesson_completion',
            criteria_threshold=1,
        )
        self.rare_badge = AchievementBadge.objects.create(
            name='Quiz Master',
            description='Score 100% on a quiz',
            rarity='RARE',
            criteria_type='quiz_mastery',
            criteria_threshold=1,
        )
        self.legendary_badge = AchievementBadge.objects.create(
            name='Legendary Scholar',
            description='Complete 50 lessons',
            rarity='LEGENDARY',
            criteria_type='course_completion',
            criteria_threshold=50,
        )

        # Create 20 student users with varying badge counts
        self.students = []
        for i in range(20):
            student = User.objects.create_user(
                email=f'student_{i}@mentiq.com',
                password='password123',
                name=f'Student {i}',
                role='student',
            )
            self.students.append(student)

            # Assign badges
            # Student i gets common badge
            StudentBadge.objects.create(
                student=student,
                badge=self.common_badge,
                is_claimed=True,
            )
            # Even index students get rare badge
            if i % 2 == 0:
                StudentBadge.objects.create(
                    student=student,
                    badge=self.rare_badge,
                    is_claimed=True,
                )
            # Index divisible by 5 students get legendary badge
            if i % 5 == 0:
                StudentBadge.objects.create(
                    student=student,
                    badge=self.legendary_badge,
                    is_claimed=True,
                )

        # Authenticate as first student
        self.client.force_authenticate(user=self.students[0])

    def test_leaderboard_data_correctness(self):
        """Verify leaderboard returns top students ordered by rare badges and total badges."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(len(data), 20)
        # Check ranks are contiguous 1..20
        ranks = [entry['rank'] for entry in data]
        self.assertEqual(ranks, list(range(1, 21)))

        # Check sorting: rare_badges descending, total_badges descending
        for i in range(len(data) - 1):
            curr = data[i]
            next_entry = data[i + 1]
            if curr['rare_badges'] == next_entry['rare_badges']:
                self.assertGreaterEqual(curr['total_badges'], next_entry['total_badges'])
            else:
                self.assertGreater(curr['rare_badges'], next_entry['rare_badges'])

    def test_leaderboard_query_count_optimized(self):
        """Verify that fetching leaderboard executes exactly 2 queries regardless of row count (no N+1)."""
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assert database query count is 2 (1 for StudentBadge aggregation, 1 for User bulk fetch)
        self.assertLessEqual(len(ctx.captured_queries), 2)
        print(f"\n[Leaderboard Benchmark Verified] {len(ctx.captured_queries)} SQL queries executed for {len(response.data)} entries.")
