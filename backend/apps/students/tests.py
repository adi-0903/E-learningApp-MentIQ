import datetime
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework import status
from rest_framework.test import APIClient

from apps.attendance.models import AttendanceRecord, AttendanceSession
from apps.courses.models import Course
from apps.enrollments.models import Enrollment

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
