/**
 * Offline Manager Service
 * Handles downloading micro-lesson videos and managing local storage.
 * Uses expo-file-system for persistence.
 */
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOfflineStore } from '@/store/offlineStore';

const OFFLINE_STORAGE_KEY = 'mentiq_offline_metadata';
const DOWNLOAD_DIRECTORY = FileSystem.documentDirectory + 'downloads/';

// Types for local storage metadata
interface LocalMetadata {
  id: string; // backend download id
  lessonId: string;
  localPath: string;
  fileSize: number;
  downloadedAt: string;
}

/**
 * Ensures the download directory exists
 */
async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIRECTORY, { intermediates: true });
  }
}

/**
 * Downloads a micro-lesson for offline access
 */
export async function downloadMicroLesson(microLesson: any): Promise<boolean> {
  const store = useOfflineStore.getState();
  
  try {
    await ensureDirExists();
    
    // 1. Initiate download in backend
    const downloadRecord = await store.initiateDownload(microLesson.id);
    if (!downloadRecord) return false;

    const fileUrl = microLesson.compressed_video_url;
    const extension = fileUrl.split('.').pop()?.split('?')[0] || 'mp4';
    const localFileName = `lesson_${microLesson.lesson_id}.${extension}`;
    const localPath = DOWNLOAD_DIRECTORY + localFileName;

    // 2. Start physical download
    const downloadResumable = FileSystem.createDownloadResumable(
      fileUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        // Optional: Update progress in store for UI feedback
      }
    );

    const result = await downloadResumable.downloadAsync();
    
    if (result && result.uri) {
      // 3. Confirm with backend
      await store.confirmDownload(downloadRecord.id, result.uri);
      
      // 4. Update local metadata
      await updateLocalMetadata({
        id: downloadRecord.id,
        lessonId: microLesson.lesson_id,
        localPath: result.uri,
        fileSize: result.size || microLesson.file_size_bytes,
        downloadedAt: new Date().toISOString()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Offline Download Error:', error);
    return false;
  }
}

/**
 * Deletes an offline download
 */
export async function removeOfflineDownload(downloadId: string): Promise<void> {
  const store = useOfflineStore.getState();
  const metadata = await getLocalMetadata();
  const item = metadata.find(m => m.id === downloadId);

  if (item) {
    try {
      // 1. Delete file
      const fileInfo = await FileSystem.getInfoAsync(item.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(item.localPath);
      }
      
      // 2. Remove from backend tracking
      await store.deleteDownload(downloadId);
      
      // 3. Update metadata
      const updatedMetadata = metadata.filter(m => m.id !== downloadId);
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updatedMetadata));
    } catch (err) {
      console.error('Delete Offline File Error:', err);
    }
  }
}

/**
 * Checks if a lesson is available offline and returns the local uri if so
 */
export async function getOfflineUri(lessonId: string): Promise<string | null> {
  const metadata = await getLocalMetadata();
  const item = metadata.find(m => m.lessonId === lessonId);
  
  if (item) {
    const fileInfo = await FileSystem.getInfoAsync(item.localPath);
    if (fileInfo.exists) {
      return item.localPath;
    } else {
      // Cleanup orphan metadata
      await removeOfflineDownload(item.id);
    }
  }
  return null;
}

// ─── Private Helpers ─────────────────────────────────────────────

async function getLocalMetadata(): Promise<LocalMetadata[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function updateLocalMetadata(newItem: LocalMetadata) {
  const metadata = await getLocalMetadata();
  const index = metadata.findIndex(m => m.lessonId === newItem.lessonId);
  
  if (index >= 0) {
    metadata[index] = newItem;
  } else {
    metadata.push(newItem);
  }
  
  await AsyncStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(metadata));
}
