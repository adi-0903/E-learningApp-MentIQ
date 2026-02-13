import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

function CourseDetailScreen({ route, navigation }: any) {
  const { courseId } = route.params;
  const { user } = useAuthStore();
  const { getCourseById, fetchLessons, lessons } = useCourseStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
      // Fetch lessons for both students and teachers
      await fetchLessons(courseId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centerContainer}>
        <Text>Course not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
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
          <Text style={styles.headerBadge}>📖 Course</Text>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {course.title}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {course.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>About this Course</Text>
            <Text style={styles.description}>{course.description}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Course Content</Text>

        {/* Lessons Section */}
        {lessons.length > 0 ? (
          <View style={styles.lessonsSection}>
            <Text style={styles.subsectionTitle}>Lessons ({lessons.length})</Text>
            <FlatList
              data={lessons}
              renderItem={({ item }) => (
                <View style={[styles.lessonCard, AppShadows.light]}>
                  <View style={styles.lessonContent}>
                    <View style={styles.lessonHeader}>
                      <View style={styles.lessonIconContainer}>
                        <MaterialCommunityIcons name="book-open-page-variant" size={24} color={Colors.light.primary} />
                      </View>
                      <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle} numberOfLines={2}>{item.title}</Text>
                        {item.duration && (
                          <View style={styles.durationBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.light.textSecondary} />
                            <Text style={styles.lessonDuration}>{item.duration} min</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {item.description && (
                      <Text style={styles.lessonDescription} numberOfLines={2}>{item.description}</Text>
                    )}
                    <Button
                      mode="contained"
                      onPress={() => navigation.navigate('LessonDetail', { lessonId: item.id, courseId })}
                      style={styles.lessonButton}
                      labelStyle={styles.lessonButtonLabel}
                      contentStyle={{ height: 40 }}
                      buttonColor={Colors.light.primary}
                    >
                      Start Lesson
                    </Button>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyLessons}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color={Colors.light.textLight} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyLessonsText}>No lessons available yet</Text>
          </View>
        )}

        {user?.role === 'teacher' && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Instructor Actions</Text>

            <TouchableOpacity
              style={[styles.actionCard, AppShadows.small]}
              onPress={() => navigation.navigate('ManageLessons', { courseId })}
            >
              <View style={[styles.iconContainer, { backgroundColor: Colors.light.primaryLight }]}>
                <MaterialCommunityIcons name="book-open-page-variant" size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Manage Lessons</Text>
                <Text style={styles.cardDescription}>Add, edit, or remove lessons</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.light.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, AppShadows.small]}
              onPress={() => navigation.navigate('ManageQuizzes', { courseId })}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="help-circle" size={24} color={Colors.light.warning} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Manage Quizzes</Text>
                <Text style={styles.cardDescription}>Create and manage quizzes</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.light.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, AppShadows.small]}
              onPress={() => navigation.navigate('ManageVideoLectures', { courseId })}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FCE7F3' }]}>
                <MaterialCommunityIcons name="video-outline" size={24} color="#DB2777" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Manage Video Lectures</Text>
                <Text style={styles.cardDescription}>Upload and manage videos</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
          </View>
        )}

        {user?.role === 'student' && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Course Resources</Text>
            <TouchableOpacity
              style={[styles.actionCard, AppShadows.small]}
              onPress={() => navigation.navigate('StudentVideoLectures', { courseId, courseTitle: course.title })}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FCE7F3' }]}>
                <MaterialCommunityIcons name="play-circle-outline" size={24} color="#DB2777" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Video Lectures</Text>
                <Text style={styles.cardDescription}>Watch recorded sessions</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.light.textLight} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: Spacing.l,
  },
  descriptionContainer: {
    marginBottom: Spacing.l,
  },
  description: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.s,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.light.text,
    marginBottom: Spacing.m,
  },
  actionSection: {
    marginTop: Spacing.l,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  cardDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  lessonsSection: {
    marginBottom: Spacing.l,
  },
  subsectionTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.m,
  },
  lessonCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    marginBottom: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.m,
  },
  lessonContent: {},
  lessonHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.s,
  },
  lessonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.m,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  lessonInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  lessonTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonDuration: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  lessonDescription: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.m,
    marginLeft: 40 + Spacing.m, // Indent
  },
  lessonButton: {
    borderRadius: BorderRadius.m,
    marginLeft: 40 + Spacing.m, // Indent button too? Maybe full width is better
  },
  lessonButtonLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.white,
  },
  emptyLessons: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.l,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  emptyLessonsText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.s,
  },
});

export default CourseDetailScreen;
