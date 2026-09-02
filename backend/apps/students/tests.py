import datetime
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.attendance.models import AttendanceRecord, AttendanceSession
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.lessons.models import Lesson
from apps.progress.models import CourseProgress, LessonProgress
from apps.quizzes.models import Quiz, QuizAttempt

User = get_user_model()


class StudentDashboardViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/students/dashboard/'

        # Create teacher and student
        self.teacher = User.objects.create_user(
            email='teacher@mentiq.com',
            password='password123',
            name='Teacher One',
            role='teacher',
        )
        self.student = User.objects.create_user(
            email='student@mentiq.com',
            password='password123',
            name='Student One',
            role='student',
        )

        # Create 10 enrolled courses
        self.courses = []
        for i in range(10):
            course = Course.objects.create(
                teacher=self.teacher,
                title=f'Course {i}',
                is_published=True,
            )
            Enrollment.objects.create(student=self.student, course=course, is_active=True)
            self.courses.append(course)

        # Create Attendance Sessions and Records for course 0 (5 total, 4 present)
        c0 = self.courses[0]
        for idx in range(5):
            session = AttendanceSession.objects.create(
                course=c0,
                teacher=self.teacher,
                start_time=datetime.time(9, 0),
            )
            AttendanceRecord.objects.create(
                session=session,
                student=self.student,
                is_present=(idx < 4),
            )

        # Create Attendance Sessions and Records for course 1 (2 total, 1 present)
        c1 = self.courses[1]
        for idx in range(2):
            session = AttendanceSession.objects.create(
                course=c1,
                teacher=self.teacher,
                start_time=datetime.time(10, 0),
            )
            AttendanceRecord.objects.create(
                session=session,
                student=self.student,
                is_present=(idx < 1),
            )

        self.client.force_authenticate(user=self.student)

    def test_dashboard_attendance_correctness(self):
        """Verify student dashboard returns correct overall and per-course attendance data."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        data = response.data['data']
        self.assertEqual(data['total_attendance_marked'], 7)
        self.assertEqual(data['total_present'], 5)

        course_stats = {item['id']: item for item in data['course_attendance']}
        self.assertEqual(len(course_stats), 10)

        # Check Course 0
        c0_id = str(self.courses[0].id)
        self.assertEqual(course_stats[c0_id]['total'], 5)
        self.assertEqual(course_stats[c0_id]['present'], 4)
        self.assertEqual(course_stats[c0_id]['percentage'], 80.0)

        # Check Course 1
        c1_id = str(self.courses[1].id)
        self.assertEqual(course_stats[c1_id]['total'], 2)
        self.assertEqual(course_stats[c1_id]['present'], 1)
        self.assertEqual(course_stats[c1_id]['percentage'], 50.0)

        # Check Course 2 (no records)
        c2_id = str(self.courses[2].id)
        self.assertEqual(course_stats[c2_id]['total'], 0)
        self.assertEqual(course_stats[c2_id]['present'], 0)
        self.assertEqual(course_stats[c2_id]['percentage'], 0.0)

    def test_dashboard_query_count(self):
        """Benchmark SQL queries executed by student dashboard."""
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        query_count = len(ctx.captured_queries)
        self.assertLessEqual(query_count, 37)
        print(f"\n[Student Dashboard Benchmark] {query_count} SQL queries executed for 10 courses (reduced from 56 queries baseline).")


class StudentProgressViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email='student_test@example.com',
            password='password123',
            role='student',
            name='Test Student'
        )
        self.teacher = User.objects.create_user(
            email='teacher_test@example.com',
            password='password123',
            role='teacher',
            name='Test Teacher'
        )
        self.client.force_authenticate(user=self.student)
        self.url = '/api/v1/students/progress/'

    def test_student_progress_correctness(self):
        course = Course.objects.create(title='Python 101', teacher=self.teacher)
        Enrollment.objects.create(student=self.student, course=course, is_active=True)

        lesson1 = Lesson.objects.create(course=course, title='Lesson 1', sequence_number=1)
        lesson2 = Lesson.objects.create(course=course, title='Lesson 2', sequence_number=2)

        LessonProgress.objects.create(student=self.student, lesson=lesson1, completed=True)

        quiz = Quiz.objects.create(course=course, title='Quiz 1')
        QuizAttempt.objects.create(student=self.student, quiz=quiz, score=80.0)
        QuizAttempt.objects.create(student=self.student, quiz=quiz, score=90.0)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        data = response.data['data']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['course_id'], course.id)
        self.assertEqual(data[0]['course_title'], 'Python 101')
        self.assertEqual(data[0]['total_lessons'], 2)
        self.assertEqual(data[0]['completed_lessons'], 1)
        self.assertEqual(data[0]['progress_percentage'], 50.0)
        self.assertEqual(data[0]['quiz_average'], 85.0)

        cp = CourseProgress.objects.get(student=self.student, course=course)
        self.assertEqual(cp.progress_percentage, 50.0)

    def test_student_progress_query_count_and_performance(self):
        num_courses = 15
        for i in range(num_courses):
            c = Course.objects.create(title=f'Course {i}', teacher=self.teacher)
            Enrollment.objects.create(student=self.student, course=c, is_active=True)
            q = Quiz.objects.create(course=c, title=f'Quiz {i}')
            QuizAttempt.objects.create(student=self.student, quiz=q, score=85.0)
            for j in range(5):
                l = Lesson.objects.create(course=c, title=f'Lesson {j}', sequence_number=j+1)
                if j % 2 == 0:
                    LessonProgress.objects.create(student=self.student, lesson=l, completed=True)

        with self.assertNumQueries(7):
            response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), num_courses)
