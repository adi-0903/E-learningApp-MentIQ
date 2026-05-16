import { create } from 'zustand';
import { parentApi } from '@/services/api';

interface ParentProfile {
  id: string;
  user_email: string;
  user_name: string;
  receive_weekly_reports: boolean;
  receive_immediate_alerts: boolean;
}

interface Child {
  id: string;
  name: string;
  student_id: string;
  profile_image: string | null;
  latest_stats: any | null;
}

interface LinkRequest {
  id: number;
  student_id: string;
  status: string;
  created_at: string;
}

interface PendingParentRequest {
  id: number;
  parent_name: string;
  parent_email: string;
  created_at: string;
}

interface ParentState {
  profile: ParentProfile | null;
  children: Child[];
  linkRequests: LinkRequest[];
  pendingParentRequests: PendingParentRequest[]; // Student side
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ParentProfile>) => Promise<void>;
  fetchChildren: () => Promise<void>;
  fetchLinkRequests: () => Promise<void>;
  requestLink: (studentId: string) => Promise<boolean>;
  
  // Student Actions
  fetchPendingParentRequests: () => Promise<void>;
  respondToParentRequest: (requestId: number, action: 'approve' | 'reject') => Promise<boolean>;
  
  // Reports
  fetchChildReports: (studentId: string) => Promise<any[]>;
}

export const useParentStore = create<ParentState>((set, get) => ({
  profile: null,
  children: [],
  linkRequests: [],
  pendingParentRequests: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await parentApi.getProfile();
      set({ profile: data.data || data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await parentApi.updateProfile(data);
      set({ profile: data.data || data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchChildren: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await parentApi.getChildren();
      const results = data.data || data.results || data;
      set({ children: Array.isArray(results) ? results : [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchLinkRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await parentApi.getLinkRequests();
      const results = data.data || data.results || data;
      set({ linkRequests: Array.isArray(results) ? results : [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  requestLink: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      await parentApi.requestLink(studentId);
      await get().fetchLinkRequests();
      await get().fetchChildren();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  fetchPendingParentRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await parentApi.getPendingParentRequests();
      const results = data.data || data.results || data;
      set({ pendingParentRequests: Array.isArray(results) ? results : [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  respondToParentRequest: async (requestId, action) => {
    set({ isLoading: true, error: null });
    try {
      await parentApi.respondToParentRequest(requestId, action);
      await get().fetchPendingParentRequests();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  fetchChildReports: async (studentId) => {
    try {
      const { data } = await parentApi.getChildReports(studentId);
      const results = data.data || data.results || data;
      return Array.isArray(results) ? results : [];
    } catch (err) {
      console.error('Failed to fetch child reports:', err);
      return [];
    }
  },
}));
