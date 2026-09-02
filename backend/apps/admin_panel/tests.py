import time
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.attendance.models import AttendanceSession, AttendanceRecord

User = get_user_model()


class AdminAttendanceStudentSummaryTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin = User.objects.create_user(
            email='admin@mentiq.com',
            password='Password123!',
            name='Admin User',
            role='admin'
        )

        # Teacher user
        self.teacher = User.objects.create_user(
            email='teacher@mentiq.com',
            password='Password123!',
            name='Teacher User',
            role='teacher'
        )

        # 5 Student users
        self.students = []
        for i in range(5):
            student = User.objects.create_user(
                email=f'student{i}@mentiq.com',
                password='Password123!',
                name=f'Student {i}',
                role='student',
                student_id=f'STU00{i}'
            )
            self.students.append(student)

        # 2 Courses
        self.course1 = Course.objects.create(
            title='Math 101',
            teacher=self.teacher,
            price=100.00
        )
        self.course2 = Course.objects.create(
            title='Physics 101',
            teacher=self.teacher,
            price=150.00
        )

        # Enroll students
        for student in self.students:
            Enrollment.objects.create(student=student, course=self.course1, is_active=True)
            Enrollment.objects.create(student=student, course=self.course2, is_active=True)

        # Create 3 AttendanceSessions for course1, 2 for course2
        self.c1_sessions = []
        for i in range(3):
            sess = AttendanceSession.objects.create(
                course=self.course1,
                teacher=self.teacher,
                start_time='09:00:00'
            )
            self.c1_sessions.append(sess)

        self.c2_sessions = []
        for i in range(2):
            sess = AttendanceSession.objects.create(
                course=self.course2,
                teacher=self.teacher,
                start_time='10:00:00'
            )
            self.c2_sessions.append(sess)

        # Attendance records
        # Student 0: present in all
        for sess in self.c1_sessions + self.c2_sessions:
            AttendanceRecord.objects.create(session=sess, student=self.students[0], is_present=True)

        # Student 1: present in 2 math sessions, absent in 1 math, absent in physics
        for i, sess in enumerate(self.c1_sessions):
            AttendanceRecord.objects.create(session=sess, student=self.students[1], is_present=(i < 2))
        for sess in self.c2_sessions:
            AttendanceRecord.objects.create(session=sess, student=self.students[1], is_present=False)

    def test_attendance_student_summary_endpoint(self):
        self.client.force_authenticate(user=self.admin)

        with self.assertNumQueries(5):
            response = self.client.get('/api/v1/admin/attendance/students/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['count'], 5)

        # Verify content
        students_data = response.data['data']
        self.assertEqual(len(students_data), 5)

        # Check sorted order (lowest percentage first)
        # Student 1 has overall 2/5 = 40.0%
        # Student 0 has overall 5/5 = 100.0%
        # Students 2, 3, 4 have 0 records = 0.0%
        self.assertEqual(students_data[0]['overall_percentage'], 0.0)

        student1_data = next(s for s in students_data if s['email'] == 'student1@mentiq.com')
        self.assertEqual(student1_data['overall_percentage'], 40.0)
        self.assertEqual(student1_data['total_present'], 2)
        self.assertEqual(student1_data['total_records'], 5)

        c1_data = next(c for c in student1_data['courses'] if c['course_id'] == str(self.course1.id))
        self.assertEqual(c1_data['total_sessions'], 3)
        self.assertEqual(c1_data['present'], 2)
        self.assertEqual(c1_data['absent'], 1)
        self.assertEqual(c1_data['percentage'], 66.7)

        c2_data = next(c for c in student1_data['courses'] if c['course_id'] == str(self.course2.id))
        self.assertEqual(c2_data['total_sessions'], 2)
        self.assertEqual(c2_data['present'], 0)
        self.assertEqual(c2_data['absent'], 2)
        self.assertEqual(c2_data['percentage'], 0.0)

    def test_attendance_student_summary_with_query_params(self):
        self.client.force_authenticate(user=self.admin)

        # Test filtering by course
        with self.assertNumQueries(5):
            response = self.client.get(f'/api/v1/admin/attendance/students/?course={self.course1.id}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        for s in response.data['data']:
            self.assertEqual(len(s['courses']), 1)
            self.assertEqual(s['courses'][0]['course_id'], str(self.course1.id))

        # Test search query
        with self.assertNumQueries(5):
            response = self.client.get('/api/v1/admin/attendance/students/?search=student1')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['data'][0]['email'], 'student1@mentiq.com')
