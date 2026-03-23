from rest_framework import serializers
from .models import CourseProgress, LessonProgress, AchievementBadge, StudentBadge, BadgeCategory


# ─────────────────────────────────────────────────────────────
# 🎮 BADGE SYSTEM SERIALIZERS
# ─────────────────────────────────────────────────────────────

class AchievementBadgeSerializer(serializers.ModelSerializer):
    """Serializer for displaying available badges."""
    rarity_display = serializers.CharField(source='get_rarity_display', read_only=True)
    
    class Meta:
        model = AchievementBadge
        fields = [
            'id', 'name', 'description', 'rarity', 'rarity_display',
            'icon_url', 'animated_icon_url', 'criteria_type', 
            'criteria_threshold', 'tradeable', 'total_awarded'
        ]
        read_only_fields = fields


class StudentBadgeSerializer(serializers.ModelSerializer):
    """Serializer for student's earned badges."""
    badge = AchievementBadgeSerializer(read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = StudentBadge
        fields = [
            'id', 'student', 'student_name', 'badge', 'progress',
            'is_claimed', 'awarded_at', 'is_tradeable', 'trade_status',
<<<<<<< HEAD
            'showcase_on_profile', 'created_at'
=======
            'showcase_on_profile', 'certificate_url', 'created_at'
>>>>>>> 5631f33dd76a2ac308e2de2411b0d49693f15bfe
        ]
        read_only_fields = ['id', 'created_at']


class BadgeEarningSerializer(serializers.Serializer):
    """Serializer for awarding badges to students."""
    student_id = serializers.UUIDField(required=True)
    badge_criteria_type = serializers.CharField(max_length=50, required=True)
    context_data = serializers.DictField(required=False, help_text="Additional context for badge earning")


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for leaderboard entries."""
    rank = serializers.IntegerField()
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    student_email = serializers.EmailField()
    total_badges = serializers.IntegerField()
    rare_badges = serializers.IntegerField()
    score = serializers.IntegerField()


class BadgeTradeSerializer(serializers.Serializer):
    """Serializer for listing badges for trade."""
    badge_id = serializers.UUIDField(required=True)
    asking_price = serializers.IntegerField(min_value=1, required=True)
    notes = serializers.CharField(max_length=200, required=False, allow_blank=True)


# ─────────────────────────────────────────────────────────────
# 📊 ORIGINAL PROGRESS SERIALIZERS
# ─────────────────────────────────────────────────────────────

class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = ['id', 'lesson', 'lesson_title', 'completed', 'completed_at', 'time_spent']
        read_only_fields = ['id', 'completed_at']


class CourseProgressSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = CourseProgress
        fields = ['id', 'course', 'course_title', 'progress_percentage', 'last_lesson', 'updated_at']
        read_only_fields = fields


class MarkLessonCompleteSerializer(serializers.Serializer):
    lesson_id = serializers.UUIDField()
    time_spent = serializers.IntegerField(required=False, default=0)
