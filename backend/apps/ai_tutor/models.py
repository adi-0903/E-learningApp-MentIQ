"""
AI Tutor models.
Stores live AI interaction data, cognitive state tracking, and interaction events.
"""
import uuid
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class FlashcardSession(TimeStampedModel):
    """
    Stores generated flashcard deck metadata per student.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='flashcard_sessions',
        limit_choices_to={'role': 'student'},
    )
    topic = models.CharField(max_length=255)
    cards_generated = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'ai_flashcard_sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['topic']),
        ]

    def __str__(self):
        return f"{self.student.email} - {self.topic} ({self.cards_generated} cards)"


# ─────────────────────────────────────────────────────────────
# 🧠 COGNITIVE AI COMPANION MODELS
# ─────────────────────────────────────────────────────────────

class InteractionEvent(TimeStampedModel):
    """
    Stores batched interaction snapshots sent from mobile/web clients.
    Each record represents a 30-second interaction window.
    Raw events are retained for 20 days, then cleaned up.
    """

    PLATFORM_CHOICES = [
        ('mobile', 'Mobile (Expo)'),
        ('web', 'Web (React)'),
    ]

    EVENT_TYPE_CHOICES = [
        ('typing_pattern', 'Typing Pattern'),
        ('touch_pattern', 'Touch Pattern'),
        ('mouse_pattern', 'Mouse Pattern'),
        ('quiz_interaction', 'Quiz Interaction'),
        ('scroll_pattern', 'Scroll Pattern'),
        ('focus_pattern', 'Focus/Attention Pattern'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='interaction_events',
        limit_choices_to={'role': 'student'},
    )
    session_id = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Groups events within a single study session"
    )
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)

    # Aggregated metrics (privacy-safe — no raw keystrokes/coordinates)
    metrics = models.JSONField(
        default=dict,
        help_text="Aggregated interaction metrics: typing_speed_wpm, backspace_rate, "
                  "pause_count, scroll_velocity, tap_frequency, idle_seconds, etc."
    )

    # Context about what the student was doing
    context = models.JSONField(
        default=dict,
        blank=True,
        help_text="Current screen, lesson_id, quiz_id, etc."
    )

    class Meta:
        db_table = 'ai_interaction_events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', '-created_at']),
            models.Index(fields=['session_id']),
            models.Index(fields=['event_type']),
            models.Index(fields=['student', 'session_id']),
        ]

    def __str__(self):
        return f"{self.student.name} | {self.event_type} | {self.platform} | {self.created_at:%H:%M}"


class CognitiveState(TimeStampedModel):
    """
    Aggregated emotional/cognitive state per student.
    Updated each time new interaction events are processed.
    Only ONE active record per student (latest snapshot).
    """

    COGNITIVE_LOAD_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('overloaded', 'Overloaded'),
    ]

    MOOD_CHOICES = [
        ('focused', 'Focused'),
        ('neutral', 'Neutral'),
        ('struggling', 'Struggling'),
        ('frustrated', 'Frustrated'),
        ('bored', 'Bored'),
        ('confident', 'Confident'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cognitive_state',
        limit_choices_to={'role': 'student'},
    )

    # Core emotional scores (0.0 — 1.0)
    frustration_score = models.FloatField(default=0.0, help_text="0.0 = calm, 1.0 = very frustrated")
    engagement_score = models.FloatField(default=0.5, help_text="0.0 = disengaged, 1.0 = deeply engaged")
    confidence_score = models.FloatField(default=0.5, help_text="0.0 = uncertain, 1.0 = very confident")

    # Derived states
    cognitive_load = models.CharField(
        max_length=12,
        choices=COGNITIVE_LOAD_CHOICES,
        default='medium',
    )
    current_mood = models.CharField(
        max_length=12,
        choices=MOOD_CHOICES,
        default='neutral',
    )

    # Signal breakdown for debugging/analytics
    last_signals = models.JSONField(
        default=dict,
        blank=True,
        help_text="Raw signal breakdown used to compute scores"
    )

    # When this state was computed
    computed_at = models.DateTimeField(auto_now=True)

    # Adaptation settings applied
    last_adaptation = models.JSONField(
        default=dict,
        blank=True,
        help_text="Last adaptation strategy: tone, difficulty_adjustment, etc."
    )

    class Meta:
        db_table = 'ai_cognitive_states'
        indexes = [
            models.Index(fields=['current_mood']),
            models.Index(fields=['frustration_score']),
        ]

    def __str__(self):
        return f"🧠 {self.student.name} | Mood: {self.current_mood} | Frustration: {self.frustration_score:.1f}"


class CognitiveStateHistory(TimeStampedModel):
    """
    Historical snapshots of cognitive state for trend analysis.
    One record per day per student (aggregated daily summary).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cognitive_history',
        limit_choices_to={'role': 'student'},
    )
    date = models.DateField(db_index=True)

    # Daily averages
    avg_frustration = models.FloatField(default=0.0)
    avg_engagement = models.FloatField(default=0.5)
    avg_confidence = models.FloatField(default=0.5)
    dominant_mood = models.CharField(max_length=12, default='neutral')
    total_interaction_events = models.PositiveIntegerField(default=0)
    total_session_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'ai_cognitive_state_history'
        unique_together = ['student', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['student', '-date']),
        ]

    def __str__(self):
        return f"📊 {self.student.name} | {self.date} | Mood: {self.dominant_mood}"
