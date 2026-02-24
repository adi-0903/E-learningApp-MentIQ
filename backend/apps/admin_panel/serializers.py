"""
Admin Panel Serializers — Full CRUD for teachers & students,
plus read-only views for courses, enrollments, attendance, quizzes, payments.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.courses.models import Course, CourseReview
from apps.enrollments.models import Enrollment
from apps.quizzes.models import Quiz, QuizAttempt
from apps.lessons.models import Lesson
from apps.progress.models import CourseProgress, LessonProgress
from apps.attendance.models import AttendanceSession, AttendanceRecord
from apps.payments.models import Payment
from apps.announcements.models import Announcement
from apps.live_classes.models import LiveClass
from .models import PremiumPlan

User = get_user_model()


# ───────────────────────────────────────────────────────────────
# USER MANAGEMENT (Teachers & Students)
# ───────────────────────────────────────────────────────────────

class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing users in admin panel."""
    profile_image_url = serializers.ReadOnlyField()
    courses_count = serializers.SerializerMethodField()
    enrollments_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'bio', 'phone_number',
            'profile_image', 'profile_image_url', 'profile_avatar',
            'teacher_id', 'student_id',
            'is_active', 'is_email_verified', 'is_phone_verified',
            'created_at', 'updated_at', 'last_login',
            'courses_count', 'enrollments_count',
        ]
        read_only_fields = fields

    def get_courses_count(self, obj):
        if obj.role == 'teacher':
            return obj.courses.count()
        return 0

    def get_enrollments_count(self, obj):
        if obj.role == 'student':
            return obj.enrollments.filter(is_active=True).count()
        return 0


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for viewing a single user in admin panel."""
    profile_image_url = serializers.ReadOnlyField()
    courses = serializers.SerializerMethodField()
    enrollments = serializers.SerializerMethodField()
    quiz_attempts_count = serializers.SerializerMethodField()
    attendance_stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'bio', 'phone_number',
            'profile_image', 'profile_image_url', 'profile_avatar',
            'teacher_id', 'student_id',
            'is_active', 'is_email_verified', 'is_phone_verified',
            'is_staff', 'is_superuser',
            'created_at', 'updated_at', 'last_login',
            'courses', 'enrollments', 'quiz_attempts_count', 'attendance_stats',
        ]
        read_only_fields = fields

    def get_courses(self, obj):
        """Return courses taught (teacher) or enrolled in (student)."""
        if obj.role == 'teacher':
            return list(obj.courses.values('id', 'title', 'category', 'is_published', 'created_at'))
        return []

    def get_enrollments(self, obj):
        """Return enrollment details for students."""
        if obj.role == 'student':
            enrollments = Enrollment.objects.filter(student=obj, is_active=True).select_related('course')
            return [
                {
                    'id': str(e.id),
                    'course_id': str(e.course_id),
                    'course_title': e.course.title,
                    'enrolled_at': e.enrolled_at,
                }
                for e in enrollments
            ]
        return []

    def get_quiz_attempts_count(self, obj):
        if obj.role == 'student':
            return obj.quiz_attempts.count()
        return 0

    def get_attendance_stats(self, obj):
        if obj.role == 'student':
            total = AttendanceRecord.objects.filter(student=obj).count()
            present = AttendanceRecord.objects.filter(student=obj, is_present=True).count()
            return {
                'total_sessions': total,
                'present': present,
                'absent': total - present,
                'percentage': round((present / total) * 100, 1) if total > 0 else 0,
            }
        return None


class AdminCreateTeacherSerializer(serializers.ModelSerializer):
    """Serializer for admin to create a new teacher account."""
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password],
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'bio', 'phone_number']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(
            role='teacher',
            is_email_verified=True,  # Admin-created users are pre-verified
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class AdminCreateStudentSerializer(serializers.ModelSerializer):
    """Serializer for admin to create a new student account."""
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password],
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'bio', 'phone_number']

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(
            role='student',
            is_email_verified=True,
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class AdminUpdateUserSerializer(serializers.ModelSerializer):
    """Serializer for admin to update any user's profile."""
    class Meta:
        model = User
        fields = ['name', 'bio', 'phone_number', 'is_active', 'is_email_verified']

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError('Name must be at least 2 characters.')
        return value.strip()


class AdminResetPasswordSerializer(serializers.Serializer):
    """Serializer for admin to reset a user's password."""
    new_password = serializers.CharField(
        required=True, validators=[validate_password],
        style={'input_type': 'password'}
    )


# ───────────────────────────────────────────────────────────────
# COURSE MANAGEMENT (Read + Publish/Unpublish)
# ───────────────────────────────────────────────────────────────

class AdminCourseListSerializer(serializers.ModelSerializer):
    """Course list for admin overview."""
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    student_count = serializers.ReadOnlyField()
    lesson_count = serializers.ReadOnlyField()
    quiz_count = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'category', 'level',
            'teacher', 'teacher_name', 'teacher_email',
            'is_published', 'is_featured', 'is_free', 'price',
            'student_count', 'lesson_count', 'quiz_count',
            'duration', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class AdminCourseDetailSerializer(serializers.ModelSerializer):
    """Detailed course view for admin with lessons, quizzes, enrollments."""
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    student_count = serializers.ReadOnlyField()
    lesson_count = serializers.ReadOnlyField()
    quiz_count = serializers.ReadOnlyField()
    lessons = serializers.SerializerMethodField()
    quizzes = serializers.SerializerMethodField()
    enrolled_students = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'category', 'level',
            'teacher', 'teacher_name', 'teacher_email',
            'is_published', 'is_featured', 'is_free', 'price', 'duration',
            'student_count', 'lesson_count', 'quiz_count',
            'lessons', 'quizzes', 'enrolled_students', 'reviews',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_lessons(self, obj):
        return list(obj.lessons.filter(is_deleted=False).values(
            'id', 'title', 'sequence_number', 'file_type', 'duration'
        ))

    def get_quizzes(self, obj):
        return list(obj.quizzes.values(
            'id', 'title', 'is_published', 'passing_score', 'duration'
        ))

    def get_enrolled_students(self, obj):
        enrollments = Enrollment.objects.filter(
            course=obj, is_active=True
        ).select_related('student')
        return [
            {
                'id': str(e.student.id),
                'name': e.student.name,
                'email': e.student.email,
                'student_id': e.student.student_id,
                'enrolled_at': e.enrolled_at,
            }
            for e in enrollments
        ]

    def get_reviews(self, obj):
        return list(obj.reviews.values(
            'id', 'student__name', 'rating', 'comment', 'created_at'
        ))


# ───────────────────────────────────────────────────────────────
# ENROLLMENT MANAGEMENT
# ───────────────────────────────────────────────────────────────

class AdminEnrollmentSerializer(serializers.ModelSerializer):
    """Enrollment details for admin view."""
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_id_num = serializers.CharField(source='student.student_id', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    teacher_name = serializers.CharField(source='course.teacher.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'student_email', 'student_id_num',
            'course', 'course_title', 'teacher_name',
            'is_active', 'enrolled_at', 'unenrolled_at',
            'created_at',
        ]
        read_only_fields = fields


# ───────────────────────────────────────────────────────────────
# ATTENDANCE OVERVIEW
# ───────────────────────────────────────────────────────────────

class AdminAttendanceSessionSerializer(serializers.ModelSerializer):
    """Attendance session overview for admin."""
    course_title = serializers.CharField(source='course.title', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    total_records = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'course', 'course_title', 'teacher', 'teacher_name',
            'date', 'start_time', 'total_records', 'present_count',
            'created_at',
        ]
        read_only_fields = fields

    def get_total_records(self, obj):
        return obj.records.count()

    def get_present_count(self, obj):
        return obj.records.filter(is_present=True).count()


# ───────────────────────────────────────────────────────────────
# QUIZ OVERVIEW
# ───────────────────────────────────────────────────────────────

class AdminQuizSerializer(serializers.ModelSerializer):
    """Quiz details for admin view."""
    course_title = serializers.CharField(source='course.title', read_only=True)
    question_count = serializers.ReadOnlyField()
    attempts_count = serializers.SerializerMethodField()
    avg_score = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'course', 'course_title',
            'duration', 'passing_score', 'is_published', 'max_attempts',
            'question_count', 'attempts_count', 'avg_score',
            'created_at',
        ]
        read_only_fields = fields

    def get_attempts_count(self, obj):
        return obj.attempts.count()

    def get_avg_score(self, obj):
        attempts = obj.attempts.all()
        if not attempts.exists():
            return 0
        total_pct = sum(a.percentage for a in attempts)
        return round(total_pct / attempts.count(), 1)


# ───────────────────────────────────────────────────────────────
# PAYMENT OVERVIEW
# ───────────────────────────────────────────────────────────────

class AdminPaymentSerializer(serializers.ModelSerializer):
    """Payment details for admin view."""
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'course', 'course_title',
            'amount', 'currency', 'status', 'payment_method',
            'stripe_payment_intent_id',
            'created_at',
        ]
        read_only_fields = fields


# ───────────────────────────────────────────────────────────────
# ANNOUNCEMENT & LIVE CLASS OVERVIEW
# ───────────────────────────────────────────────────────────────

class AdminAnnouncementSerializer(serializers.ModelSerializer):
    """Announcement details for admin view."""
    teacher_name = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'is_pinned',
            'teacher', 'teacher_name', 'course', 'course_title',
            'target_audience', 'created_by_admin',
            'created_at',
        ]
        read_only_fields = fields

    def get_teacher_name(self, obj):
        if obj.created_by_admin:
            return 'Admin'
        return obj.teacher.name if obj.teacher else 'Unknown'

    def get_course_title(self, obj):
        return obj.course.title if obj.course else 'Global'


class AdminCreateAnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for admin to create announcements with audience targeting."""
    class Meta:
        model = Announcement
        fields = ['title', 'content', 'priority', 'is_pinned', 'target_audience']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['teacher'] = request.user if request else None
        validated_data['created_by_admin'] = True
        return super().create(validated_data)


class AdminLiveClassSerializer(serializers.ModelSerializer):
    """Live class details for admin view."""
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    course_title = serializers.SerializerMethodField()
    participant_count = serializers.ReadOnlyField()

    class Meta:
        model = LiveClass
        fields = [
            'id', 'title', 'description', 'status',
            'teacher', 'teacher_name', 'course', 'course_title',
            'scheduled_at', 'started_at', 'ended_at',
            'max_participants', 'participant_count',
            'created_at',
        ]
        read_only_fields = fields

    def get_course_title(self, obj):
        return obj.course.title if obj.course else None


# ───────────────────────────────────────────────────────────────
# DASHBOARD STATS (Platform overview)
# ───────────────────────────────────────────────────────────────

class AdminDashboardSerializer(serializers.Serializer):
    """Platform-wide dashboard statistics."""
    total_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    published_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    total_quizzes = serializers.IntegerField()
    total_quiz_attempts = serializers.IntegerField()
    total_lessons = serializers.IntegerField()
    total_payments = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_live_classes = serializers.IntegerField()
    total_announcements = serializers.IntegerField()
    recent_students = AdminUserListSerializer(many=True)
    recent_teachers = AdminUserListSerializer(many=True)


# ───────────────────────────────────────────────────────────────
# PREMIUM PLAN MANAGEMENT
# ───────────────────────────────────────────────────────────────

class AdminPremiumPlanSerializer(serializers.ModelSerializer):
    """Full read/write serializer for premium plans."""
    tier_display = serializers.CharField(
        source='get_tier_display', read_only=True
    )

    class Meta:
        model = PremiumPlan
        fields = [
            'id', 'tier', 'tier_display', 'name', 'description',
            'quarterly_price', 'annual_price', 'currency',
            'max_courses', 'max_downloads',
            'ai_tutor_access', 'live_classes_access',
            'certificate_access', 'priority_support', 'analytics_access',
            'custom_features',
            'is_active', 'is_popular', 'badge_text', 'color',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'tier_display', 'created_at', 'updated_at']
