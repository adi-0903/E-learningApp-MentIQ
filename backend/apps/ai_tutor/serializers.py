"""
Serializers for the Cognitive AI Companion system.
Handles validation of interaction events and serialization of cognitive state data.
"""
from rest_framework import serializers
from .models import InteractionEvent, CognitiveState, CognitiveStateHistory


class InteractionMetricsSerializer(serializers.Serializer):
    """Validates individual interaction metrics within an event."""
    # Typing metrics
    typing_speed_wpm = serializers.FloatField(required=False, min_value=0, max_value=300)
    backspace_rate = serializers.FloatField(required=False, min_value=0, max_value=1.0)
    pause_count = serializers.IntegerField(required=False, min_value=0)
    long_pause_count = serializers.IntegerField(required=False, min_value=0)

    # Touch/Mouse metrics
    tap_frequency = serializers.FloatField(required=False, min_value=0)
    scroll_velocity = serializers.FloatField(required=False, min_value=0)
    rapid_clicks = serializers.IntegerField(required=False, min_value=0)
    idle_seconds = serializers.FloatField(required=False, min_value=0, max_value=3600)

    # Quiz metrics
    answer_time_seconds = serializers.FloatField(required=False, min_value=0)
    answer_changes = serializers.IntegerField(required=False, min_value=0)
    repeat_attempts = serializers.IntegerField(required=False, min_value=0)

    # Session metrics
    session_duration_minutes = serializers.FloatField(required=False, min_value=0)


class InteractionContextSerializer(serializers.Serializer):
    """Validates context information for an interaction event."""
    screen = serializers.CharField(required=False, max_length=100)
    lesson_id = serializers.CharField(required=False, max_length=64, allow_blank=True)
    quiz_id = serializers.CharField(required=False, max_length=64, allow_blank=True)
    course_id = serializers.CharField(required=False, max_length=64, allow_blank=True)


class SingleInteractionEventSerializer(serializers.Serializer):
    """Validates a single interaction event within a batch."""
    event_type = serializers.ChoiceField(
        choices=['typing_pattern', 'touch_pattern', 'mouse_pattern',
                 'quiz_interaction', 'scroll_pattern', 'focus_pattern']
    )
    metrics = InteractionMetricsSerializer()
    context = InteractionContextSerializer(required=False, default=dict)
    timestamp = serializers.DateTimeField(required=False)


class BatchInteractionSerializer(serializers.Serializer):
    """
    Validates a batch of interaction events from the client.
    Clients send events every 30 seconds.
    """
    session_id = serializers.CharField(max_length=64)
    platform = serializers.ChoiceField(choices=['mobile', 'web'])
    events = SingleInteractionEventSerializer(many=True, min_length=1, max_length=50)

    def validate_events(self, events):
        if len(events) > 50:
            raise serializers.ValidationError("Maximum 50 events per batch.")
        return events


class CognitiveStateSerializer(serializers.ModelSerializer):
    """Read-only serializer for the current cognitive state."""
    student_name = serializers.CharField(source='student.name', read_only=True)
    adaptation = serializers.SerializerMethodField()

    class Meta:
        model = CognitiveState
        fields = [
            'id', 'student', 'student_name',
            'frustration_score', 'engagement_score', 'confidence_score',
            'cognitive_load', 'current_mood',
            'last_signals', 'last_adaptation', 'adaptation',
            'computed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_adaptation(self, obj):
        """Return the current adaptation strategy based on live state."""
        from .emotion_detector import EmotionDetector
        detector = EmotionDetector()
        state_dict = {
            'frustration_score': obj.frustration_score,
            'engagement_score': obj.engagement_score,
            'confidence_score': obj.confidence_score,
            'cognitive_load': obj.cognitive_load,
            'current_mood': obj.current_mood,
        }
        return detector.get_adaptation_strategy(state_dict)


class CognitiveHistorySerializer(serializers.ModelSerializer):
    """Serializer for daily cognitive state history entries."""

    class Meta:
        model = CognitiveStateHistory
        fields = [
            'id', 'date',
            'avg_frustration', 'avg_engagement', 'avg_confidence',
            'dominant_mood', 'total_interaction_events', 'total_session_minutes',
        ]
        read_only_fields = fields
