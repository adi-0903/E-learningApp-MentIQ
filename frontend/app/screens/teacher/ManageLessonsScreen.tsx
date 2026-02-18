import { Lesson, useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View, StatusBar } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

function ManageLessonsScreen({ route, navigation }: any) {
  const { courseId } = route?.params || {};

  if (!courseId) {
    return (
      <View style={styles.centerContainer}>
        <Text>Invalid course ID</Text>
      </View>
    );
  }

  const { lessons, isLoading, fetchLessons, deleteLesson } = useCourseStore();

  useEffect(() => {
    if (courseId) {
      fetchLessons(courseId).catch(error => {
        console.error('Error fetching lessons:', error);
      });
    }
  }, [courseId]);

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    Alert.alert(
      'Delete Lesson',
      `Delete "${lessonTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteLesson(lessonId);
              await fetchLessons(courseId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lesson');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderLessonItem = ({ item, index }: { item: Lesson, index: number }) => (
    <View style={styles.lessonCard}>
      <View style={styles.lessonRow}>
        <View style={styles.sequenceBadge}>
          <Text style={styles.sequenceText}>{index + 1}</Text>
        </View>

        <View style={styles.lessonContent}>
          <Text style={styles.lessonTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.lessonMeta}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#64748b" />
            <Text style={styles.lessonMetaText}>{item.duration || 0} min</Text>
            <View style={styles.metaDivider} />
            <MaterialCommunityIcons name={item.videoUrl ? "video" : "file-document"} size={12} color={item.videoUrl ? "#ec4899" : "#3b82f6"} />
            <Text style={styles.lessonMetaText}>{item.videoUrl ? 'Video' : 'Reading'}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateLesson', { courseId, lessonId: item.id })}
            style={[styles.actionButton, styles.editButton]}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteLesson(item.id, item.title)}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading && lessons.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#1e1b4b', '#312e81', '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerDecoration} />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>Manage Lessons</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Curate your course content</Text>
      </LinearGradient>

      <FlatList
        data={lessons}
        renderItem={renderLessonItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          lessons.length > 0 ? (
            <Text style={styles.listHeader}>Values ({lessons.length})</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No lessons yet</Text>
            <Text style={styles.emptySubtitle}>Start adding content to your course</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fabContainer}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CreateLesson', { courseId })}
      >
        <LinearGradient
          colors={['#4f46e5', '#4338ca']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    marginBottom: 8,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  headerTitleText: {
    color: '#e0e7ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sequenceBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sequenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonMetaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    elevation: 6,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ManageLessonsScreen;
