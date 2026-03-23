"""
AI Tutor models.
Stores live AI interaction data used by analytics features.
"""
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
