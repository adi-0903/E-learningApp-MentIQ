import { create } from 'zustand';
import { progressApi } from '@/services/api';

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  rarity_display: string;
  icon_url: string;
  criteria_type: string;
  criteria_threshold: number;
  tradeable: boolean;
  total_awarded: number;
}

export interface StudentBadge {
  id: string;
  student: string;
  student_name: string;
  badge: AchievementBadge;
  progress: number;
  is_claimed: boolean;
  awarded_at: string | null;
  showcase_on_profile: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  total_badges: number;
  rare_badges: number;
  score: number;
}

interface BadgeState {
  // State
  availableBadges: AchievementBadge[];
  myBadges: StudentBadge[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  
  // Actions
  fetchAvailableBadges: () => Promise<void>;
  fetchMyBadges: () => Promise<void>;
  fetchLeaderboard: (scope?: 'global' | 'course' | 'school') => Promise<void>;
  earnBadge: (criteriaType: string, contextData?: any) => Promise<void>;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  availableBadges: [],
  myBadges: [],
  leaderboard: [],
  isLoading: false,
  
  fetchAvailableBadges: async () => {
    set({ isLoading: true });
    try {
      const { data } = await progressApi.getAvailableBadges();
      const results = data.data || data.results || data;
      set({
        availableBadges: Array.isArray(results) ? results : [],
      });
    } catch (error) {
      console.error('Error fetching available badges:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchMyBadges: async () => {
    set({ isLoading: true });
    try {
      const { data } = await progressApi.getMyBadges();
      const results = data.data || data.results || data;
      set({
        myBadges: Array.isArray(results) ? results : [],
      });
    } catch (error) {
      console.error('Error fetching my badges:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchLeaderboard: async (scope = 'global') => {
    set({ isLoading: true });
    try {
      const { data } = await progressApi.getLeaderboard(scope);
      const results = data.data || data.results || data;
      set({
        leaderboard: Array.isArray(results) ? results : [],
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  earnBadge: async (criteriaType: string, contextData?: any) => {
    try {
      await progressApi.earnBadge(criteriaType, contextData);
      // Refresh badges after earning
      await get().fetchMyBadges();
    } catch (error) {
      console.error('Error earning badge:', error);
      throw error;
    }
  },
}));
