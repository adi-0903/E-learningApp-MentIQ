"""
Progress models - Lesson-level and course-level progress tracking + Gamification.
"""
import uuid
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


# ─────────────────────────────────────────────────────────────
# 🎮 GAMIFICATION MODELS - Badge System
# ─────────────────────────────────────────────────────────────

class AchievementBadge(TimeStampedModel):
    """
    Achievement badges for gamification system.
    Students earn badges for completing milestones.
    """
    RARITY_CHOICES = [
        ('COMMON', 'Common (Bronze)'),
        ('RARE', 'Rare (Silver)'),
        ('EPIC', 'Epic (Gold)'),
        ('LEGENDARY', 'Legendary (Diamond)'),
        ('MYTHIC', 'Mythic (Platinum)'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(help_text="What this badge represents")
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='COMMON')
    
    # Visual assets
    icon_url = models.URLField(help_text="URL to badge icon image")
    animated_icon_url = models.URLField(blank=True, null=True, help_text="Optional animated version")
    certificate_template = models.FileField(upload_to='certificates/', blank=True, null=True)
    
    # Earning criteria
    criteria_type = models.CharField(max_length=50, help_text="e.g., 'quiz_mastery', 'streak_master', 'course_completion'")
    criteria_threshold = models.IntegerField(help_text="Number of times/level required")
    
    # Economy & trading
    tradeable = models.BooleanField(default=False, help_text="Can this badge be traded?")
    drop_rate = models.FloatField(default=0.6, help_text="Relative rarity (0-1)")
    
    # Statistics
    total_awarded = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'achievement_badges'
        ordering = ['-rarity', 'name']
        indexes = [
            models.Index(fields=['rarity']),
            models.Index(fields=['criteria_type']),
        ]
    
    def __str__(self):
        return f"🏆 {self.name} ({self.get_rarity_display()})"


class StudentBadge(TimeStampedModel):
    """
    Tracks which badges a student has earned.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='earned_badges',
        limit_choices_to={'role': 'student'}
    )
    badge = models.ForeignKey(AchievementBadge, on_delete=models.CASCADE, related_name='student_badges')
    
    # Progress tracking
    progress = models.PositiveIntegerField(default=0, help_text="Current progress toward earning (e.g., 3/7 days)")
    is_claimed = models.BooleanField(default=False, help_text="Has student claimed this badge?")
    awarded_at = models.DateTimeField(null=True, blank=True, help_text="When badge was actually earned")
    
    # Trading
    is_tradeable = models.BooleanField(default=False)
    trade_status = models.CharField(
        max_length=20,
        choices=[
            ('NOT_LISTED', 'Not Listed'),
            ('LISTED', 'Listed for Trade'),
            ('TRADED', 'Already Traded'),
        ],
        default='NOT_LISTED'
    )
    
    # Social
    showcase_on_profile = models.BooleanField(default=True, help_text="Show on public profile?")
    
    class Meta:
        db_table = 'student_badges'
        unique_together = ['student', 'badge']
        ordering = ['-awarded_at']
        indexes = [
            models.Index(fields=['student', '-awarded_at']),
            models.Index(fields=['is_claimed']),
        ]
    
    def __str__(self):
        status = "✅" if self.is_claimed else "⏳"
        return f"{status} {self.student.name} - {self.badge.name}"


class BadgeCategory(TimeStampedModel):
    """
    Optional categories for organizing badges.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.URLField(help_text="Category icon URL")
    
    class Meta:
        db_table = 'badge_categories'
        verbose_name_plural = 'Badge Categories'
    
    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────
# 📊 ORIGINAL PROGRESS MODELS
# ─────────────────────────────────────────────────────────────

class LessonProgress(TimeStampedModel):
    """Tracks whether a student has completed a specific lesson."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_progresses',
    )
    lesson = models.ForeignKey(
        'lessons.Lesson',
        on_delete=models.CASCADE,
        related_name='progresses',
    )
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent = models.PositiveIntegerField(default=0, help_text='Time spent in seconds')

    class Meta:
        db_table = 'lesson_progress'
        unique_together = ['student', 'lesson']
        indexes = [
            models.Index(fields=['student', 'completed']),
            models.Index(fields=['lesson', 'completed']),
        ]

    def __str__(self):
        status = '✅' if self.completed else '⏳'
        return f"{status} {self.student.name} - {self.lesson.title}"


class CourseProgress(TimeStampedModel):
    """Aggregated course-level progress for a student."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='course_progresses',
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='progresses',
    )
    progress_percentage = models.FloatField(default=0.0)
    last_lesson = models.ForeignKey(
        'lessons.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )

    class Meta:
        db_table = 'course_progress'
        unique_together = ['student', 'course']
        indexes = [
            models.Index(fields=['student', 'progress_percentage']),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.course.title}: {self.progress_percentage}%"

    def recalculate(self):
        """Recalculate progress_percentage from lesson completions."""
        total = self.course.lessons.filter(is_deleted=False).count()
        if total == 0:
            self.progress_percentage = 0
        else:
            completed = LessonProgress.objects.filter(
                student=self.student,
                lesson__course=self.course,
                completed=True,
            ).count()
            self.progress_percentage = round((completed / total) * 100, 1)
        self.save(update_fields=['progress_percentage', 'updated_at'])
