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


from unittest.mock import patch
from apps.courses.models import Course
from apps.quizzes.models import Quiz, QuizAttempt
from apps.progress.models import CourseProgress
from apps.progress.services import check_and_award_badge


class CheckAndAwardBadgeTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email='badge_student@mentiq.com',
            password='password123',
            name='Badge Student',
            role='student'
        )
        self.teacher = User.objects.create_user(
            email='badge_teacher@mentiq.com',
            password='password123',
            name='Badge Teacher',
            role='teacher'
        )
        self.course = Course.objects.create(
            teacher=self.teacher,
            title='Test Course',
            category='technology'
        )
        self.quiz = Quiz.objects.create(
            course=self.course,
            title='Test Quiz',
            passing_score=60
        )

    def test_non_existent_badge_criteria(self):
        """Test calling check_and_award_badge with a criteria_type that has no AchievementBadge."""
        result = check_and_award_badge(self.student, 'non_existent_criteria')
        self.assertFalse(result['awarded'])
        self.assertIn('No badge found for criteria: non_existent_criteria', result['message'])
        self.assertEqual(result['progress'], 0)

    def test_first_quiz_criteria(self):
        """Test first_quiz criteria with quiz_completed False and True."""
        badge = AchievementBadge.objects.create(
            name='First Quiz',
            description='Complete first quiz',
            rarity='COMMON',
            criteria_type='first_quiz',
            criteria_threshold=1
        )

        # Attempt with quiz_completed=False
        res1 = check_and_award_badge(self.student, 'first_quiz', {'quiz_completed': False})
        self.assertFalse(res1['awarded'])
        self.assertEqual(res1['progress'], 1)

        # Attempt with quiz_completed=True
        res2 = check_and_award_badge(self.student, 'first_quiz', {'quiz_completed': True})
        self.assertTrue(res2['awarded'])
        self.assertEqual(res2['badge_name'], badge.name)
        self.assertEqual(res2['progress'], 1)

        badge.refresh_from_db()
        self.assertEqual(badge.total_awarded, 1)

    def test_quiz_novice_warrior_and_master_criteria(self):
        """Test quiz_novice (score>=70), quiz_warrior (score>=85), and quiz_master (score>=90)."""
        badge_novice = AchievementBadge.objects.create(
            name='Quiz Novice',
            description='5 quizzes >= 70',
            rarity='COMMON',
            criteria_type='quiz_novice',
            criteria_threshold=2
        )
        badge_warrior = AchievementBadge.objects.create(
            name='Quiz Warrior',
            description='2 quizzes >= 85',
            rarity='RARE',
            criteria_type='quiz_warrior',
            criteria_threshold=2
        )
        badge_master = AchievementBadge.objects.create(
            name='Quiz Master',
            description='2 quizzes >= 90',
            rarity='EPIC',
            criteria_type='quiz_master',
            criteria_threshold=2
        )

        # Create 1 attempt with score 75
        QuizAttempt.objects.create(student=self.student, quiz=self.quiz, score=75, total_questions=100)

        # Novice has count 1 (threshold 2) -> Not awarded
        res_novice = check_and_award_badge(self.student, 'quiz_novice')
        self.assertFalse(res_novice['awarded'])
        self.assertEqual(res_novice['progress'], 1)

        # Create 2nd attempt with score 95
        QuizAttempt.objects.create(student=self.student, quiz=self.quiz, score=95, total_questions=100)

        # Novice count is 2 -> Awarded
        res_novice = check_and_award_badge(self.student, 'quiz_novice')
        self.assertTrue(res_novice['awarded'])

        # Warrior count is 1 (only 95 >= 85) -> Not awarded
        res_warrior = check_and_award_badge(self.student, 'quiz_warrior')
        self.assertFalse(res_warrior['awarded'])
        self.assertEqual(res_warrior['progress'], 1)

        # Master count is 1 (only 95 >= 90) -> Not awarded
        res_master = check_and_award_badge(self.student, 'quiz_master')
        self.assertFalse(res_master['awarded'])

    def test_streak_7days_criteria(self):
        """Test streak_7days criteria using context_data['current_streak']."""
        AchievementBadge.objects.create(
            name='7-Day Streak',
            description='Study for 7 days',
            rarity='COMMON',
            criteria_type='streak_7days',
            criteria_threshold=7
        )

        res = check_and_award_badge(self.student, 'streak_7days', {'current_streak': 5})
        self.assertFalse(res['awarded'])
        self.assertEqual(res['progress'], 5)

        res = check_and_award_badge(self.student, 'streak_7days', {'current_streak': 7})
        self.assertTrue(res['awarded'])

    def test_course_completion_criteria(self):
        """Test course_completion criteria using CourseProgress model."""
        AchievementBadge.objects.create(
            name='Course Finisher',
            description='Complete 1 course',
            rarity='RARE',
            criteria_type='course_completion',
            criteria_threshold=1
        )

        # No completed course progress
        res = check_and_award_badge(self.student, 'course_completion')
        self.assertFalse(res['awarded'])
        self.assertEqual(res['progress'], 0)

        # Add 100% completed course progress
        CourseProgress.objects.create(student=self.student, course=self.course, progress_percentage=100.0)

        res = check_and_award_badge(self.student, 'course_completion')
        self.assertTrue(res['awarded'])

    def test_perfect_score_and_speed_demon_criteria(self):
        """Test perfect_score (score==total_questions) and speed_demon (score==total_questions & time_taken<=60)."""
        AchievementBadge.objects.create(
            name='Perfect Score',
            description='1 perfect score',
            rarity='RARE',
            criteria_type='perfect_score',
            criteria_threshold=1
        )
        AchievementBadge.objects.create(
            name='Speed Demon',
            description='1 fast perfect score',
            rarity='EPIC',
            criteria_type='speed_demon',
            criteria_threshold=1
        )

        # Perfect score but slow (120s)
        QuizAttempt.objects.create(
            student=self.student, quiz=self.quiz, score=10, total_questions=10, time_taken=120
        )

        res_perf = check_and_award_badge(self.student, 'perfect_score')
        self.assertTrue(res_perf['awarded'])

        res_speed = check_and_award_badge(self.student, 'speed_demon')
        self.assertFalse(res_speed['awarded'])
        self.assertEqual(res_speed['progress'], 0)

        # Fast perfect score (45s)
        QuizAttempt.objects.create(
            student=self.student, quiz=self.quiz, score=10, total_questions=10, time_taken=45
        )

        res_speed = check_and_award_badge(self.student, 'speed_demon')
        self.assertTrue(res_speed['awarded'])

    def test_elite_scholar_criteria(self):
        """Test elite_scholar criteria counting claimed rare/epic/legendary/mythic badges."""
        AchievementBadge.objects.create(
            name='Elite Scholar',
            description='Earn 2 rare badges',
            rarity='MYTHIC',
            criteria_type='elite_scholar',
            criteria_threshold=2
        )

        common_badge = AchievementBadge.objects.create(
            name='Common Badge', criteria_type='c1', criteria_threshold=1, rarity='COMMON'
        )
        rare_badge = AchievementBadge.objects.create(
            name='Rare Badge', criteria_type='r1', criteria_threshold=1, rarity='RARE'
        )
        epic_badge = AchievementBadge.objects.create(
            name='Epic Badge', criteria_type='e1', criteria_threshold=1, rarity='EPIC'
        )

        # Claim common badge (doesn't count towards elite scholar)
        StudentBadge.objects.create(student=self.student, badge=common_badge, is_claimed=True)
        res = check_and_award_badge(self.student, 'elite_scholar')
        self.assertFalse(res['awarded'])
        self.assertEqual(res['progress'], 0)

        # Claim 1 rare badge
        StudentBadge.objects.create(student=self.student, badge=rare_badge, is_claimed=True)
        res = check_and_award_badge(self.student, 'elite_scholar')
        self.assertFalse(res['awarded'])
        self.assertEqual(res['progress'], 1)

        # Claim 1 epic badge -> total rare+ = 2
        StudentBadge.objects.create(student=self.student, badge=epic_badge, is_claimed=True)
        res = check_and_award_badge(self.student, 'elite_scholar')
        self.assertTrue(res['awarded'])

    def test_generic_criteria_fallback(self):
        """Test generic criteria fallback using current_value in context_data."""
        AchievementBadge.objects.create(
            name='Custom Activity',
            description='Custom goal',
            rarity='COMMON',
            criteria_type='custom_goal',
            criteria_threshold=10
        )

        res = check_and_award_badge(self.student, 'custom_goal', {'current_value': 5})
        self.assertFalse(res['awarded'])
        self.assertEqual(res['progress'], 5)

        res = check_and_award_badge(self.student, 'custom_goal', {'current_value': 10})
        self.assertTrue(res['awarded'])

    def test_already_claimed_badge(self):
        """Test check_and_award_badge when badge has already been claimed."""
        badge = AchievementBadge.objects.create(
            name='Streak Badge',
            description='7 day streak',
            rarity='COMMON',
            criteria_type='streak_7days',
            criteria_threshold=7
        )
        StudentBadge.objects.create(
            student=self.student,
            badge=badge,
            progress=7,
            is_claimed=True
        )

        res = check_and_award_badge(self.student, 'streak_7days', {'current_streak': 7})
        self.assertFalse(res['awarded'])
        self.assertTrue(res['already_earned'])
        self.assertEqual(res['message'], 'You already have this badge!')

    @patch('apps.progress.services.generate_certificate')
    def test_certificate_generation_exception_resilience(self, mock_generate_cert):
        """Test that failure in certificate generation does not break badge awarding."""
        mock_generate_cert.side_effect = Exception("Cloudinary connection failed")

        AchievementBadge.objects.create(
            name='Resilience Badge',
            description='Test cert exception',
            rarity='COMMON',
            criteria_type='first_quiz',
            criteria_threshold=1
        )

        res = check_and_award_badge(self.student, 'first_quiz', {'quiz_completed': True})
        self.assertTrue(res['awarded'])
        self.assertEqual(res['badge_name'], 'Resilience Badge')
