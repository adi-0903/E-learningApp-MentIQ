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
        from django.core.cache import cache
        cache.clear()
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

    def test_forgot_password_verify_success(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role']
        )
        self.client.post('/api/v1/auth/forgot-password/request/', {
            'identifier': user.email
        }, format='json')
        otp = PhoneOTP.objects.filter(user=user, is_used=False).first()

        new_pass = 'NewSecurePass2026!'
        response = self.client.post('/api/v1/auth/forgot-password/verify/', {
            'identifier': user.email,
            'otp_code': otp.otp_code,
            'new_password': new_pass
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        otp.refresh_from_db()
        self.assertTrue(otp.is_used)

        # Check user can log in with new password
        login_resp = self.client.post(self.login_url, {
            'email': user.email,
            'password': new_pass
        }, format='json')
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

    def test_forgot_password_verify_incorrect_otp_increments_attempts(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role']
        )
        self.client.post('/api/v1/auth/forgot-password/request/', {
            'identifier': user.email
        }, format='json')
        otp = PhoneOTP.objects.filter(user=user, is_used=False).first()

        wrong_otp = '0000' if otp.otp_code != '0000' else '1111'
        response = self.client.post('/api/v1/auth/forgot-password/verify/', {
            'identifier': user.email,
            'otp_code': wrong_otp,
            'new_password': 'NewPassword123!'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        otp.refresh_from_db()
        self.assertEqual(otp.attempts, 1)
        self.assertFalse(otp.is_used)

    def test_forgot_password_verify_lockout_after_max_attempts(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role']
        )
        self.client.post('/api/v1/auth/forgot-password/request/', {
            'identifier': user.email
        }, format='json')
        otp = PhoneOTP.objects.filter(user=user, is_used=False).first()
        valid_code = otp.otp_code
        wrong_otp = '0000' if valid_code != '0000' else '1111'

        # Make 5 failed attempts
        for i in range(5):
            res = self.client.post('/api/v1/auth/forgot-password/verify/', {
                'identifier': user.email,
                'otp_code': wrong_otp,
                'new_password': 'NewPassword123!'
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        otp.refresh_from_db()
        self.assertTrue(otp.is_used)
        self.assertEqual(otp.attempts, 5)

        # Attempt with valid OTP should now fail because OTP is locked out
        res = self.client.post('/api/v1/auth/forgot-password/verify/', {
            'identifier': user.email,
            'otp_code': valid_code,
            'new_password': 'NewPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid or expired', res.data.get('message', ''))

    def test_forgot_password_verify_rate_limiting(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            name=self.user_data['name'],
            role=self.user_data['role']
        )
        statuses = []
        for _ in range(11):
            res = self.client.post('/api/v1/auth/forgot-password/verify/', {
                'identifier': user.email,
                'otp_code': '0000',
                'new_password': 'NewPassword123!'
            }, format='json')
            statuses.append(res.status_code)

        self.assertIn(status.HTTP_429_TOO_MANY_REQUESTS, statuses)

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


class ForgotPasswordSecurityTests(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
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
