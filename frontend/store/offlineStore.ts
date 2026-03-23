import { create } from 'zustand';
import { offlineApi } from '@/services/api';

export interface MicroLesson {
  id: string;
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  compressed_video_url: string;
  summary_text: string;
  file_size_bytes: number;
  file_size_mb: number;
  duration_seconds: number;
  compression_status: string;
  is_ready: boolean;
  is_downloaded: boolean;
}

export interface OfflineDownload {
  id: string;
  micro_lesson: string;
  lesson_title: string;
  course_title: string;
  compressed_video_url: string;
  file_size_bytes: number;
  duration_seconds: number;
  download_status: 'initiated' | 'downloading' | 'completed' | 'expired' | 'deleted';
  downloaded_at?: string;
  progress_percentage: number;
  last_position_seconds: number;
  is_lesson_completed: boolean;
  local_file_path?: string;
}

interface OfflineStore {
  availableMicroLessons: MicroLesson[];
  myDownloads: OfflineDownload[];
  storageSummary: {
    total_downloads: number;
    total_bytes: number;
    total_mb: number;
    completed_lessons: number;
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAvailable: (courseId?: string) => Promise<void>;
  fetchMyDownloads: () => Promise<void>;
  fetchStorageSummary: () => Promise<void>;
  initiateDownload: (microLessonId: string) => Promise<OfflineDownload | null>;
  confirmDownload: (downloadId: string, localFilePath: string) => Promise<void>;
  syncProgress: (downloadId: string, progress: number, position: number, completed: boolean) => Promise<void>;
  syncAllLocalProgress: () => Promise<void>;
  deleteDownload: (downloadId: string) => Promise<void>;
}

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  availableMicroLessons: [],
  myDownloads: [],
  storageSummary: null,
  isLoading: false,
  error: null,

  fetchAvailable: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await offlineApi.getAvailableMicroLessons(courseId);
      set({ availableMicroLessons: response.data.results, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyDownloads: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await offlineApi.getMyDownloads();
      set({ myDownloads: response.data.results, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchStorageSummary: async () => {
    try {
      const response = await offlineApi.getStorageSummary();
      set({ storageSummary: response.data.data });
    } catch (err: any) {
      console.error('Failed to fetch storage summary:', err);
    }
  },

  initiateDownload: async (microLessonId) => {
    try {
      const response = await offlineApi.initiateDownload(microLessonId);
      const newDownload = response.data.data;

      set((state) => ({
        myDownloads: [newDownload, ...state.myDownloads],
        availableMicroLessons: state.availableMicroLessons.map(ml =>
          ml.id === microLessonId ? { ...ml, is_downloaded: true } : ml
        )
      }));

      return newDownload;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  confirmDownload: async (downloadId, localFilePath) => {
    try {
      const response = await offlineApi.confirmDownload(downloadId);
      const updatedDownload = { ...response.data.data, local_file_path: localFilePath };

      set((state) => ({
        myDownloads: state.myDownloads.map(d =>
          d.id === downloadId ? updatedDownload : d
        )
      }));

      get().fetchStorageSummary();
    } catch (err: any) {
      console.error('Failed to confirm download on backend:', err);
    }
  },

  syncProgress: async (downloadId, progress, position, completed) => {
    try {
      await offlineApi.syncProgress({
        download_id: downloadId,
        progress_percentage: progress,
        last_position_seconds: position,
        is_lesson_completed: completed,
        completed_at_offline: completed ? new Date().toISOString() : undefined
      });

      set((state) => ({
        myDownloads: state.myDownloads.map(d =>
          d.id === downloadId
            ? { ...d, progress_percentage: progress, last_position_seconds: position, is_lesson_completed: completed }
            : d
        )
      }));
    } catch (err: any) {
      console.error('Failed to sync offline progress:', err);
    }
  },

  syncAllLocalProgress: async () => {
    const { myDownloads } = get();
    // Only sync items that have progress and haven't bean synced recently
    // (Simplified check: items where is_lesson_completed is true or progress > 0)
    const itemsToSync = myDownloads
      .filter(d => d.progress_percentage > 0 || d.is_lesson_completed)
      .map(d => ({
        download_id: d.id,
        progress_percentage: d.progress_percentage,
        last_position_seconds: d.last_position_seconds,
        is_lesson_completed: d.is_lesson_completed,
      }));

    if (itemsToSync.length === 0) return;

    try {
      await offlineApi.bulkSync(itemsToSync);
      console.log(`Synced ${itemsToSync.length} offline progress records.`);
    } catch (err) {
      console.error('Failed bulk sync:', err);
    }
  },

  deleteDownload: async (downloadId) => {
    try {
      await offlineApi.deleteDownload(downloadId);

      set((state) => ({
        myDownloads: state.myDownloads.filter(d => d.id !== downloadId)
      }));

      get().fetchStorageSummary();
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
