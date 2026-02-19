import { create } from 'zustand';
import { announcementApi } from '@/services/api';

export interface Attachment {
  links?: string[];
  pdfs?: { name: string; uri: string }[];
  images?: { name: string; uri: string }[];
}

export interface Announcement {
  id: string;
  courseId?: string | number | null;
  course?: number | string | null;
  teacherId?: string;
  teacher?: number | string;
  title: string;
  content: string;
  attachments?: Attachment;
  createdAt?: string;
  updatedAt?: string;
  isAuthor?: boolean;
}

function normalizeAnnouncement(raw: any): Announcement {
  let attachments = raw.attachments;

  // If backend provides a single 'attachment' field (file URL), normalize it into our structure
  if (!attachments && raw.attachment) {
    const uri = raw.attachment;
    const lowerUri = uri.toLowerCase();

    if (lowerUri.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      attachments = JSON.stringify({ images: [{ name: 'Attachment', uri }] });
    } else if (lowerUri.match(/\.pdf$/)) {
      attachments = JSON.stringify({ pdfs: [{ name: 'Document', uri }] });
    } else {
      // Default fallback for other file types or links
      attachments = JSON.stringify({ links: [uri] });
    }
  }

  return {
    id: String(raw.id),
    courseId: raw.course_id || raw.courseId || raw.course || null,
    teacherId: raw.teacher_id || raw.teacherId || raw.teacher,
    title: raw.title,
    content: raw.content || '',
    attachments: attachments,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    isAuthor: raw.is_author,
  };
}

interface AnnouncementState {
  announcements: Announcement[];
  isLoading: boolean;

  fetchCourseAnnouncements: (courseId: string | number) => Promise<void>;
  fetchSchoolAnnouncements: () => Promise<void>;
  fetchSubjectAnnouncements: () => Promise<void>;
  fetchAllAnnouncements: () => Promise<void>;
  createAnnouncement: (announcement: {
    title: string;
    content: string;
    course?: string | number | null;
    attachments?: Attachment;
  }) => Promise<void>;
  updateAnnouncement: (announcementId: string | number, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (announcementId: string | number) => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  announcements: [],
  isLoading: false,

  fetchCourseAnnouncements: async (courseId) => {
    set({ isLoading: true });
    try {
      const { data } = await announcementApi.list();
      const results = data.data || data.results || data;
      const all = (Array.isArray(results) ? results : []).map(normalizeAnnouncement);
      set({ announcements: all.filter(a => String(a.courseId) === String(courseId)) });
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSchoolAnnouncements: async () => {
    set({ isLoading: true });
    try {
      const { data } = await announcementApi.list();
      const results = data.data || data.results || data;
      const all = (Array.isArray(results) ? results : []).map(normalizeAnnouncement);
      set({ announcements: all.filter(a => !a.courseId) });
    } catch (error) {
      console.error('Error fetching school announcements:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSubjectAnnouncements: async () => {
    set({ isLoading: true });
    try {
      const { data } = await announcementApi.list();
      const results = data.data || data.results || data;
      const all = (Array.isArray(results) ? results : []).map(normalizeAnnouncement);
      set({ announcements: all.filter(a => a.courseId) });
    } catch (error) {
      console.error('Error fetching subject announcements:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllAnnouncements: async () => {
    set({ isLoading: true });
    try {
      const { data } = await announcementApi.list();
      const results = data.data || data.results || data;
      set({ announcements: (Array.isArray(results) ? results : []).map(normalizeAnnouncement) });
    } catch (error) {
      console.error('Error fetching all announcements:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createAnnouncement: async (announcement) => {
    try {
      const attachments = announcement.attachments || {};
      const links = attachments.links || [];
      const images = attachments.images || [];
      const pdfs = attachments.pdfs || [];

      // Backend only supports one file attachment and no separate links field.
      // 1. Append links to content
      let finalContent = announcement.content;
      if (links.length > 0) {
        finalContent += '\n\n' + links.join('\n');
      }

      // 2. Identify the primary file to upload (prioritize image, then PDF)
      // Only one file can be uploaded to 'attachment' field in backend.
      let fileToUpload = null;
      if (images.length > 0) {
        fileToUpload = images[0];
      } else if (pdfs.length > 0) {
        fileToUpload = pdfs[0];
      }

      if (fileToUpload) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('title', announcement.title);
        formData.append('content', finalContent);
        if (announcement.course) {
          formData.append('course', String(announcement.course));
        }

        // Determine mime type
        const uri = fileToUpload.uri;
        const fileType = uri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        const fileName = fileToUpload.name || uri.split('/').pop() || 'upload';

        formData.append('attachment', {
          uri: uri,
          name: fileName,
          type: fileType,
        } as any);

        await announcementApi.create(formData);
      } else {
        // Use JSON for text-only announcements
        await announcementApi.create({
          title: announcement.title,
          content: finalContent,
          course: announcement.course,
        });
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  updateAnnouncement: async (announcementId, updates) => {
    try {
      await announcementApi.update(announcementId, {
        title: updates.title,
        content: updates.content,
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  deleteAnnouncement: async (announcementId) => {
    try {
      await announcementApi.delete(announcementId);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },
}));
