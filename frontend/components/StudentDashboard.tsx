import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { useProgressStore } from '@/store/progressStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, AppShadows, BorderRadius, Typography } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  Animated,
  Platform
} from 'react-native';
import { ActivityIndicator, Text, Button } from 'react-native-paper';

interface StudentDashboardProps {
  onCoursePress: (courseId: string) => void;
  onBrowseCoursesPress: () => void;
  onNotificationPress?: () => void;
}

const { width } = Dimensions.get('window');

// Premium Component: Course Progress Card
const CourseProgressCard = ({ course, progress, onPress }: { course: Course, progress: number, onPress: () => void }) => {
  const isCompleted = progress >= 100;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.cardContainer}>
      <LinearGradient
        colors={['#ffffff', '#f1f5f9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.categoryText}>{course.category || 'Skill'}</Text>
          </View>
          {isCompleted && (
            <MaterialCommunityIcons name="check-decagram" size={18} color="#059669" />
          )}
        </View>

        <View style={styles.cardInfoSection}>
          <Text style={styles.cardTitle} numberOfLines={2}>{course.title}</Text>
          <View style={styles.instructorRow}>
            <MaterialCommunityIcons name="account-circle-outline" size={12} color="#64748b" />
            <Text style={styles.cardInstructor} numberOfLines={1}>{course.teacherName || 'Instructor'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.continueButtonText}>
            {progress > 0 ? 'Resume' : 'Start'}
          </Text>
          <View style={styles.footerCircle}>
            <MaterialCommunityIcons name="play" size={14} color="#fff" />
          </View>
        </View>
        <View style={styles.accentLine} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onCoursePress,
  onBrowseCoursesPress,
}) => {
  const { user } = useAuthStore();
  const { courses, isLoading, fetchEnrolledCourses } = useCourseStore();
  const { enrollments } = useProgressStore();
  const { unreadCount, loadSettings } = useNotificationStore();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // Animation for header
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) {
      fetchEnrolledCourses(user.id);
      loadSettings(user.id);
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchEnrolledCourses(user.id);
    }
    setRefreshing(false);
  };
  // ... rest of the logic ...
  // (I will use multi_replace if I need to change far apart blocks, but let's see)


  const getProgressPercentage = (courseId: string) => {
    const enrollment = enrollments.find(e => e.courseId === courseId);
    return enrollment?.completionPercentage || 0;
  };

  const lastAccessedCourse = courses.length > 0 ? courses[0] : null; // Simple "last accessed" logic

  if (isLoading && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  // Header Animation Interpolation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [220, 120],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const statsOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const statsTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const statsScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  const contentTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 10],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerContainer, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#06201f', '#064e3b', '#065f46']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative Circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Animated.View style={[
                styles.avatarContainer,
                { opacity: avatarOpacity, transform: [{ scale: avatarScale }] }
              ]}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
              </Animated.View>
              <Animated.View style={{ transform: [{ translateY: contentTranslateY }] }}>
                <Text style={styles.greetingText}>Hello, {user?.name?.split(' ')[0] || 'Student'}! 👋</Text>
                <Text style={styles.greetingSub}>Ready to bloom today?</Text>
              </Animated.View>
            </View>
            <Animated.View style={{ opacity: avatarOpacity }}>
              <TouchableOpacity
                style={styles.notificationBtn}
                onPress={() => navigation.navigate('AnnouncementsTab')}
              >
                <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Quick Stats in Header - Animated to hide on scroll */}
          <Animated.View style={[
            styles.statsRow,
            {
              opacity: statsOpacity,
              transform: [
                { translateY: statsTranslateY },
                { scale: statsScale }
              ]
            }
          ]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{courses.length}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {courses.filter(c => getProgressPercentage(c.id) >= 100).length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {courses.length > 0 ? Math.round(courses.reduce((acc, curr) => acc + getProgressPercentage(curr.id), 0) / courses.length) : 0}%
              </Text>
              <Text style={styles.statLabel}>Avg. Score</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />
        }
      >
        <View style={styles.mainBody}>
          {/* Continue Learning Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity onPress={onBrowseCoursesPress}>
              <Text style={styles.seeAllText}>Browse All</Text>
            </TouchableOpacity>
          </View>

          {courses.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <MaterialCommunityIcons name="flower-tulip-outline" size={60} color="#059669" />
              <Text style={styles.emptyTitle}>Your Garden is Empty</Text>
              <Text style={styles.emptyText}>Start enrolling in courses to see them bloom here.</Text>
              <TouchableOpacity style={styles.browseButton} onPress={onBrowseCoursesPress}>
                <Text style={styles.browseButtonText}>Explore Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {courses.map((course, index) => (
                <View key={course.id} style={{ marginRight: 16 }}>
                  <CourseProgressCard
                    course={course}
                    progress={getProgressPercentage(course.id)}
                    onPress={() => onCoursePress(course.id)}
                  />
                </View>
              ))}
              <View style={{ width: 20 }} />
            </ScrollView>
          )}

          {/* New Suggested Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
          </View>

          <View style={styles.categoryGrid}>
            {['Technology', 'Business', 'Art', 'Science'].map((cat, idx) => (
              <TouchableOpacity key={idx} style={styles.categoryCard} onPress={onBrowseCoursesPress}>
                <LinearGradient
                  colors={idx % 2 === 0 ? ['#e0f2fe', '#bae6fd'] : ['#f0fdf4', '#dcfce7']}
                  style={styles.categoryIcon}
                >
                  <MaterialCommunityIcons
                    name={idx === 0 ? 'laptop' : idx === 1 ? 'briefcase' : idx === 2 ? 'palette' : 'flask'}
                    size={24}
                    color={idx % 2 === 0 ? '#0284c7' : '#16a34a'}
                  />
                </LinearGradient>
                <Text style={styles.categoryName}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>



          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 45,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  greetingSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fb7185',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#064e3b',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    paddingTop: 220, // Match max header height
    paddingBottom: 40,
  },
  mainBody: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  cardContainer: {
    width: 190,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginVertical: 4,
  },
  cardGradient: {
    padding: 14,
    height: 140,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 8,
    gap: 4,
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#059669',
  },
  categoryText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardInfoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 2,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardInstructor: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0f766e',
    opacity: 0.6,
  },
  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  motivationCard: {
    padding: 24,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  motivationContent: {
    zIndex: 1,
  },
  motivationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#be123c',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#881337',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  motivationAuthor: {
    fontSize: 12,
    color: '#9f1239',
    textAlign: 'right',
  },
  quoteIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    zIndex: 0,
  },
});