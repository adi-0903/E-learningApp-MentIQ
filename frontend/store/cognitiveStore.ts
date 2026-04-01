/**
 * Cognitive State Store — Zustand store for the Cognitive AI Companion.
 *
 * Caches the student's cognitive/emotional state and adaptation strategy.
 * Used by UI components to show gentle nudges (e.g., "Take a break")
 * and by the AI chat to display adaptation metadata.
 */
import { create } from 'zustand';
import { aiApi } from '../services/ai.service';

// ─── Types ───────────────────────────────────────────────────────
interface AdaptationStrategy {
  tone: string;
  difficulty_adjustment: number;
  suggest_break: boolean;
  encouragement_level: string;
  content_style: string;
  nudge_message: string | null;
}

interface CognitiveAdaptation {
  detected_mood: string;
  tone_used: string;
  difficulty_adjusted: boolean;
  suggestion: string | null;
}

interface CognitiveState {
  frustration_score: number;
  engagement_score: number;
  confidence_score: number;
  cognitive_load: string;
  current_mood: string;
  adaptation?: AdaptationStrategy;
  computed_at: string | null;
}

interface HistoryEntry {
  date: string;
  avg_frustration: number;
  avg_engagement: number;
  avg_confidence: number;
  dominant_mood: string;
  total_interaction_events: number;
  total_session_minutes: number;
}

interface CognitiveStore {
  // State
  state: CognitiveState | null;
  history: HistoryEntry[];
  lastAdaptation: CognitiveAdaptation | null;
  loading: boolean;
  error: string | null;
  nudgeDismissed: boolean;

  // Actions
  fetchState: () => Promise<void>;
  fetchHistory: (days?: number) => Promise<void>;
  setLastAdaptation: (adaptation: CognitiveAdaptation | null) => void;
  dismissNudge: () => void;
  resetNudge: () => void;
  clear: () => void;
}

// ─── Default State ───────────────────────────────────────────────
const DEFAULT_STATE: CognitiveState = {
  frustration_score: 0,
  engagement_score: 0.5,
  confidence_score: 0.5,
  cognitive_load: 'medium',
  current_mood: 'neutral',
  computed_at: null,
};

// ─── Store ───────────────────────────────────────────────────────
export const useCognitiveStore = create<CognitiveStore>((set, get) => ({
  state: null,
  history: [],
  lastAdaptation: null,
  loading: false,
  error: null,
  nudgeDismissed: false,

  fetchState: async () => {
    set({ loading: true, error: null });
    try {
      const response = await aiApi.getCognitiveState();
      const data = response.data;
      set({
        state: {
          frustration_score: data.frustration_score ?? 0,
          engagement_score: data.engagement_score ?? 0.5,
          confidence_score: data.confidence_score ?? 0.5,
          cognitive_load: data.cognitive_load ?? 'medium',
          current_mood: data.current_mood ?? 'neutral',
          adaptation: data.adaptation ?? undefined,
          computed_at: data.computed_at ?? null,
        },
        loading: false,
        // Reset nudge when state refreshes (new nudge might appear)
        nudgeDismissed: false,
      });
    } catch (error: any) {
      set({
        state: DEFAULT_STATE,
        loading: false,
        error: error.message || 'Failed to fetch cognitive state',
      });
    }
  },

  fetchHistory: async (days = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await aiApi.getCognitiveHistory(days);
      const data = response.data;
      set({
        history: data.history || [],
        loading: false,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to fetch cognitive history',
      });
    }
  },

  setLastAdaptation: (adaptation) => {
    set({ lastAdaptation: adaptation });
  },

  dismissNudge: () => {
    set({ nudgeDismissed: true });
  },

  resetNudge: () => {
    set({ nudgeDismissed: false });
  },

  clear: () => {
    set({
      state: null,
      history: [],
      lastAdaptation: null,
      loading: false,
      error: null,
      nudgeDismissed: false,
    });
  },
}));

// ─── Selectors ───────────────────────────────────────────────────
export const selectCurrentMood = (store: CognitiveStore) =>
  store.state?.current_mood ?? 'neutral';

export const selectShouldShowNudge = (store: CognitiveStore) => {
  if (store.nudgeDismissed) return false;
  const adaptation = store.state?.adaptation;
  return adaptation?.nudge_message != null;
};

export const selectNudgeMessage = (store: CognitiveStore) =>
  store.state?.adaptation?.nudge_message ?? null;

export const selectFrustrationLevel = (store: CognitiveStore): 'low' | 'medium' | 'high' => {
  const score = store.state?.frustration_score ?? 0;
  if (score > 0.7) return 'high';
  if (score > 0.4) return 'medium';
  return 'low';
};

export default useCognitiveStore;
