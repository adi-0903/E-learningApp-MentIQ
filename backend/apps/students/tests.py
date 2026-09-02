import time
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.courses.models import Course
from apps.lessons.models import Lesson
from apps.enrollments.models import Enrollment
from apps.progress.models import LessonProgress, CourseProgress
from apps.quizzes.models import Quiz, QuizAttempt


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
        self.url = reverse('students:progress')

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
