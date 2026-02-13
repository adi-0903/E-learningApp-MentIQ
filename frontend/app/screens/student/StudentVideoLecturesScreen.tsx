import { Lesson, useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { ActivityIndicator, Card, Text } from 'react-native-paper';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Video Player Component
function VideoPlayerView({ source, style }: { source: { uri: string }; style: any }) {
  const player = useVideoPlayer(source, player => {
    player.play();
  });

  return (
    <VideoView
      style={style}
      player={player}
      allowsPictureInPicture
      nativeControls={true}
    />
  );
}

// Using existing Lesson interface from courseStore

export default function StudentVideoLecturesScreen({ route, navigation }: any) {
  const { courseId, courseTitle } = route?.params || {};

  // Validate route parameters
  if (!courseId) {
    return (
      <View style={styles.centerContainer}>
        <Text>Invalid course ID</Text>
      </View>
    );
  }

  const { lessons, isLoading, fetchLessons } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadLessons();
    }
  }, [courseId]);

  const loadLessons = async () => {
    if (!courseId) {
      Alert.alert('Error', 'Invalid course ID');
      return;
    }

    try {
      await fetchLessons(courseId.toString());
    } catch (error) {
      console.error('Error loading lessons:', error);
      Alert.alert('Error', 'Failed to load video lectures');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };

  const handlePlayVideo = (lesson: Lesson) => {
    if (!lesson.videoUrl) {
      Alert.alert('Error', 'No video available for this lesson');
      return;
    }
    setSelectedLesson(lesson);
    setVideoModalVisible(true);
  };

  const handleCloseVideo = () => {
    setVideoModalVisible(false);
    setSelectedLesson(null);
  };

  // Download functionality removed for simplicity

  const renderLessonCard = (lesson: Lesson) => (
    <Card style={[styles.videoCard, AppShadows.small]} key={lesson.id}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.videoHeader}>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {lesson.title}
            </Text>

            {lesson.description && (
              <Text style={styles.videoDescription} numberOfLines={2}>
                {lesson.description}
              </Text>
            )}

            <View style={styles.videoMeta}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.metaText}>{lesson.duration ? `${lesson.duration} min` : 'No duration'}</Text>
              </View>
              {lesson.videoUrl && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="video" size={16} color={Colors.light.primary} />
                  <Text style={[styles.metaText, { color: Colors.light.primary }]}>Video Available</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handlePlayVideo(lesson)}
              style={styles.playButton}
              disabled={!lesson.videoUrl}
            >
              <MaterialCommunityIcons
                name={lesson.videoUrl ? "play-circle" : "play-circle-outline"}
                size={40}
                color={lesson.videoUrl ? Colors.light.primary : Colors.light.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Video Lectures</Text>
          <Text style={styles.headerSubtitle}>{courseTitle}</Text>
        </View>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={[styles.statsContainer, AppShadows.medium]}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="video" size={20} color={Colors.light.primary} />
          <Text style={styles.statText}>{lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.statText}>
            {lessons.reduce((total: number, lesson: Lesson) => total + (lesson.duration || 0), 0)} min total
          </Text>
        </View>
      </View>

      {lessons.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="video-off" size={64} color={Colors.light.textLight} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No video lectures available</Text>
          <Text style={styles.emptySubtext}>Check back later for new videos</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          renderItem={({ item }) => renderLessonCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.videosList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
        />
      )}

      {/* Video Player Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseVideo}
      >
        <StatusBar style="light" />
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[Colors.light.primaryDark, Colors.light.primary]}
            style={styles.modalHeader}
          >
            <TouchableOpacity onPress={handleCloseVideo} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.light.white} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedLesson?.title || 'Video Player'}
            </Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          {selectedLesson && (
            <View style={styles.videoContainer}>
              {selectedLesson.videoUrl ? (
                <VideoPlayerView
                  source={{ uri: selectedLesson.videoUrl }}
                  style={styles.videoPlayer}
                />
              ) : (
                <View style={styles.noVideoContainer}>
                  <MaterialCommunityIcons name="video-off" size={64} color={Colors.light.textLight} />
                  <Text style={styles.noVideoText}>No video available for this lesson</Text>
                </View>
              )}

              <View style={styles.videoInfoContainer}>
                <Text style={styles.videoInfoTitle}>{selectedLesson.title}</Text>
                {selectedLesson.description && (
                  <Text style={styles.videoInfoDescription}>{selectedLesson.description}</Text>
                )}
                <Text style={styles.videoInfoMeta}>
                  Duration: {selectedLesson.duration ? `${selectedLesson.duration} min` : 'Not specified'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// Removed unused Dimensions and thumbnailWidth variables

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  premiumHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: Spacing.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...AppShadows.medium,
  },
  backButton: {
    padding: 8,
    borderRadius: BorderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.m,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.light.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.light.white,
    marginHorizontal: Spacing.m,
    marginTop: Spacing.l,
    borderRadius: BorderRadius.l,
    paddingVertical: Spacing.m,
    zIndex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.light.text,
  },
  videosList: {
    padding: Spacing.m,
    paddingTop: Spacing.l,
    paddingBottom: 100,
  },
  videoCard: {
    marginBottom: Spacing.m,
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardContent: {
    padding: Spacing.m,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  videoInfo: {
    flex: 1,
    marginRight: Spacing.m,
  },
  videoTitle: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 6,
    lineHeight: 26,
  },
  videoDescription: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.s,
    lineHeight: 20,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    marginTop: Spacing.s,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  playButton: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  // Removed unused downloadButton style
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: Spacing.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: BorderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    flex: 1,
    ...Typography.h3,
    fontSize: 18,
    color: Colors.light.white,
    marginLeft: Spacing.m,
    textAlign: 'center',
  },
  videoContainer: {
    flex: 1,
  },
  videoPlayer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
  },
  videoInfoContainer: {
    padding: Spacing.l,
    backgroundColor: Colors.light.white,
    flex: 1,
  },
  videoInfoTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.light.text,
    marginBottom: Spacing.s,
  },
  videoInfoDescription: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.m,
    lineHeight: 22,
  },
  videoInfoMeta: {
    ...Typography.caption,
    color: Colors.light.textLight,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.light.text,
    marginTop: Spacing.m,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  noVideoText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});

