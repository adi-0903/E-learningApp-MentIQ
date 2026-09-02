from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.users.models import PhoneOTP

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

    def test_request_phone_otp_generation(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role'],
            phone_number='+1234567890'
        )
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/v1/auth/request-phone-otp/', {
            'phone_number': '+1234567890'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        otp = PhoneOTP.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(otp)
        self.assertEqual(len(otp.otp_code), 4)
        self.assertTrue(otp.otp_code.isdigit())
        self.assertTrue(1000 <= int(otp.otp_code) <= 9999)

    def test_forgot_password_request_otp_generation(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role']
        )
        response = self.client.post('/api/v1/auth/forgot-password/request/', {
            'identifier': user.email
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        otp = PhoneOTP.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(otp)
        self.assertEqual(len(otp.otp_code), 4)
        self.assertTrue(otp.otp_code.isdigit())
        self.assertTrue(1000 <= int(otp.otp_code) <= 9999)


class SeederLogSecurityTests(TestCase):
    def test_create_users_seeder_does_not_log_passwords(self):
        import io
        import runpy
        from contextlib import redirect_stdout

        f = io.StringIO()
        with redirect_stdout(f):
            runpy.run_module('create_users', run_name='__main__')
        output = f.getvalue()
        self.assertNotIn('@12345', output)
        self.assertIn('Password: [PROTECTED]', output)

    def test_create_parents_seeder_does_not_log_passwords(self):
        import io
        import runpy
        from contextlib import redirect_stdout

        f = io.StringIO()
        with redirect_stdout(f):
            runpy.run_module('create_parents', run_name='__main__')
        output = f.getvalue()
        self.assertNotIn('@12345', output)
        self.assertIn('Pass: [PROTECTED]', output)
