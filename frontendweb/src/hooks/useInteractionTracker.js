/**
 * useInteractionTracker — Captures keyboard/mouse interaction patterns
 * for the Cognitive AI Companion system (Web/Browser version).
 *
 * Batches interaction events every 30 seconds and sends them to the
 * backend for emotion/engagement detection. Only active for students.
 *
 * Privacy: Only aggregated metrics are captured — no raw keystrokes,
 * mouse coordinates, or personal data is stored.
 *
 * Usage:
 *   import { useInteractionTracker } from '../hooks/useInteractionTracker';
 *
 *   function LessonPage() {
 *     const tracker = useInteractionTracker({
 *       screen: 'lesson_view',
 *       lessonId: lesson.id
 *     });
 *
 *     return (
 *       <textarea
 *         onInput={(e) => tracker.trackTyping(e.target.value)}
 *         onKeyDown={(e) => tracker.handleKeyDown(e)}
 *       />
 *     );
 *   }
 */
import { useCallback, useEffect, useRef } from 'react';
import api from '../api';

// ─── Constants ───────────────────────────────────────────────────
const BATCH_INTERVAL_MS = 30_000; // 30 seconds
const MAX_EVENTS_PER_BATCH = 20;

// ─── Helpers ─────────────────────────────────────────────────────
function generateSessionId() {
  return `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getStoredSessionId() {
  try {
    let sid = sessionStorage.getItem('cognitive_session_id');
    if (!sid) {
      sid = generateSessionId();
      sessionStorage.setItem('cognitive_session_id', sid);
    }
    return sid;
  } catch {
    return generateSessionId();
  }
}

// ─── Hook ────────────────────────────────────────────────────────
export function useInteractionTracker(options = {}) {
  const {
    screen = 'unknown',
    lessonId = '',
    quizId = '',
    courseId = '',
    enabled = true,
  } = options;

  const eventsRef = useRef([]);
  const sessionIdRef = useRef('');
  const sessionStartRef = useRef(Date.now());
  const batchTimerRef = useRef(null);

  // Typing tracking refs
  const lastTypeTimeRef = useRef(0);
  const typeIntervalsRef = useRef([]);
  const charCountRef = useRef(0);
  const backspaceCountRef = useRef(0);
  const pauseCountRef = useRef(0);
  const prevTextLengthRef = useRef(0);

  // Mouse tracking refs
  const lastMouseMoveRef = useRef(0);
  const mouseDistanceRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const clickCountRef = useRef(0);
  const rapidClickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  // Scroll tracking refs
  const scrollEventsRef = useRef([]);

  // Idle tracking refs
  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef(null);

  // Build context
  const contextRef = useRef({});

  // ─── Flush events to backend ─────────────────────────────────
  const flushEvents = useCallback(async () => {
    if (eventsRef.current.length === 0) return;
    if (!sessionIdRef.current) return;

    const batch = eventsRef.current.splice(0, MAX_EVENTS_PER_BATCH);

    try {
      await api.post('ai/interactions/', {
        session_id: sessionIdRef.current,
        platform: 'web',
        events: batch,
      });
    } catch (error) {
      // Silently fail — don't disrupt UX
      console.debug('[InteractionTracker] Batch send failed:', error);
      // Put events back for retry
      eventsRef.current = [...batch, ...eventsRef.current];
    }
  }, []);

  // ─── Add Event ───────────────────────────────────────────────
  const addEvent = useCallback((eventType, metrics) => {
    if (!enabled) return;

    eventsRef.current.push({
      event_type: eventType,
      metrics,
      context: contextRef.current,
      timestamp: new Date().toISOString(),
    });

    if (eventsRef.current.length >= MAX_EVENTS_PER_BATCH) {
      flushEvents();
    }
  }, [enabled, flushEvents]);

  // ─── Record activity (reset idle timer) ──────────────────────
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // ─── Initialize ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    sessionIdRef.current = getStoredSessionId();
    sessionStartRef.current = Date.now();

    contextRef.current = {
      ...(screen ? { screen } : {}),
      ...(lessonId ? { lesson_id: lessonId } : {}),
      ...(quizId ? { quiz_id: quizId } : {}),
      ...(courseId ? { course_id: courseId } : {}),
    };

    // ─── Mouse movement tracking ─────────────────────────────
    const handleMouseMove = (e) => {
      const now = Date.now();
      recordActivity();

      if (lastMousePosRef.current.x !== 0) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        mouseDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      lastMouseMoveRef.current = now;
    };

    // ─── Click tracking ──────────────────────────────────────
    const handleClick = () => {
      const now = Date.now();
      recordActivity();
      clickCountRef.current++;

      if (lastClickTimeRef.current > 0 && (now - lastClickTimeRef.current) < 500) {
        rapidClickCountRef.current++;
      }
      lastClickTimeRef.current = now;
    };

    // ─── Scroll tracking ─────────────────────────────────────
    const handleScroll = () => {
      recordActivity();
      scrollEventsRef.current.push(Date.now());
    };

    // ─── Tab visibility (focus tracking) ─────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const idleSeconds = (Date.now() - lastActivityRef.current) / 1000;
        addEvent('focus_pattern', {
          idle_seconds: Math.round(idleSeconds * 10) / 10,
        });
      } else {
        recordActivity();
      }
    };

    // ─── Periodic mouse/click metrics emission ───────────────
    const mouseMetricsTimer = setInterval(() => {
      const sessionMinutes = (Date.now() - sessionStartRef.current) / 60000;

      // Emit mouse pattern if there's been movement
      if (mouseDistanceRef.current > 100) {
        addEvent('mouse_pattern', {
          scroll_velocity: scrollEventsRef.current.length > 0
            ? Math.round(scrollEventsRef.current.length / Math.max(sessionMinutes, 0.1) * 10) / 10
            : 0,
          rapid_clicks: rapidClickCountRef.current,
          idle_seconds: Math.round((Date.now() - lastActivityRef.current) / 1000),
          session_duration_minutes: Math.round(sessionMinutes * 10) / 10,
        });

        // Reset
        mouseDistanceRef.current = 0;
        clickCountRef.current = 0;
        rapidClickCountRef.current = 0;
        scrollEventsRef.current = [];
      }
    }, 15_000); // Every 15 seconds

    // ─── Idle detection ──────────────────────────────────────
    idleTimerRef.current = setInterval(() => {
      const idleSeconds = (Date.now() - lastActivityRef.current) / 1000;
      if (idleSeconds > 30) {
        addEvent('focus_pattern', {
          idle_seconds: Math.round(idleSeconds),
        });
      }
    }, 30_000);

    // Attach listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Batch flush timer
    batchTimerRef.current = setInterval(flushEvents, BATCH_INTERVAL_MS);

    return () => {
      // Flush remaining events
      flushEvents();

      // Cleanup listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      clearInterval(mouseMetricsTimer);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      if (batchTimerRef.current) clearInterval(batchTimerRef.current);
    };
  }, [enabled, screen, lessonId, quizId, courseId, addEvent, flushEvents, recordActivity]);

  // ─── Track Typing (call from onInput/onChange) ───────────────
  const trackTyping = useCallback((newText) => {
    if (!enabled) return;

    const now = Date.now();
    const textLength = (newText || '').length;
    const prevLength = prevTextLengthRef.current;

    recordActivity();

    // Detect backspace
    if (textLength < prevLength) {
      backspaceCountRef.current += (prevLength - textLength);
    } else {
      charCountRef.current += (textLength - prevLength);
    }

    // Track intervals
    if (lastTypeTimeRef.current > 0) {
      const interval = now - lastTypeTimeRef.current;
      if (interval > 3000) {
        pauseCountRef.current++;
      }
      typeIntervalsRef.current.push(interval);
    }

    lastTypeTimeRef.current = now;
    prevTextLengthRef.current = textLength;

    // Emit every 10 characters
    const totalKeystrokes = charCountRef.current + backspaceCountRef.current;
    if (totalKeystrokes >= 10) {
      const backspaceRate = totalKeystrokes > 0
        ? backspaceCountRef.current / totalKeystrokes
        : 0;

      let typingSpeedWpm = 0;
      if (typeIntervalsRef.current.length > 0) {
        const avgInterval = typeIntervalsRef.current.reduce((a, b) => a + b, 0)
          / typeIntervalsRef.current.length;
        typingSpeedWpm = avgInterval > 0 ? (60000 / avgInterval) / 5 : 0;
      }

      const sessionMinutes = (Date.now() - sessionStartRef.current) / 60000;

      addEvent('typing_pattern', {
        typing_speed_wpm: Math.round(typingSpeedWpm * 10) / 10,
        backspace_rate: Math.round(backspaceRate * 1000) / 1000,
        pause_count: pauseCountRef.current,
        long_pause_count: typeIntervalsRef.current.filter(i => i > 10000).length,
        session_duration_minutes: Math.round(sessionMinutes * 10) / 10,
      });

      // Reset
      charCountRef.current = 0;
      backspaceCountRef.current = 0;
      pauseCountRef.current = 0;
      typeIntervalsRef.current = [];
    }
  }, [enabled, addEvent, recordActivity]);

  // ─── Track Quiz Answer ───────────────────────────────────────
  const trackQuizAnswer = useCallback((data) => {
    if (!enabled) return;

    addEvent('quiz_interaction', {
      answer_time_seconds: data.timeSeconds || 0,
      repeat_attempts: data.attempt || 1,
      answer_changes: data.changed ? 1 : 0,
    });
  }, [enabled, addEvent]);

  // ─── Handle Key Down (for backspace detection in controlled inputs) ─
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;
    recordActivity();

    if (e.key === 'Backspace' || e.key === 'Delete') {
      backspaceCountRef.current++;
    }
  }, [enabled, recordActivity]);

  // ─── Manual Flush ────────────────────────────────────────────
  const flush = useCallback(() => {
    flushEvents();
  }, [flushEvents]);

  return {
    trackTyping,
    trackQuizAnswer,
    handleKeyDown,
    flush,
    isActive: enabled,
  };
}

export default useInteractionTracker;
