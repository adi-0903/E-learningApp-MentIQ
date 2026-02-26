import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { useProgressStore } from '@/store/progressStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Card,
  ProgressBar,
  Searchbar,
  Text,
} from 'react-native-paper';

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  completionPercentage: number;
  enrolledAt: string;
  status: string;
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent?: number;
}

function TeacherProgressScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  const { fetchTeacherStudentProgress, fetchCourseStudentProgress } = useProgressStore();
  const { courses, fetchTeacherCourses } = useCourseStore();

  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [filteredProgress, setFilteredProgress] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(route.params?.courseId || null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    if (route.params?.courseId) {
      setSelectedCourse(route.params.courseId);
    }
  }, [route.params?.courseId]);

  useEffect(() => {
    loadData();
    if (user?.id) {
      fetchTeacherCourses(user.id).catch(error => {
        console.error('Error fetching teacher courses:', error);
      });
    }
  }, [user?.id, selectedCourse]);

  useEffect(() => {
    filterProgress();
  }, [studentProgress, searchQuery]);

  const normalizeProgress = (raw: any): StudentProgress => {
    return {
      studentId: String(raw.student_id || raw.studentId || ''),
      studentName: raw.student_name || raw.studentName || 'Unknown Student',
      studentEmail: raw.student_email || raw.studentEmail || 'No email',
      courseId: String(raw.course_id || raw.courseId || selectedCourse || ''),
      courseTitle: raw.course_title || raw.courseTitle || (selectedCourse ? courses.find(c => c.id === selectedCourse)?.title : '') || 'Various Courses',
      completionPercentage: raw.progress_percentage || raw.completion_percentage || raw.average_progress || 0,
      enrolledAt: raw.enrolled_at || raw.enrolledAt || '',
      status: raw.status || 'active',
      totalLessons: raw.total_lessons || 0,
      completedLessons: raw.lessons_completed || raw.completed_lessons || 0,
      totalTimeSpent: raw.total_time_spent || raw.totalTimeSpent || 0,
    };
  };

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let progress;
      if (selectedCourse) {
        progress = await fetchCourseStudentProgress(selectedCourse);
      } else {
        progress = await fetchTeacherStudentProgress();
      }

      const normalized = (Array.isArray(progress) ? progress : []).map(normalizeProgress);
      setStudentProgress(normalized);
    } catch (error) {
      console.error('Error loading progress data:', error);
      setStudentProgress([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setRefreshing(false);
  };

  const filterProgress = () => {
    if (!Array.isArray(studentProgress)) {
      setFilteredProgress([]);
      return;
    }

    let filtered = [...studentProgress];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        (p.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.courseTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.studentEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProgress(filtered);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'; // Emerald
    if (percentage >= 50) return '#f59e0b'; // Amber
    if (percentage > 0) return '#ef4444'; // Red
    return '#94a3b8'; // Slate
  };

  const getProgressStatus = (percentage: number) => {
    if (percentage >= 100) return 'Completed';
    if (percentage >= 80) return 'Excelling';
    if (percentage >= 50) return 'Steady';
    if (percentage > 0) return 'Started';
    return 'Not Started';
  };

  const formatTimeSpent = (seconds: number = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const renderOverviewCard = (item: StudentProgress) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('StudentDetail', { studentId: item.studentId, courseId: item.courseId })}
      activeOpacity={0.8}
      style={styles.premiumCard}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <LinearGradient
              colors={['#f0f4ff', '#e0e7ff']}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>
                {(item.studentName || 'S').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName} numberOfLines={1}>
                {item.studentName || 'Unknown Student'}
              </Text>
              <Text style={styles.courseName} numberOfLines={1}>
                {item.courseTitle}
              </Text>
            </View>
          </View>
          <View style={[styles.progressBadge, { backgroundColor: getProgressColor(item.completionPercentage) + '15', borderColor: getProgressColor(item.completionPercentage) + '30' }]}>
            <Text style={[styles.progressPercentage, { color: getProgressColor(item.completionPercentage) }]}>
              {Math.round(item.completionPercentage)}%
            </Text>
          </View>
        </View>

        <ProgressBar
          progress={item.completionPercentage / 100}
          color={getProgressColor(item.completionPercentage)}
          style={styles.progressBar}
        />

        <View style={styles.cardFooter}>
          <View style={styles.miniStat}>
            <MaterialCommunityIcons name="book-open-outline" size={14} color="#94a3b8" />
            <Text style={styles.miniStatText}>
              {item.completedLessons}/{item.totalLessons} Lessons
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getProgressColor(item.completionPercentage) }]} />
            <Text style={[styles.statusLabel, { color: getProgressColor(item.completionPercentage) }]}>
              {getProgressStatus(item.completionPercentage).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailedCard = (item: StudentProgress) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('StudentDetail', { studentId: item.studentId, courseId: item.courseId })}
      activeOpacity={0.7}
      style={styles.compactCard}
    >
      <View style={styles.compactLeft}>
        <LinearGradient
          colors={['#4338ca', '#6366f1']}
          style={styles.smallAvatar}
        >
          <Text style={styles.smallAvatarText}>
            {(item.studentName || 'S').charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={styles.compactInfo}>
          <Text style={styles.compactStudentName} numberOfLines={1}>
            {item.studentName || 'Unknown Student'}
          </Text>
          <View style={styles.registeredRow}>
            <Text style={styles.registeredLabel}>Registered in:</Text>
            <Text style={styles.registeredCourse} numberOfLines={1}>
              {item.courseTitle}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.compactRight}>
        <View style={[styles.miniProgressCircle, { borderColor: getProgressColor(item.completionPercentage) }]}>
          <Text style={[styles.miniPercentText, { color: getProgressColor(item.completionPercentage) }]}>
            {Math.round(item.completionPercentage)}%
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="chart-bar" size={60} color="#4338ca" />
      </View>
      <Text style={styles.emptyTitle}>No Data Yet</Text>
      <Text style={styles.emptySubtitle}>
        Once students enroll and start learning, their progress will appear here.
      </Text>
    </View>
  );

  const renderProgressItem = useCallback(({ item }: { item: any }) => viewMode === 'overview' ? renderOverviewCard(item) : renderDetailedCard(item), [viewMode]);

  if (!user?.id) {
    return (
      <View style={styles.centerContainer}>
        <Text>Please log in to view progress data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e1b4b', '#312e81', '#4338ca']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Student Insights</Text>
            <Text style={styles.headerSubtitle}>Track engagement & performance</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <MaterialCommunityIcons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search students..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#94a3b8"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </LinearGradient>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
          <TouchableOpacity
            style={[styles.courseChip, !selectedCourse && styles.activeChip]}
            onPress={() => setSelectedCourse(null)}
          >
            <Text style={[styles.chipText, !selectedCourse && styles.activeChipText]}>All Courses</Text>
          </TouchableOpacity>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseChip, selectedCourse === course.id && styles.activeChip]}
              onPress={() => setSelectedCourse(course.id)}
            >
              <Text style={[styles.chipText, selectedCourse === course.id && styles.activeChipText]}>
                {course.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'overview' && styles.activeMode]}
            onPress={() => setViewMode('overview')}
          >
            <MaterialCommunityIcons
              name="view-grid"
              size={20}
              color={viewMode === 'overview' ? '#4338ca' : '#94a3b8'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'detailed' && styles.activeMode]}
            onPress={() => setViewMode('detailed')}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={20}
              color={viewMode === 'detailed' ? '#4338ca' : '#94a3b8'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
      ) : (
        <FlatList
          data={filteredProgress}
          renderItem={renderProgressItem}
          keyExtractor={(item) => `${item.studentId}-${item.courseId}`}
          contentContainerStyle={styles.listContainer}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomRightRadius: 80,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchContainer: {
    paddingHorizontal: 24,
  },
  searchBar: {
    borderRadius: 20,
    boxShadow: 'none',
    backgroundColor: '#fff',
    height: 54,
  },
  searchInput: {
    fontSize: 16,
    color: '#1e293b',
  },
  filterSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseScroll: {
    flex: 1,
  },
  courseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 1px 5px rgba(0, 0, 0, 0.05)',
  },
  activeChip: {
    backgroundColor: '#4338ca',
    borderColor: '#4338ca',
  },
  chipText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#fff',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12000000000000001)',
  },
  modeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeMode: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  premiumCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4338ca',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  courseName: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  progressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 42,
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '900',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  gridItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e2e8f0',
  },
  gridLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footerCourse: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338ca',
  },
  footerPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.04)',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  compactInfo: {
    flex: 1,
  },
  compactStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  registeredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  registeredLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  registeredCourse: {
    fontSize: 11,
    color: '#4338ca',
    fontWeight: '700',
    flex: 1,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  miniPercentText: {
    fontSize: 9,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e1b4b',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  }
});

export default TeacherProgressScreen;
