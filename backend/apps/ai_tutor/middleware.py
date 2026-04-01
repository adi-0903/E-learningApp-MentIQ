"""
CognitiveStateMiddleware — Attaches the student's cognitive state to AI requests.

This middleware runs ONLY on /api/v1/ai/ endpoints to avoid impacting
non-AI request performance. It fetches the student's latest CognitiveState
and attaches it to request.cognitive_state for views to use.
"""
import logging

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class CognitiveStateMiddleware(MiddlewareMixin):
    """
    Attaches cognitive state to request context for AI endpoints.
    
    Only activates for authenticated students hitting /api/v1/ai/ endpoints.
    Adds request.cognitive_state (dict or None) without blocking.
    """

    def process_request(self, request):
        # Default: no cognitive state
        request.cognitive_state = None

        # Only process AI endpoints
        if not request.path.startswith('/api/v1/ai/'):
            return

        # Only for authenticated students
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return

        role = getattr(user, 'role', '')
        if role != 'student':
            return

        try:
            from .models import CognitiveState
            state = CognitiveState.objects.filter(student=user).first()
            if state:
                request.cognitive_state = {
                    'frustration_score': state.frustration_score,
                    'engagement_score': state.engagement_score,
                    'confidence_score': state.confidence_score,
                    'cognitive_load': state.cognitive_load,
                    'current_mood': state.current_mood,
                    'last_adaptation': state.last_adaptation,
                    'computed_at': state.computed_at.isoformat() if state.computed_at else None,
                }
        except Exception as e:
            # Never block requests due to cognitive state lookup failure
            logger.warning(f"CognitiveStateMiddleware error for user {user.id}: {e}")
