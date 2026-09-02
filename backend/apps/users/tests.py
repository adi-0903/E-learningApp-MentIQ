import os
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from apps.users.models import PhoneOTP
from create_users import get_seed_password

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


class SeederPasswordGenerationTests(TestCase):
    def test_generated_password_randomness_and_complexity(self):
        pwd1 = get_seed_password()
        pwd2 = get_seed_password()

        self.assertNotEqual(pwd1, pwd2)
        self.assertGreaterEqual(len(pwd1), 16)
        self.assertTrue(any(c.islower() for c in pwd1))
        self.assertTrue(any(c.isupper() for c in pwd1))
        self.assertTrue(any(c.isdigit() for c in pwd1))
        self.assertTrue(any(c in "!@#$%^&*" for c in pwd1))

        # Ensure generated password passes Django's password validators
        validate_password(pwd1)

    @patch.dict(os.environ, {'SEED_PASSWORD': 'CustomGlobalPassword123!'}, clear=False)
    def test_global_env_password_override(self):
        pwd = get_seed_password('someuser@mentiq.com')
        self.assertEqual(pwd, 'CustomGlobalPassword123!')

    @patch.dict(os.environ, {
        'SEED_PASSWORD_ADMIN_MENTIQ_COM': 'AdminSpecificPassword2026!',
        'SEED_PASSWORD': 'FallbackGlobalPassword123!'
    }, clear=False)
    def test_user_specific_env_password_override(self):
        pwd_admin = get_seed_password('admin@mentiq.com')
        pwd_other = get_seed_password('other@mentiq.com')

        self.assertEqual(pwd_admin, 'AdminSpecificPassword2026!')
        self.assertEqual(pwd_other, 'FallbackGlobalPassword123!')
