from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from .models import Course, CourseReview

User = get_user_model()


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=['*'])
class CourseViewsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.teacher = User.objects.create_user(
            email='teacher1@mentiq.com',
            password='Password123!',
            name='Teacher One',
            role='teacher',
        )
        self.teacher_other = User.objects.create_user(
            email='teacher2@mentiq.com',
            password='Password123!',
            name='Teacher Two',
            role='teacher',
        )
        self.student = User.objects.create_user(
            email='student1@mentiq.com',
            password='Password123!',
            name='Student One',
            role='student',
            grade_level='10th Grade',
        )
        self.student_other_grade = User.objects.create_user(
            email='student2@mentiq.com',
            password='Password123!',
            name='Student Two',
            role='student',
            grade_level='11th Grade',
        )

        # Courses
        self.course_teacher1_pub = Course.objects.create(
            teacher=self.teacher,
            title='Algebra 101',
            description='Intro to Algebra for 10th grade',
            category='mathematics',
            level='beginner',
            grade_level='10th Grade',
            is_published=True,
        )
        self.course_teacher1_unpub = Course.objects.create(
            teacher=self.teacher,
            title='Advanced Geometry',
            description='Geometry draft',
            category='mathematics',
            level='advanced',
            grade_level='10th Grade',
            is_published=False,
        )
        self.course_teacher2_pub = Course.objects.create(
            teacher=self.teacher_other,
            title='Physics Fundamentals',
            description='Introductory Physics for 11th grade',
            category='physics',
            level='intermediate',
            grade_level='11th Grade',
            is_published=True,
        )
        self.course_deleted = Course.objects.create(
            teacher=self.teacher,
            title='Deleted Course',
            description='This course is soft deleted',
            category='other',
            is_published=True,
            is_deleted=True,
        )

    # --- CourseListCreateView Tests ---

    def test_list_courses_unauthenticated(self):
        response = self.client.get('/api/v1/courses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_courses_as_teacher(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['data']
        # Teacher sees their own courses (pub & unpub) + other teacher's published courses (excluding soft deleted)
        titles = [c['title'] for c in results]
        self.assertIn('Algebra 101', titles)
        self.assertIn('Advanced Geometry', titles)
        self.assertIn('Physics Fundamentals', titles)
        self.assertNotIn('Deleted Course', titles)

    def test_list_courses_as_student_with_grade_level(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['data']
        titles = [c['title'] for c in results]
        # Student in 10th Grade sees only published courses matching 10th Grade
        self.assertIn('Algebra 101', titles)
        self.assertNotIn('Advanced Geometry', titles)  # unpublished
        self.assertNotIn('Physics Fundamentals', titles)  # 11th Grade

    def test_list_courses_search_and_filter(self):
        self.client.force_authenticate(user=self.teacher)

        # Search filter
        response = self.client.get('/api/v1/courses/?search=Algebra')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['data']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Algebra 101')

        # Category filter
        response = self.client.get('/api/v1/courses/?category=physics')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['data']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Physics Fundamentals')

        # Level filter
        response = self.client.get('/api/v1/courses/?level=beginner')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['data']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Algebra 101')

    def test_create_course_as_teacher(self):
        self.client.force_authenticate(user=self.teacher)
        payload = {
            'title': 'New Biology Course',
            'description': 'Study of life',
            'category': 'biology',
            'level': 'beginner',
            'grade_level': '10th Grade',
            'is_published': True,
        }
        response = self.client.post('/api/v1/courses/', data=payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['title'], 'New Biology Course')

        created_course = Course.objects.get(title='New Biology Course')
        self.assertEqual(created_course.teacher, self.teacher)

    def test_create_course_as_student_forbidden(self):
        self.client.force_authenticate(user=self.student)
        payload = {
            'title': 'Student Created Course',
            'description': 'Should fail',
            'category': 'other',
            'level': 'beginner',
        }
        response = self.client.post('/api/v1/courses/', data=payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --- CourseDetailView Tests ---

    def test_retrieve_course_detail(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/v1/courses/{self.course_teacher1_pub.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['id'], str(self.course_teacher1_pub.id))

    def test_retrieve_deleted_course_not_found(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/v1/courses/{self.course_deleted.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_course_as_owner_teacher(self):
        self.client.force_authenticate(user=self.teacher)
        payload = {
            'title': 'Algebra 101 Updated',
            'description': 'Updated description',
            'category': 'mathematics',
            'level': 'beginner',
        }
        response = self.client.put(f'/api/v1/courses/{self.course_teacher1_pub.id}/', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.course_teacher1_pub.refresh_from_db()
        self.assertEqual(self.course_teacher1_pub.title, 'Algebra 101 Updated')

    def test_update_course_as_non_owner_forbidden(self):
        self.client.force_authenticate(user=self.teacher_other)
        payload = {
            'title': 'Hacked Title',
            'description': 'Hacked description',
            'category': 'mathematics',
            'level': 'beginner',
        }
        response = self.client.put(f'/api/v1/courses/{self.course_teacher1_pub.id}/', data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data['success'])

    def test_delete_course_as_owner_teacher(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.delete(f'/api/v1/courses/{self.course_teacher1_pub.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.course_teacher1_pub.refresh_from_db()
        self.assertTrue(self.course_teacher1_pub.is_deleted)

    def test_delete_course_as_non_owner_forbidden(self):
        self.client.force_authenticate(user=self.teacher_other)
        response = self.client.delete(f'/api/v1/courses/{self.course_teacher1_pub.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data['success'])

    # --- CourseReviewListCreateView Tests ---

    def test_create_and_list_reviews(self):
        self.client.force_authenticate(user=self.student)
        url = f'/api/v1/courses/{self.course_teacher1_pub.id}/reviews/'

        # Create review
        review_data = {
            'rating': 5,
            'comment': 'Great course!',
        }
        response = self.client.post(url, data=review_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])

        # Duplicate review prevention
        duplicate_response = self.client.post(url, data=review_data)
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(duplicate_response.data['success'])

        # List reviews
        list_response = self.client.get(url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        results = list_response.data['data']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['comment'], 'Great course!')
