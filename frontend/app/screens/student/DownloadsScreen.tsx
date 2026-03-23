import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useOfflineStore, OfflineDownload } from '@/store/offlineStore';
import { removeOfflineDownload } from '@/services/offline.service';

const DownloadsScreen: React.FC = ({ navigation }: any) => {
  const { myDownloads, isLoading, fetchMyDownloads, storageSummary, fetchStorageSummary, syncAllLocalProgress } = useOfflineStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchMyDownloads();
    fetchStorageSummary();
    syncAllLocalProgress();
  }, []);

  const handleDelete = (downloadId: string, title: string) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${title}" from your device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(downloadId);
            try {
              await removeOfflineDownload(downloadId);
              // Store automatically updates
            } catch (err) {
              Alert.alert('Error', 'Failed to delete download.');
            } finally {
              setIsDeleting(null);
            }
          },
        },
      ]
    );
  };

  const renderDownloadItem = ({ item }: { item: OfflineDownload }) => (
    <View style={styles.downloadItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="play-circle-outline" size={32} color={Colors.light.primary} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{item.lesson_title}</Text>
        <Text style={styles.subtitle}>{item.course_title}</Text>
        <Text style={styles.meta}>
          {(item.file_size_bytes / (1024 * 1024)).toFixed(1)} MB • {Math.floor(item.duration_seconds / 60)}m {item.duration_seconds % 60}s
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('LessonDetail', { 
            lessonId: item.micro_lesson, // Assuming backend lesson ID mapping
            offlineMode: true 
          })}
          style={styles.actionButton}
        >
          <MaterialCommunityIcons name="arrow-right-circle" size={28} color={Colors.light.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => handleDelete(item.id, item.lesson_title)}
          disabled={isDeleting === item.id}
          style={styles.actionButton}
        >
          {isDeleting === item.id ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <MaterialCommunityIcons name="delete-outline" size={24} color="#FF3B30" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Downloads</Text>
        {storageSummary && (
          <View style={styles.storageBadge}>
            <Text style={styles.storageText}>
              {storageSummary.total_mb.toFixed(1)} MB used
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : myDownloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="download-off-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No offline content yet.</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('StudentHome')}
          >
            <Text style={styles.browseButtonText}>Browse Lessons</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={myDownloads}
          keyExtractor={(item) => item.id}
          renderItem={renderDownloadItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchMyDownloads}
          refreshing={isLoading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  storageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  storageText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  downloadItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DownloadsScreen;
