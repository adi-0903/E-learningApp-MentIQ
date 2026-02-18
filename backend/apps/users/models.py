"""
Custom User model with role-based authentication.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from apps.core.models import TimeStampedModel


class UserManager(BaseUserManager):
    """Custom manager for User model."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

    def teachers(self):
        return self.filter(role='teacher', is_active=True)

    def students(self):
        return self.filter(role='student', is_active=True)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Custom User model with email-based authentication and roles."""

    class RoleChoices(models.TextChoices):
        STUDENT = 'student', 'Student'
        TEACHER = 'teacher', 'Teacher'
        ADMIN = 'admin', 'Admin'

    # Core fields
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    role = models.CharField(
        max_length=10,
        choices=RoleChoices.choices,
        default=RoleChoices.STUDENT,
        db_index=True,
    )

    # Profile fields
    bio = models.TextField(blank=True, default='')
    profile_image = models.ImageField(
        upload_to='profile_images/%Y/%m/',
        blank=True,
        null=True,
    )
    profile_avatar = models.CharField(max_length=255, blank=True, default='', help_text='URL or ID of selected avatar')
    phone_number = models.CharField(max_length=20, blank=True, default='')

    # Status fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, default='')

    # Metadata
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    fcm_token = models.CharField(max_length=255, blank=True, default='',
                                  help_text='Firebase Cloud Messaging token for push notifications')
    
    # Unique teacher ID
    teacher_id = models.CharField(
        max_length=5, 
        unique=True, 
        blank=True, 
        null=True,
        help_text="5-digit unique ID for teachers"
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def save(self, *args, **kwargs):
        if self.role == self.RoleChoices.TEACHER and not self.teacher_id:
            import random
            while True:
                tid = str(random.randint(10000, 99999))
                if not User.objects.filter(teacher_id=tid).exists():
                    self.teacher_id = tid
                    break
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['role', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.email})"

    @property
    def is_teacher(self):
        return self.role == self.RoleChoices.TEACHER

    @property
    def is_student(self):
        return self.role == self.RoleChoices.STUDENT

    @property
    def is_admin(self):
        return self.role == self.RoleChoices.ADMIN

    @property
    def profile_image_url(self):
        if self.profile_image:
            return self.profile_image.url
        return None


class PhoneOTP(TimeStampedModel):
    """Model to store OTP codes for phone verification."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_otps')
    otp_code = models.CharField(max_length=6)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'phone_otps'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.otp_code}"
