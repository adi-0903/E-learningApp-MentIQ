import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface TeacherDashboardProps {
  onCoursePress: (courseId: string) => void;
  onCreateCoursePress: () => void;
  onCreateAnnouncementPress?: () => void;
  onManageLiveClassesPress?: () => void;
  onMyCoursesPress?: () => void;
}

const { width } = Dimensions.get('window');

const StatCard = ({ icon, value, label, color, subValue }: { icon: string, value: string | number, label: string, color: string, subValue?: string }) => (
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

const ActionButton = ({ icon, label, onPress, gradient }: { icon: string, label: string, onPress: () => void, gradient: string[] }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.actionBtnContainer}>
    <LinearGradient
      colors={gradient}
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
  const { courses, isLoading, fetchTeacherCourses, deleteCourse } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);

  // Helper date function
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    if (user?.id) {
      fetchTeacherCourses(user.id);
      // Placeholder for student count
      setTotalStudents(courses.length * 15 + Math.floor(Math.random() * 50));
    }
  }, [user?.id, courses.length]); // Updated dependency

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchTeacherCourses(user.id);
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
          colors={['#1e1b4b', '#312e81', '#4338ca']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingLight}>{getTimeOfDay()},</Text>
              <Text style={styles.greetingUser}>{user?.name?.split(' ')[0] || 'Instructor'}</Text>
            </View>
            <ImageBackground
              source={{ uri: 'https://ui-avatars.com/api/?name=Instructor&background=random' }}
              style={styles.profileImage}
              imageStyle={{ borderRadius: 20 }}
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
              value={courses.length}
              label="Active Courses"
              color="#818cf8"
              subValue="+2 this week"
            />
            <StatCard
              icon="account-group"
              value={totalStudents}
              label="Total Students"
              color="#34d399"
              subValue="+12% growth"
            />
            <StatCard
              icon="star-circle"
              value="4.8"
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
            label="Announce"
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

        {/* Recent Courses List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Courses</Text>
          <TouchableOpacity onPress={onMyCoursesPress}>
            <Text style={styles.seeAllText}>Manage All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.courseList}>
          {courses.slice(0, 5).map((course, index) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseRow}
              onPress={() => onCoursePress(course.id)}
              activeOpacity={0.7}
            >
              <View style={styles.courseIndex}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <View style={styles.courseRowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>{course.title}</Text>
                <Text style={styles.rowCategory}>{course.category || 'General'}</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => onCoursePress(course.id)}>
                  <MaterialCommunityIcons name="pencil" size={20} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteCourse(course.id, course.title)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {courses.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No courses yet. Create one to get started!</Text>
            </View>
          )}
        </View>
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
    backgroundColor: '#312e81',
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    shadowColor: '#312e81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingLight: {
    fontSize: 14,
    color: '#a5b4fc',
    fontWeight: '500',
    marginBottom: 4,
  },
  greetingUser: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileImage: {
    width: 50,
    height: 50,
    backgroundColor: '#4338ca',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#818cf8',
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
});
