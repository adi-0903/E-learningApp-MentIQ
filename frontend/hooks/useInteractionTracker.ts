/**
 * useInteractionTracker — Captures touch/typing interaction patterns
 * for the Cognitive AI Companion system.
 *
 * Batches interaction events every 30 seconds and sends them to the
 * backend for emotion/engagement detection. Only active for students.
 *
 * Privacy: Only aggregated metrics are captured — no raw keystrokes
 * or touch coordinates are stored.
 *
 * Usage:
 *   const tracker = useInteractionTracker({ screen: 'lesson_view', lessonId: '...' });
 *   // In a TextInput:
 *   <TextInput onChangeText={(text) => tracker.trackTyping(text)} />
 *   // For quiz answers:
 *   tracker.trackQuizAnswer({ questionId: '...', attempt: 1, timeSeconds: 12 });
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiApi } from '../services/ai.service';

// ─── Constants ───────────────────────────────────────────────────
const BATCH_INTERVAL_MS = 30_000; // 30 seconds
const MAX_EVENTS_PER_BATCH = 20;
const SESSION_KEY = 'cognitive_session_id';

// ─── Helpers ─────────────────────────────────────────────────────
function generateSessionId(): string {
  return `mob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Types ───────────────────────────────────────────────────────
interface InteractionContext {
  screen?: string;
  lessonId?: string;
  quizId?: string;
  courseId?: string;
}

interface InteractionEvent {
  event_type: string;
  metrics: Record<string, number>;
  context: Record<string, string>;
  timestamp?: string;
}

interface TrackerOptions {
  screen?: string;
  lessonId?: string;
  quizId?: string;
  courseId?: string;
  enabled?: boolean; // Defaults to true
}

interface QuizAnswerData {
  questionId: string;
  attempt: number;
  timeSeconds: number;
  changed?: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────
export function useInteractionTracker(options: TrackerOptions = {}) {
  const { screen = 'unknown', lessonId, quizId, courseId, enabled = true } = options;

  const eventsRef = useRef<InteractionEvent[]>([]);
  const sessionIdRef = useRef<string>('');
  const sessionStartRef = useRef<number>(Date.now());
  const batchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typing tracking state
  const lastTypeTimeRef = useRef<number>(0);
  const typeIntervalsRef = useRef<number[]>([]);
  const charCountRef = useRef<number>(0);
  const backspaceCountRef = useRef<number>(0);
  const pauseCountRef = useRef<number>(0);
  const prevTextLengthRef = useRef<number>(0);

  // Touch tracking state
  const tapCountRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const rapidTapCountRef = useRef<number>(0);

  // Context for all events
  const contextRef = useRef<Record<string, string>>({});

  // ─── Initialize Session ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const initSession = async () => {
      try {
        let sid = await AsyncStorage.getItem(SESSION_KEY);
        // Create new session if none exists or if it's older than 30 minutes
        if (!sid) {
          sid = generateSessionId();
          await AsyncStorage.setItem(SESSION_KEY, sid);
        }
        sessionIdRef.current = sid;
        sessionStartRef.current = Date.now();
      } catch {
        sessionIdRef.current = generateSessionId();
      }
    };

    contextRef.current = {
      ...(screen ? { screen } : {}),
      ...(lessonId ? { lesson_id: lessonId } : {}),
      ...(quizId ? { quiz_id: quizId } : {}),
      ...(courseId ? { course_id: courseId } : {}),
    };

    initSession();

    // Set up batch interval
    batchTimerRef.current = setInterval(() => {
      flushEvents();
    }, BATCH_INTERVAL_MS);

    return () => {
      // Flush remaining events on unmount
      flushEvents();
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    };
  }, [enabled, screen, lessonId, quizId, courseId]);

  // ─── Flush Events to Backend ─────────────────────────────────
  const flushEvents = useCallback(async () => {
    if (eventsRef.current.length === 0) return;
    if (!sessionIdRef.current) return;

    const batch = eventsRef.current.splice(0, MAX_EVENTS_PER_BATCH);

    try {
      await aiApi.trackInteractions({
        session_id: sessionIdRef.current,
        platform: 'mobile',
        events: batch,
      });
    } catch (error) {
      // Silently fail — don't disrupt UX for tracking
      console.debug('[InteractionTracker] Batch send failed:', error);
      // Put events back for retry (prepend)
      eventsRef.current = [...batch, ...eventsRef.current];
    }
  }, []);

  // ─── Add Event ───────────────────────────────────────────────
  const addEvent = useCallback((eventType: string, metrics: Record<string, number>) => {
    if (!enabled) return;

    const event: InteractionEvent = {
      event_type: eventType,
      metrics,
      context: contextRef.current,
      timestamp: new Date().toISOString(),
    };

    eventsRef.current.push(event);

    // Auto-flush if buffer is full
    if (eventsRef.current.length >= MAX_EVENTS_PER_BATCH) {
      flushEvents();
    }
  }, [enabled, flushEvents]);

  // ─── Track Typing ────────────────────────────────────────────
  const trackTyping = useCallback((newText: string) => {
    if (!enabled) return;

    const now = Date.now();
    const textLength = newText.length;
    const prevLength = prevTextLengthRef.current;

    // Detect backspace
    if (textLength < prevLength) {
      backspaceCountRef.current += (prevLength - textLength);
    } else {
      charCountRef.current += (textLength - prevLength);
    }

    // Track typing intervals
    if (lastTypeTimeRef.current > 0) {
      const interval = now - lastTypeTimeRef.current;

      // Detect pause (>3 seconds between keystrokes)
      if (interval > 3000) {
        pauseCountRef.current++;
      }

      typeIntervalsRef.current.push(interval);
    }

    lastTypeTimeRef.current = now;
    prevTextLengthRef.current = textLength;

    // Emit typing event every 10 characters
    if (charCountRef.current + backspaceCountRef.current >= 10) {
      const totalKeystrokes = charCountRef.current + backspaceCountRef.current;
      const backspaceRate = totalKeystrokes > 0
        ? backspaceCountRef.current / totalKeystrokes
        : 0;

      // Calculate WPM from intervals
      let typingSpeedWpm = 0;
      if (typeIntervalsRef.current.length > 0) {
        const avgInterval = typeIntervalsRef.current.reduce((a, b) => a + b, 0)
          / typeIntervalsRef.current.length;
        // Average word = 5 characters, convert ms interval to WPM
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

      // Reset counters
      charCountRef.current = 0;
      backspaceCountRef.current = 0;
      pauseCountRef.current = 0;
      typeIntervalsRef.current = [];
    }
  }, [enabled, addEvent]);

  // ─── Track Touch ─────────────────────────────────────────────
  const trackTouch = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    tapCountRef.current++;

    // Detect rapid taps (within 500ms)
    if (lastTapTimeRef.current > 0 && (now - lastTapTimeRef.current) < 500) {
      rapidTapCountRef.current++;
    }

    lastTapTimeRef.current = now;

    // Emit touch event every 10 taps
    if (tapCountRef.current >= 10) {
      const sessionMinutes = (Date.now() - sessionStartRef.current) / 60000;

      addEvent('touch_pattern', {
        tap_frequency: Math.round(tapCountRef.current / Math.max(sessionMinutes, 0.1) * 10) / 10,
        rapid_clicks: rapidTapCountRef.current,
        session_duration_minutes: Math.round(sessionMinutes * 10) / 10,
      });

      tapCountRef.current = 0;
      rapidTapCountRef.current = 0;
    }
  }, [enabled, addEvent]);

  // ─── Track Scroll ────────────────────────────────────────────
  const trackScroll = useCallback((velocity: number) => {
    if (!enabled) return;

    addEvent('scroll_pattern', {
      scroll_velocity: Math.round(Math.abs(velocity) * 100) / 100,
    });
  }, [enabled, addEvent]);

  // ─── Track Quiz Answer ───────────────────────────────────────
  const trackQuizAnswer = useCallback((data: QuizAnswerData) => {
    if (!enabled) return;

    addEvent('quiz_interaction', {
      answer_time_seconds: data.timeSeconds,
      repeat_attempts: data.attempt,
      answer_changes: data.changed ? 1 : 0,
    });
  }, [enabled, addEvent]);

  // ─── Track Focus/Idle ────────────────────────────────────────
  const trackIdle = useCallback((idleSeconds: number) => {
    if (!enabled) return;

    addEvent('focus_pattern', {
      idle_seconds: idleSeconds,
    });
  }, [enabled, addEvent]);

  // ─── Manual Flush ────────────────────────────────────────────
  const flush = useCallback(() => {
    flushEvents();
  }, [flushEvents]);

  return {
    trackTyping,
    trackTouch,
    trackScroll,
    trackQuizAnswer,
    trackIdle,
    flush,
    isActive: enabled,
  };
}

export default useInteractionTracker;
