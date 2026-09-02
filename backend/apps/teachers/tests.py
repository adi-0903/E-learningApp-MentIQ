from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.lessons.models import Lesson
from apps.progress.models import CourseProgress, LessonProgress
from apps.quizzes.models import Quiz, QuizAttempt

User = get_user_model()


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=['*'])
class TeacherStudentsViewsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(
            email='teacher@mentiq.com',
            password='Password123!',
            name='Test Teacher',
            role='teacher'
        )
        self.student = User.objects.create_user(
            email='student@mentiq.com',
            password='Password123!',
            name='Test Student',
            role='student'
        )
        self.course = Course.objects.create(
            title='Test Math Course',
            teacher=self.teacher,
            is_published=True
        )
        self.lesson = Lesson.objects.create(
            course=self.course,
            title='Lesson 1',
            sequence_number=1
        )
        self.quiz = Quiz.objects.create(
            course=self.course,
            title='Quiz 1'
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student,
            course=self.course,
            is_active=True
        )
        self.course_progress = CourseProgress.objects.create(
            student=self.student,
            course=self.course,
            progress_percentage=75.0
        )
        self.lesson_progress = LessonProgress.objects.create(
            student=self.student,
            lesson=self.lesson,
            completed=True
        )
        self.quiz_attempt = QuizAttempt.objects.create(
            student=self.student,
            quiz=self.quiz,
            score=8,
            total_questions=10
        )

    def test_teacher_students_list(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/teachers/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        data = response.data.get('data')
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['student_id'], self.student.id)
        self.assertEqual(data[0]['course_id'], self.course.id)
        self.assertEqual(data[0]['progress_percentage'], 75.0)
        self.assertEqual(data[0]['total_lessons'], 1)
        self.assertEqual(data[0]['lessons_completed'], 1)
        self.assertEqual(data[0]['average_quiz_score'], 8.0)

    def test_teacher_course_students_list(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(f'/api/v1/teachers/courses/{self.course.id}/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        data = response.data.get('data')
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['student_id'], self.student.id)
        self.assertEqual(data[0]['progress_percentage'], 75.0)
        self.assertEqual(data[0]['total_lessons'], 1)
        self.assertEqual(data[0]['lessons_completed'], 1)
        self.assertEqual(data[0]['quiz_attempts'], 1)
        self.assertEqual(data[0]['avg_quiz_score'], 8.0)

    def test_unauthenticated_access(self):
        response = self.client.get('/api/v1/teachers/students/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_student_detail_view(self):
        # Create additional courses & enrollments to test query behavior across multiple courses
        extra_courses = []
        for i in range(2, 6):
            c = Course.objects.create(
                title=f'Test Course {i}',
                teacher=self.teacher,
                is_published=True
            )
            Enrollment.objects.create(
                student=self.student,
                course=c,
                is_active=True
            )
            CourseProgress.objects.create(
                student=self.student,
                course=c,
                progress_percentage=float(i * 10)
            )
            extra_courses.append(c)

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(f'/api/v1/teachers/students/{self.student.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        data = response.data.get('data')
        self.assertEqual(data['student']['id'], self.student.id)
        self.assertEqual(len(data['courses']), 5)
