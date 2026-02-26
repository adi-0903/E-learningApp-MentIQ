import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Card, Text, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { useProgressStore } from '@/store/progressStore';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

function LessonDetailScreen({ route, navigation }: any) {
  const { lessonId, courseId } = route.params;
  const { user } = useAuthStore();
  const { getLessonById } = useCourseStore();
  const { getLessonProgress, markLessonComplete, updateLessonTimeSpent } = useProgressStore();
  const [lesson, setLesson] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    loadLesson();
    return () => {
      if (user?.role === 'student' && user.id) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        updateLessonTimeSpent(String(user.id), lessonId, timeSpent);
      }
    };
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const lessonData = await getLessonById(lessonId);
      setLesson(lessonData);

      if (user?.role === 'student' && user.id) {
        const progress = await getLessonProgress(String(user.id), lessonId);
        setIsCompleted(progress?.isCompleted || false);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      Alert.alert('Error', 'Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user?.id) return;
    try {
      await markLessonComplete(String(user.id), lessonId);
      setIsCompleted(true);
      Alert.alert('Success', 'Lesson marked as complete!');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark lesson as complete');
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleOpenVideo = async () => {
    if (lesson?.videoUrl) {
      if (!isValidUrl(lesson.videoUrl)) {
        Alert.alert('Error', 'Invalid video URL');
        return;
      }
      try {
        await Linking.openURL(lesson.videoUrl);
      } catch (error) {
        Alert.alert('Error', 'Could not open video');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.centerContainer}>
        <Text>Lesson not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <LinearGradient
          colors={[Colors.light.primaryDark, Colors.light.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumHeader}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View style={styles.backButtonCircle}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.light.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerBadge}>📚 Lesson</Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {lesson.title}
            </Text>
            {lesson.duration && (
              <View style={styles.durationContainer}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.durationText}>{lesson.duration} minutes</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Video Section */}
          {lesson.videoUrl && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleOpenVideo}
              style={[styles.videoCard, AppShadows.medium]}
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.videoGradient}
              >
                <View style={styles.videoIconContainer}>
                  <MaterialCommunityIcons name="play-circle" size={56} color={Colors.light.white} />
                </View>
                <Text style={styles.videoText}>Watch Lesson Video</Text>
                <Text style={styles.videoSubtext}>Tap to start playing</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Description Section */}
          {lesson.description && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="text-box-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <View style={[styles.card, AppShadows.light]}>
                <Text style={styles.description}>{lesson.description}</Text>
              </View>
            </View>
          )}

          {/* Content Section */}
          {lesson.content && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="book-open-page-variant" size={20} color={Colors.light.primary} />
                <Text style={styles.sectionTitle}>Lesson Content</Text>
              </View>
              <View style={[styles.card, AppShadows.light]}>
                <Text style={styles.contentText}>{lesson.content}</Text>
              </View>
            </View>
          )}

          {/* File Section */}
          {lesson.fileUrl && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color={Colors.light.warning} />
                <Text style={styles.sectionTitle}>Resources</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (isValidUrl(lesson.fileUrl)) {
                    Linking.openURL(lesson.fileUrl).catch(() => {
                      Alert.alert('Error', 'Could not open file');
                    });
                  } else {
                    Alert.alert('Error', 'Invalid file URL');
                  }
                }}
                style={[styles.fileCard, AppShadows.small]}
              >
                <View style={[styles.fileIconContainer, { backgroundColor: '#FFF7ED' }]}>
                  <MaterialCommunityIcons name="file-document" size={32} color={Colors.light.warning} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{lesson.fileType || 'Attached File'}</Text>
                  <Text style={styles.fileSize}>Tap to download material</Text>
                </View>
                <View style={styles.downloadButton}>
                  <MaterialCommunityIcons name="download" size={20} color={Colors.light.white} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Student Actions */}
          {user?.role === 'student' && (
            <View style={styles.studentActions}>
              <Button
                mode="contained"
                onPress={handleMarkComplete}
                style={[
                  styles.completeButton,
                  isCompleted ? { backgroundColor: Colors.light.success } : { backgroundColor: Colors.light.primary }
                ]}
                labelStyle={styles.completeButtonLabel}
                icon={isCompleted ? "check" : undefined}
              >
                {isCompleted ? 'Completed' : 'Mark as Complete'}
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
    paddingBottom: 30,
    paddingHorizontal: Spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...AppShadows.medium,
  },
  backButton: {
    padding: 4,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerBadge: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.light.white,
    lineHeight: 32,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.s,
    gap: 4,
  },
  durationText: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  content: {
    padding: Spacing.l,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.light.text,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  videoCard: {
    marginBottom: Spacing.l,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  videoGradient: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.l,
  },
  videoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  videoText: {
    ...Typography.h3,
    color: Colors.light.white,
    marginBottom: 4,
  },
  videoSubtext: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  description: {
    ...Typography.body,
    color: Colors.light.text,
    lineHeight: 24,
  },
  contentText: {
    ...Typography.body,
    color: Colors.light.text,
    lineHeight: 24,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  fileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  fileSize: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.circle,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentActions: {
    marginTop: Spacing.m,
    marginBottom: Spacing.l,
  },
  completeButton: {
    borderRadius: BorderRadius.l,
    paddingVertical: 4,
  },
  completeButtonLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.white,
  },
});

export default LessonDetailScreen;
