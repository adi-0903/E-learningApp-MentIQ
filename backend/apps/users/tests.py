from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'
        self.login_url = '/api/v1/auth/login/'
        self.profile_url = '/api/v1/auth/profile/'

        self.user_data = {
            'email': 'testuser@mentiq.com',
            'password': 'MentiQ#Pass2026!',
            'password_confirm': 'MentiQ#Pass2026!',
            'name': 'Test Student',
            'role': 'student'
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(User.objects.filter(email='testuser@mentiq.com').exists())

    def test_user_login(self):
        User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role']
        )
        response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data.get('data', response.data) or response.data)

    def test_get_profile_authenticated(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role']
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ForgotPasswordSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.forgot_request_url = '/api/v1/auth/forgot-password/request/'
        self.forgot_verify_url = '/api/v1/auth/forgot-password/verify/'
        self.login_url = '/api/v1/auth/login/'

        self.user = User.objects.create_user(
            email='existing@mentiq.com',
            password='OldPassword123!',
            name='Existing User',
            role='student'
        )

    def test_forgot_password_request_existing_user(self):
        from apps.users.models import PhoneOTP

        response = self.client.post(self.forgot_request_url, {
            'identifier': 'existing@mentiq.com'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(
            response.data.get('message'),
            'If an account matches that information, a verification code has been sent.'
        )
        self.assertTrue(PhoneOTP.objects.filter(user=self.user, is_used=False).exists())

    def test_forgot_password_request_non_existing_user_prevents_enumeration(self):
        from apps.users.models import PhoneOTP

        response = self.client.post(self.forgot_request_url, {
            'identifier': 'nonexistent@mentiq.com'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(
            response.data.get('message'),
            'If an account matches that information, a verification code has been sent.'
        )
        self.assertEqual(PhoneOTP.objects.count(), 0)

    def test_forgot_password_verify_non_existing_user_prevents_enumeration(self):
        response = self.client.post(self.forgot_verify_url, {
            'identifier': 'nonexistent@mentiq.com',
            'otp_code': '0000',
            'new_password': 'NewPassword123!'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get('success'))
        self.assertEqual(
            response.data.get('message'),
            'Invalid or expired verification code.'
        )

    def test_forgot_password_verify_success_and_login(self):
        from apps.users.models import PhoneOTP

        # Request reset
        self.client.post(self.forgot_request_url, {
            'identifier': 'existing@mentiq.com'
        }, format='json')

        otp_obj = PhoneOTP.objects.filter(user=self.user, is_used=False).latest('created_at')

        # Verify and update password
        response = self.client.post(self.forgot_verify_url, {
            'identifier': 'existing@mentiq.com',
            'otp_code': otp_obj.otp_code,
            'new_password': 'BrandNewPassword123!'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))

        # Verify login works with new password
        login_resp = self.client.post(self.login_url, {
            'email': 'existing@mentiq.com',
            'password': 'BrandNewPassword123!'
        }, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
