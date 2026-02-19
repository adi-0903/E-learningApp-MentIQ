import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { useProgressStore } from '@/store/progressStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  ImageBackground
} from 'react-native';
import { ActivityIndicator, Text, Surface, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { teacherApi } from '@/services/api';

interface TeacherDashboardProps {
  onCoursePress: (courseId: string, courseTitle?: string) => void;
  onCreateCoursePress: () => void;
  onCreateAnnouncementPress?: () => void;
  onManageLiveClassesPress?: () => void;
  onMyCoursesPress?: () => void;
}

const { width } = Dimensions.get('window');

const StatCard = ({ icon, value, label, color, subValue, onPress }: { icon: string, value: string | number, label: string, color: string, subValue?: string, onPress?: () => void }) => {
  const content = (
    <Surface style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {subValue && <Text style={[styles.statSub, { color: color }]}>{subValue}</Text>}
      </View>
    </Surface>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const ActionButton = ({ icon, label, onPress, gradient }: { icon: string, label: string, onPress: () => void, gradient: string[] }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.actionBtnContainer}>
    <LinearGradient
      colors={gradient as [string, string, ...string[]]}
      style={styles.actionBtnGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <MaterialCommunityIcons name={icon as any} size={28} color="#fff" />
      <Text style={styles.actionBtnLabel}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onCoursePress,
  onCreateCoursePress,
  onCreateAnnouncementPress,
  onManageLiveClassesPress,
  onMyCoursesPress,
}) => {
  const { user } = useAuthStore();
  const { courses, isLoading: coursesLoading, fetchTeacherCourses, deleteCourse } = useCourseStore();
  const { fetchTeacherStudentProgress } = useProgressStore();
  const [refreshing, setRefreshing] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  const isLoading = coursesLoading;

  // Helper date function
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchDashboardData = async () => {
    try {
      const response = await teacherApi.getDashboard();
      if (response.data?.success) {
        setDashboardStats(response.data.data);
        setRecentReviews(response.data.data.recent_reviews || []);
      }
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTeacherCourses(user.id);
      fetchDashboardData();
      fetchTeacherStudentProgress(user.id).then((students) => {
        if (Array.isArray(students)) {
          setTotalStudents(students.length);
        } else {
          setTotalStudents(0);
        }
      });
    }
  }, [user?.id, courses.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await Promise.all([
        fetchTeacherCourses(user.id),
        fetchDashboardData(),
        fetchTeacherStudentProgress(user.id).then(students => setTotalStudents(Array.isArray(students) ? students.length : 0))
      ]);
    }
    setRefreshing(false);
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    Alert.alert(
      'Delete Course',
      `Delete "${courseTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCourse(courseId);
            if (user?.id) fetchTeacherCourses(user.id);
          },
        },
      ]
    );
  };

  if (isLoading && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#0f172a', '#1e1b4b', '#312e81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nexusHeader}
        >
          <View style={styles.blurMesh}>
            <MaterialCommunityIcons
              name="view-dashboard-variant"
              size={300}
              color="rgba(99, 102, 241, 0.05)"
              style={styles.meshIcon}
            />
          </View>

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingLight}>{getTimeOfDay()},</Text>
              <Text style={styles.greetingUser}>{user?.name?.split(' ')[0] || 'Teacher'}</Text>
            </View>
            <ImageBackground
              source={{
                uri: user?.profileAvatar || user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Teacher')}&background=random&color=fff&size=200`
              }}
              style={styles.profileImage}
              imageStyle={{ borderRadius: 24 }}
            />
          </View>

          {/* Dashboard Summary Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statsScroll}
            contentContainerStyle={styles.statsScrollContent}
          >
            <StatCard
              icon="book-open-page-variant"
              value={String(courses.length)}
              label="Active Courses"
              color="#818cf8"
              onPress={onMyCoursesPress}
            />
            <StatCard
              icon="account-group"
              value={totalStudents !== undefined ? String(totalStudents) : '0'}
              label="Total Students"
              color="#34d399"
            />
            <StatCard
              icon="star-circle"
              value={dashboardStats?.average_rating ? String(dashboardStats.average_rating) : '0.0'}
              label="Avg. Rating"
              color="#fbbf24"
            />
          </ScrollView>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#312e81" />}
      >
        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionGrid}>
          <ActionButton
            icon="plus-circle"
            label="New Course"
            onPress={onCreateCoursePress}
            gradient={['#4f46e5', '#4338ca']}
          />
          <ActionButton
            icon="bullhorn-outline"
            label="Announcement"
            onPress={onCreateAnnouncementPress || (() => { })}
            gradient={['#ec4899', '#db2777']}
          />
          <ActionButton
            icon="video-wireless"
            label="Go Live"
            onPress={onManageLiveClassesPress || (() => { })}
            gradient={['#06b6d4', '#0891b2']}
          />
          <ActionButton
            icon="chart-bar"
            label="Analytics"
            onPress={() => { }}
            gradient={['#f59e0b', '#d97706']}
          />
        </View>

        {/* Student Feedback Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Student Feedback</Text>
        </View>

        {recentReviews.length === 0 ? (
          <View style={styles.emptyAnnState}>
            <Text style={styles.emptyAnnText}>No student reviews yet.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalAnnScroll}>
            {recentReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <Surface style={styles.reviewInner}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.studentInfo}>
                      <View style={styles.avatarMini}>
                        <Text style={styles.avatarText}>{review.student_name?.[0] || 'S'}</Text>
                      </View>
                      <View>
                        <Text style={styles.reviewStudentName}>{review.student_name}</Text>
                        <Text style={styles.reviewCourseName} numberOfLines={1}>{review.course_name || 'Chemistry'}</Text>
                      </View>
                    </View>
                    <View style={styles.ratingBadge}>
                      <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.ratingText}>{review.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={3}>"{review.comment || 'No comment provided.'}"</Text>
                </Surface>
              </View>
            ))}
            <View style={{ width: 20 }} />
          </ScrollView>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 20,
  },
  nexusHeader: {
    height: 280,
    paddingTop: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  blurMesh: {
    position: 'absolute',
    top: -50,
    right: -50,
    opacity: 0.6,
  },
  meshIcon: {
    transform: [{ rotate: '-15deg' }],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  greetingLight: {
    fontSize: 14,
    color: '#a5b4fc',
    fontWeight: '500',
    marginBottom: 4,
  },
  greetingUser: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  profileImage: {
    width: 48,
    height: 48,
    backgroundColor: '#4338ca',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#818cf8',
    overflow: 'hidden',
  },
  statsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  statsScrollContent: {
    paddingRight: 24,
  },
  statCard: {
    width: 140,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    elevation: 4,
    borderLeftWidth: 4,
    justifyContent: 'space-between',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionBtnContainer: {
    width: (width - 48 - 12) / 2, // 2 columns
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBtnGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 8,
  },
  actionBtnLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  courseList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  courseIndex: {
    width: 24,
    height: 24,
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  courseRowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  rowCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  emptyAnnState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyAnnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  horizontalAnnScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  annCard: {
    width: 260,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginVertical: 4,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  annCardInner: {
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
  },
  annCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  annTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewCard: {
    width: width * 0.75,
    marginRight: 16,
  },
  reviewInner: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3b82f6',
  },
  reviewStudentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  reviewCourseName: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#d97706',
  },
  reviewText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  annTypeTagText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  annCardTime: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  annCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  annCardDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    fontWeight: '500',
  },
});
