"""
EmotionDetector — Rule-based cognitive/emotional state detection from interaction patterns.

Analyzes aggregated interaction metrics (typing speed, backspace rate, pause frequency,
scroll velocity, etc.) to compute frustration, engagement, and confidence scores.

No ML dependencies required — uses configurable thresholds and weighted heuristics.
Designed to be upgraded to scikit-learn models in a future iteration.
"""
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)


class EmotionDetector:
    """
    Detects emotional/cognitive state from interaction patterns.
    
    Input: List of recent InteractionEvent metrics dicts
    Output: Dict with frustration_score, engagement_score, confidence_score,
            cognitive_load, current_mood, adaptation strategy
    """

    # ─── Configurable Thresholds ──────────────────────────────────
    # Frustration signals
    HIGH_BACKSPACE_RATE = 0.30       # >30% of keystrokes are backspaces
    REPEATED_ATTEMPTS_THRESHOLD = 3  # Same question attempted 3+ times
    TYPING_SPEED_VARIANCE = 0.40     # High std dev in typing speed
    LONG_PAUSE_SECONDS = 10          # Pauses longer than 10s
    RAPID_CLICK_THRESHOLD = 5        # 5+ clicks in 2 seconds (rage clicking)

    # Engagement signals
    MIN_SESSION_MINUTES = 2          # Below this = low engagement
    GOOD_SESSION_MINUTES = 15        # Above this = strong engagement
    LOW_IDLE_THRESHOLD = 5           # Less than 5s idle = active
    HIGH_IDLE_THRESHOLD = 30         # More than 30s idle = disengaged

    # Confidence signals
    QUICK_ANSWER_SECONDS = 10        # Answering within 10s = confident
    LOW_BACKSPACE_RATE = 0.10        # <10% backspace = confident typing

    def analyze(self, interaction_events):
        """
        Analyze a batch of recent interaction events and compute cognitive state.
        
        Args:
            interaction_events: List of dicts with 'event_type', 'metrics', 'context' keys
            
        Returns:
            dict with keys: frustration_score, engagement_score, confidence_score,
                           cognitive_load, current_mood, signals
        """
        if not interaction_events:
            return self._default_state()

        # Aggregate all metrics
        aggregated = self._aggregate_metrics(interaction_events)

        # Compute individual scores
        frustration = self._compute_frustration(aggregated)
        engagement = self._compute_engagement(aggregated)
        confidence = self._compute_confidence(aggregated)

        # Derive cognitive load and mood
        cognitive_load = self._derive_cognitive_load(frustration, engagement)
        current_mood = self._derive_mood(frustration, engagement, confidence)

        # Build signal breakdown for debugging
        signals = {
            'event_count': len(interaction_events),
            'aggregated_metrics': aggregated,
            'frustration_components': self._frustration_breakdown(aggregated),
            'engagement_components': self._engagement_breakdown(aggregated),
            'confidence_components': self._confidence_breakdown(aggregated),
        }

        return {
            'frustration_score': round(frustration, 3),
            'engagement_score': round(engagement, 3),
            'confidence_score': round(confidence, 3),
            'cognitive_load': cognitive_load,
            'current_mood': current_mood,
            'signals': signals,
        }

    def get_adaptation_strategy(self, state):
        """
        Given a cognitive state dict, return an adaptation strategy for the AI tutor.
        
        Returns:
            dict with keys: tone, difficulty_adjustment, suggest_break,
                           encouragement_level, content_style
        """
        frustration = state.get('frustration_score', 0)
        engagement = state.get('engagement_score', 0.5)
        confidence = state.get('confidence_score', 0.5)
        mood = state.get('current_mood', 'neutral')

        strategy = {
            'tone': 'balanced',
            'difficulty_adjustment': 0,       # -30 to +30 (percentage)
            'suggest_break': False,
            'encouragement_level': 'normal',   # minimal, normal, high, maximum
            'content_style': 'standard',       # standard, simplified, challenge, gamified
            'nudge_message': None,             # Gentle UI nudge, or None
        }

        # ─── High Frustration (>0.7) ─────────────────────────────
        if frustration > 0.7:
            strategy['tone'] = 'encouraging'
            strategy['difficulty_adjustment'] = -30
            strategy['suggest_break'] = True
            strategy['encouragement_level'] = 'maximum'
            strategy['content_style'] = 'simplified'
            strategy['nudge_message'] = "💡 Take a breather — you're doing great! Want me to explain this differently?"

        # ─── Moderate Frustration (0.4–0.7) ──────────────────────
        elif frustration > 0.4:
            strategy['tone'] = 'patient'
            strategy['difficulty_adjustment'] = -15
            strategy['encouragement_level'] = 'high'
            strategy['content_style'] = 'simplified'

        # ─── Low Engagement (<0.3) ───────────────────────────────
        if engagement < 0.3:
            strategy['content_style'] = 'gamified'
            strategy['tone'] = 'energetic'
            if not strategy['nudge_message']:
                strategy['nudge_message'] = "🎯 Quick challenge: Can you solve this one in under 30 seconds?"

        # ─── High Confidence (>0.8) + Good Engagement ────────────
        if confidence > 0.8 and engagement > 0.5:
            strategy['difficulty_adjustment'] = 20
            strategy['content_style'] = 'challenge'
            strategy['tone'] = 'direct'
            strategy['encouragement_level'] = 'minimal'

        # ─── Bored Mood ──────────────────────────────────────────
        if mood == 'bored':
            strategy['content_style'] = 'gamified'
            strategy['tone'] = 'energetic'
            strategy['difficulty_adjustment'] = max(strategy['difficulty_adjustment'], 10)

        # ─── Overloaded Cognitive Load ───────────────────────────
        if state.get('cognitive_load') == 'overloaded':
            strategy['suggest_break'] = True
            strategy['content_style'] = 'simplified'
            strategy['difficulty_adjustment'] = -30
            strategy['nudge_message'] = "🧘 Looks like you've been working hard. A 5-minute break can improve focus by 40%!"

        return strategy

    # ─── Private: Score Computation ───────────────────────────────

    def _aggregate_metrics(self, events):
        """Merge metrics from multiple events into aggregate values."""
        agg = {
            'typing_speed_wpm': [],
            'backspace_rate': [],
            'pause_count': 0,
            'long_pause_count': 0,
            'idle_seconds': [],
            'scroll_velocity': [],
            'tap_frequency': [],
            'rapid_clicks': 0,
            'repeat_attempts': 0,
            'answer_times': [],
            'answer_changes': 0,
            'session_duration_minutes': 0,
            'total_events': len(events),
        }

        for event in events:
            m = event.get('metrics', {}) if isinstance(event, dict) else getattr(event, 'metrics', {})
            if not m:
                continue

            if 'typing_speed_wpm' in m:
                agg['typing_speed_wpm'].append(m['typing_speed_wpm'])
            if 'backspace_rate' in m:
                agg['backspace_rate'].append(m['backspace_rate'])
            if 'pause_count' in m:
                agg['pause_count'] += m['pause_count']
            if 'long_pause_count' in m:
                agg['long_pause_count'] += m['long_pause_count']
            if 'idle_seconds' in m:
                agg['idle_seconds'].append(m['idle_seconds'])
            if 'scroll_velocity' in m:
                agg['scroll_velocity'].append(m['scroll_velocity'])
            if 'tap_frequency' in m:
                agg['tap_frequency'].append(m['tap_frequency'])
            if 'rapid_clicks' in m:
                agg['rapid_clicks'] += m['rapid_clicks']
            if 'repeat_attempts' in m:
                agg['repeat_attempts'] = max(agg['repeat_attempts'], m['repeat_attempts'])
            if 'answer_time_seconds' in m:
                agg['answer_times'].append(m['answer_time_seconds'])
            if 'answer_changes' in m:
                agg['answer_changes'] += m['answer_changes']
            if 'session_duration_minutes' in m:
                agg['session_duration_minutes'] = max(
                    agg['session_duration_minutes'], m['session_duration_minutes']
                )

        return agg

    def _compute_frustration(self, agg):
        """Compute frustration score (0.0–1.0) from aggregated metrics."""
        score = 0.0

        # High backspace rate → frustration
        if agg['backspace_rate']:
            avg_backspace = sum(agg['backspace_rate']) / len(agg['backspace_rate'])
            if avg_backspace > self.HIGH_BACKSPACE_RATE:
                score += min(0.3, avg_backspace)  # Cap at 0.3

        # Repeated attempts → strong frustration signal
        if agg['repeat_attempts'] >= self.REPEATED_ATTEMPTS_THRESHOLD:
            score += 0.35

        # Typing speed variance → erratic behavior
        if len(agg['typing_speed_wpm']) >= 3:
            import statistics
            try:
                mean_speed = statistics.mean(agg['typing_speed_wpm'])
                if mean_speed > 0:
                    cv = statistics.stdev(agg['typing_speed_wpm']) / mean_speed
                    if cv > self.TYPING_SPEED_VARIANCE:
                        score += 0.2
            except statistics.StatisticsError:
                pass

        # Long pauses → uncertainty/confusion
        if agg['long_pause_count'] >= 3:
            score += 0.1

        # Rapid/rage clicking
        if agg['rapid_clicks'] >= self.RAPID_CLICK_THRESHOLD:
            score += 0.15

        # Multiple answer changes in quizzes
        if agg['answer_changes'] >= 3:
            score += 0.1

        return min(1.0, score)

    def _compute_engagement(self, agg):
        """Compute engagement score (0.0–1.0) from aggregated metrics."""
        score = 0.5  # Neutral baseline

        # Session duration
        duration = agg['session_duration_minutes']
        if duration >= self.GOOD_SESSION_MINUTES:
            score += 0.25
        elif duration >= self.MIN_SESSION_MINUTES:
            score += 0.1
        elif duration > 0:
            score -= 0.2

        # Consistent typing speed → engaged
        if len(agg['typing_speed_wpm']) >= 3:
            import statistics
            try:
                mean_speed = statistics.mean(agg['typing_speed_wpm'])
                if mean_speed > 0:
                    cv = statistics.stdev(agg['typing_speed_wpm']) / mean_speed
                    if cv < 0.2:  # Very consistent
                        score += 0.15
            except statistics.StatisticsError:
                pass

        # Active scrolling → reading content
        if agg['scroll_velocity']:
            avg_scroll = sum(agg['scroll_velocity']) / len(agg['scroll_velocity'])
            if 0.5 < avg_scroll < 5.0:  # Moderate scroll = reading
                score += 0.1

        # Low idle time → actively working
        if agg['idle_seconds']:
            avg_idle = sum(agg['idle_seconds']) / len(agg['idle_seconds'])
            if avg_idle < self.LOW_IDLE_THRESHOLD:
                score += 0.15
            elif avg_idle > self.HIGH_IDLE_THRESHOLD:
                score -= 0.25

        # Event frequency → active interaction
        if agg['total_events'] >= 5:
            score += 0.1

        return max(0.0, min(1.0, score))

    def _compute_confidence(self, agg):
        """Compute confidence score (0.0–1.0) from aggregated metrics."""
        score = 0.5  # Neutral baseline

        # Quick answers in quizzes → confident
        if agg['answer_times']:
            avg_answer_time = sum(agg['answer_times']) / len(agg['answer_times'])
            if avg_answer_time < self.QUICK_ANSWER_SECONDS:
                score += 0.25
            elif avg_answer_time > 30:
                score -= 0.15

        # Low backspace rate → typing confidently
        if agg['backspace_rate']:
            avg_backspace = sum(agg['backspace_rate']) / len(agg['backspace_rate'])
            if avg_backspace < self.LOW_BACKSPACE_RATE:
                score += 0.2
            elif avg_backspace > self.HIGH_BACKSPACE_RATE:
                score -= 0.15

        # Few answer changes → decided
        if agg['answer_changes'] == 0 and agg['answer_times']:
            score += 0.15
        elif agg['answer_changes'] >= 3:
            score -= 0.2

        # No repeated attempts
        if agg['repeat_attempts'] == 0:
            score += 0.1
        elif agg['repeat_attempts'] >= self.REPEATED_ATTEMPTS_THRESHOLD:
            score -= 0.2

        return max(0.0, min(1.0, score))

    # ─── Private: Derived States ─────────────────────────────────

    def _derive_cognitive_load(self, frustration, engagement):
        """Derive cognitive load level from frustration and engagement."""
        # High frustration + low engagement = overloaded
        if frustration > 0.7 and engagement < 0.4:
            return 'overloaded'
        elif frustration > 0.5 or engagement > 0.7:
            return 'high'
        elif frustration > 0.2:
            return 'medium'
        return 'low'

    def _derive_mood(self, frustration, engagement, confidence):
        """Derive overall mood from the three core scores."""
        if frustration > 0.7:
            return 'frustrated'
        if frustration > 0.4 and confidence < 0.4:
            return 'struggling'
        if engagement < 0.3:
            return 'bored'
        if confidence > 0.7 and engagement > 0.6:
            return 'focused'
        if confidence > 0.6:
            return 'confident'
        return 'neutral'

    # ─── Private: Signal Breakdowns (for debugging) ──────────────

    def _frustration_breakdown(self, agg):
        components = {}
        if agg['backspace_rate']:
            components['avg_backspace_rate'] = round(
                sum(agg['backspace_rate']) / len(agg['backspace_rate']), 3
            )
        components['repeat_attempts'] = agg['repeat_attempts']
        components['long_pause_count'] = agg['long_pause_count']
        components['rapid_clicks'] = agg['rapid_clicks']
        components['answer_changes'] = agg['answer_changes']
        return components

    def _engagement_breakdown(self, agg):
        components = {
            'session_duration_minutes': agg['session_duration_minutes'],
            'total_events': agg['total_events'],
        }
        if agg['idle_seconds']:
            components['avg_idle_seconds'] = round(
                sum(agg['idle_seconds']) / len(agg['idle_seconds']), 1
            )
        return components

    def _confidence_breakdown(self, agg):
        components = {
            'repeat_attempts': agg['repeat_attempts'],
            'answer_changes': agg['answer_changes'],
        }
        if agg['answer_times']:
            components['avg_answer_time_seconds'] = round(
                sum(agg['answer_times']) / len(agg['answer_times']), 1
            )
        if agg['backspace_rate']:
            components['avg_backspace_rate'] = round(
                sum(agg['backspace_rate']) / len(agg['backspace_rate']), 3
            )
        return components

    def _default_state(self):
        """Return a neutral default state when no data is available."""
        return {
            'frustration_score': 0.0,
            'engagement_score': 0.5,
            'confidence_score': 0.5,
            'cognitive_load': 'medium',
            'current_mood': 'neutral',
            'signals': {'event_count': 0, 'note': 'No interaction data available'},
        }
