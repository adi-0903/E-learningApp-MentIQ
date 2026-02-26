import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, StatusBar } from 'react-native';
import { ActivityIndicator, Card, Text, Button, TextInput } from 'react-native-paper';
import { Colors, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { useQuizStore } from '@/store/quizStore';
import { courseApi } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

function CourseDetailScreen({ route, navigation }: any) {
  const { courseId, courseTitle } = route.params;
  const { user } = useAuthStore();
  const { getCourseById, fetchLessons, lessons } = useCourseStore();
  const { fetchCourseQuizzes, quizzes } = useQuizStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  // Dark/Indigo theme for Premium Look
  const PREMIUM_THEME = {
    bg: '#fafafa',
    cardBg: '#ffffff',
    primary: '#1e293b', // Slate 800
    accent: '#d97706',  // Amber 600
    secondary: '#475569',
    indigo: '#4f46e5',
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
      await Promise.all([
        fetchLessons(courseId),
        fetchCourseQuizzes(courseId)
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await courseApi.listReviews(courseId);
      if (response.data?.success) {
        setReviews(response.data.data.results || []);
        // Check if current user already reviewed
        const userReview = response.data.data.results?.find((r: any) => r.student === user?.id);
        if (userReview) {
          setHasReviewed(true);
        }
      }
    } catch (error) {
      console.log('Error loading reviews:', error);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadReviews();
    }
  }, [courseId]);

  const handleSubmitFeedback = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Please select a rating between 1 and 5.');
      return;
    }
    try {
      setIsSubmittingFeedback(true);
      const response = await courseApi.submitReview(courseId, { rating, comment });
      if (response.data?.success) {
        Alert.alert('Success', 'Thank you for your feedback!');
        setHasReviewed(true);
        loadReviews();
      } else {
        Alert.alert('Error', response.data?.error?.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const isTeacher = user?.role === 'teacher';
  const videoCount = lessons.filter(l => l.videoUrl || l.fileType === 'video').length;

  // Use passed title as fallback or immediate display
  const displayTitle = course?.title || courseTitle || 'Course Overview';
  const displayCategory = course?.category || 'Course';
  const displayLevel = course?.level || 'Intermediate';

  if (isLoading && !course) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PREMIUM_THEME.indigo} />
        <Text style={{ marginTop: 12, color: PREMIUM_THEME.secondary }}>Polishing details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Parallax-style Header */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155']}
          style={styles.heroSection}
        >
          {/* Decorative shapes for premium feel */}
          <View style={styles.decorationCircle} />
          <View style={styles.decorationSpot} />

          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>{displayCategory.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.headerBtn}>
              <MaterialCommunityIcons name="bookmark-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{displayTitle}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="account-group-outline" size={16} color="#94a3b8" />
                <Text style={styles.metaText}>{course?.teacher_name || 'Academic Expert'}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="layers-outline" size={16} color="#94a3b8" />
                <Text style={styles.metaText}>{displayLevel}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.bodyWrapper}>
          {/* Course Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() => { /* Potential future: Edit course basic info */ }}
            >
              <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                <MaterialCommunityIcons name="clock-time-four-outline" size={22} color="#2563eb" />
              </View>
              <Text style={styles.statVal}>{course?.duration || 'Flexible'}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(isTeacher ? 'ManageLessons' : 'CourseLessons', { courseId, courseTitle: course?.title })}
            >
              <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
                <MaterialCommunityIcons name="video-outline" size={22} color="#dc2626" />
              </View>
              <Text style={styles.statVal}>{lessons.length || 0}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(isTeacher ? 'ManageQuizzes' : 'AllQuizzes', { courseId })}
            >
              <View style={[styles.statIcon, { backgroundColor: '#fff7ed' }]}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={22} color="#d97706" />
              </View>
              <Text style={styles.statVal}>{quizzes.length}</Text>
              <Text style={styles.statLabel}>Quizzes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(isTeacher ? 'ManageVideoLectures' : 'StudentVideoLectures', { courseId, courseTitle: course?.title })}
            >
              <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                <MaterialCommunityIcons name="play-circle-outline" size={22} color="#16a34a" />
              </View>
              <Text style={styles.statVal}>{videoCount}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </TouchableOpacity>
          </View>

          {/* Description Card */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>About Program</Text>
              <Text style={styles.descriptionText}>
                {course?.description || "Enroll in this course to gain comprehensive knowledge and mastery through professional lessons and assessments."}
              </Text>
            </Card.Content>
          </Card>

          {/* Feedback & Ratings Section - Students only */}
          {!isTeacher && (
            <Card style={[styles.sectionCard, { marginTop: 8 }]}>
              <Card.Content>
                <Text style={styles.cardTitle}>{hasReviewed ? 'Your Feedback' : 'Rate this Experience'}</Text>

                {hasReviewed ? (
                  <View style={styles.reviewedContainer}>
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialCommunityIcons
                          key={s}
                          name={s <= reviews.find(r => r.student === user?.id)?.rating ? "star" : "star-outline"}
                          size={24}
                          color={PREMIUM_THEME.accent}
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewComment}>
                      {reviews.find(r => r.student === user?.id)?.comment || 'You rated this course.'}
                    </Text>
                    <View style={styles.reviewedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#059669" />
                      <Text style={styles.reviewedText}>Feedback Submitted</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.feedbackForm}>
                    <Text style={styles.feedbackLabel}>How would you rate the course & teacher?</Text>
                    <View style={styles.starRack}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                          <MaterialCommunityIcons
                            name={s <= rating ? "star" : "star-outline"}
                            size={36}
                            color={PREMIUM_THEME.accent}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      label="Share your thoughts (optional)"
                      value={comment}
                      onChangeText={setComment}
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      style={styles.feedbackInput}
                      outlineColor="#e2e8f0"
                      activeOutlineColor={PREMIUM_THEME.indigo}
                    />

                    <Button
                      mode="contained"
                      onPress={handleSubmitFeedback}
                      loading={isSubmittingFeedback}
                      disabled={isSubmittingFeedback}
                      style={styles.submitBtn}
                      labelStyle={styles.submitBtnLabel}
                    >
                      SUBMIT FEEDBACK
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorationSpot: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pillBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  pillText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroContent: {
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bodyWrapper: {
    paddingHorizontal: 24,
    marginTop: -30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...AppShadows.small,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 28,
    ...AppShadows.small,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  portalSection: {
    marginTop: 4,
  },
  portalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  portalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  portalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portalCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    ...AppShadows.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  portalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  portalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  resourceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    padding: 18,
    borderRadius: 24,
    marginTop: 32,
    gap: 16,
    ...AppShadows.medium,
  },
  stripText: {
    flex: 1,
  },
  stripTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  stripSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackForm: {
    marginTop: 8,
  },
  feedbackLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  starRack: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  feedbackInput: {
    backgroundColor: '#fff',
    fontSize: 14,
    marginBottom: 20,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
  },
  submitBtnLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  reviewedContainer: {
    paddingVertical: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  reviewComment: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  reviewedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
  },
});

export default CourseDetailScreen;
