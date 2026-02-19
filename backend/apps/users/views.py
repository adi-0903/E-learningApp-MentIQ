"""
Authentication and user management views.
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, parsers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

import random
from datetime import timedelta
from django.utils import timezone
import os
from twilio.rest import Client
from .models import PhoneOTP
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    FCMTokenSerializer,
    PhoneOTPVerifySerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """Login endpoint - returns JWT access & refresh tokens with user data."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """Register a new student or teacher account."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Account created successfully.',
            'data': {
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'name': user.name,
                    'role': user.role,
                    'bio': user.bio,
                    'phone_number': user.phone_number,
                    'profile_image': user.profile_image_url,
                    'teacher_id': user.teacher_id,
                    'student_id': user.student_id,
                    'profile_avatar': user.profile_avatar,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """Logout - blacklists the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'success': True,
                'message': 'Logged out successfully.'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'success': True,
                'message': 'Logged out successfully.'
            }, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's profile."""
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = UserProfileSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'Profile updated successfully.',
            'data': UserProfileSerializer(request.user).data
        })


class ChangePasswordView(APIView):
    """Change the current user's password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({
            'success': True,
            'message': 'Password changed successfully.'
        })


class UpdateFCMTokenView(APIView):
    """Update the user's FCM token for push notifications."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FCMTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request.user.fcm_token = serializer.validated_data['fcm_token']
        request.user.save(update_fields=['fcm_token', 'updated_at'])

        return Response({
            'success': True,
            'message': 'FCM token updated.'
        })


class RequestPhoneOTPView(APIView):
    """View to request a phone verification OTP."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        phone_number = request.data.get('phone_number') or user.phone_number

        if not phone_number:
            return Response({
                'success': False,
                'message': 'Phone number is required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Normalize to E.164 format (Twilio requirement)
        phone_number = phone_number.strip().replace(' ', '').replace('-', '')
        if not phone_number.startswith('+'):
            phone_number = f'+91{phone_number}'  # Default to India country code

        # Update user's phone number if provided and different
        if phone_number != user.phone_number:
            user.phone_number = phone_number
            user.is_phone_verified = False
            user.save(update_fields=['phone_number', 'is_phone_verified'])

        # Generate a 4-digit OTP
        otp_code = str(random.randint(1000, 9999))
        expires_at = timezone.now() + timedelta(minutes=10)

        # Invalidate old OTPs
        PhoneOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Save new OTP
        PhoneOTP.objects.create(
            user=user,
            otp_code=otp_code,
            expires_at=expires_at
        )

        # Try sending SMS via Twilio
        try:
            account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
            twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')

            if account_sid and auth_token and twilio_phone:
                client = Client(account_sid, auth_token)
                message = client.messages.create(
                    body=f"Your verification code is: {otp_code}",
                    from_=twilio_phone,
                    to=phone_number
                )
                print(f"Twilio SMS Sent: {message.sid}")
            else:
                print("Twilio credentials missing. Using simulation.")

        except Exception as e:
            print(f"Twilio Error: {e}")

        return Response({
            'success': True,
            'message': f'OTP sent to {phone_number}.',
        })


class VerifyPhoneOTPView(APIView):
    """View to verify a phone verification OTP."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PhoneOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        otp_code = serializer.validated_data['otp_code']
        user = request.user


        # Standard database OTP verification (Fallback)
        # Find the latest valid OTP
        otp_obj = PhoneOTP.objects.filter(
            user=user,
            otp_code=otp_code,
            is_used=False,
            expires_at__gt=timezone.now()
        ).first()

        if not otp_obj:
            return Response({
                'success': False,
                'message': 'Invalid or expired OTP.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as used and user as verified
        otp_obj.is_used = True
        otp_obj.save()

        user.is_phone_verified = True
        user.save(update_fields=['is_phone_verified'])

        return Response({
            'success': True,
            'message': 'Phone number verified successfully.',
            'data': UserProfileSerializer(user).data
        })
