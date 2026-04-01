"""
Admin registration for AI Tutor and Cognitive AI Companion models.
"""
from django.contrib import admin
from .models import FlashcardSession, InteractionEvent, CognitiveState, CognitiveStateHistory


@admin.register(FlashcardSession)
class FlashcardSessionAdmin(admin.ModelAdmin):
    list_display = ('student', 'topic', 'cards_generated', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('student__name', 'student__email', 'topic')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(InteractionEvent)
class InteractionEventAdmin(admin.ModelAdmin):
    list_display = ('student', 'event_type', 'platform', 'session_id', 'created_at')
    list_filter = ('event_type', 'platform', 'created_at')
    search_fields = ('student__name', 'student__email', 'session_id')
    readonly_fields = ('id', 'created_at', 'updated_at', 'metrics', 'context')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False  # Events are created via API only


@admin.register(CognitiveState)
class CognitiveStateAdmin(admin.ModelAdmin):
    list_display = (
        'student', 'current_mood', 'frustration_score',
        'engagement_score', 'confidence_score', 'cognitive_load', 'computed_at'
    )
    list_filter = ('current_mood', 'cognitive_load')
    search_fields = ('student__name', 'student__email')
    readonly_fields = (
        'id', 'created_at', 'updated_at', 'computed_at',
        'last_signals', 'last_adaptation'
    )

    def has_add_permission(self, request):
        return False  # States are computed by EmotionDetector only


@admin.register(CognitiveStateHistory)
class CognitiveStateHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'student', 'date', 'dominant_mood',
        'avg_frustration', 'avg_engagement', 'avg_confidence',
        'total_interaction_events', 'total_session_minutes'
    )
    list_filter = ('dominant_mood', 'date')
    search_fields = ('student__name', 'student__email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'date'

    def has_add_permission(self, request):
        return False  # History is updated by RecordInteractionView only
