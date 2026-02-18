import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar
} from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { Colors, AppShadows, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

function MyCoursesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { courses, isLoading, fetchTeacherCourses, deleteCourse } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);

  // Premium Palette
  const PREMIUM = {
    bg: '#f8fafc',
    slate: '#1e293b',
    indigo: '#4f46e5',
    amber: '#f59e0b',
    rose: '#e11d48',
    textMain: '#0f172a',
    textSub: '#64748b'
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchTeacherCourses(user.id);
      }
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchTeacherCourses(user.id);
    }
    setRefreshing(false);
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    Alert.alert(
      'Archive Course',
      `Are you sure you want to permanently delete "${courseTitle}"? This action is irreversible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCourse(courseId);
              if (user?.id) fetchTeacherCourses(user.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <Surface style={styles.courseCard} elevation={1}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, courseTitle: item.title })}
        activeOpacity={0.9}
        style={styles.cardHeader}
      >
        <View style={styles.titleSection}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: item.isPublished ? '#ecfdf5' : '#fef2f2' }]}>
              <Text style={[styles.statusText, { color: item.isPublished ? '#059669' : '#dc2626' }]}>
                {item.isPublished ? 'Published' : 'Draft'}
              </Text>
            </View>
            <View style={styles.categoryInfo}>
              <MaterialCommunityIcons name="tag-outline" size={12} color={PREMIUM.textSub} />
              <Text style={styles.categoryLabel}>{item.category || 'Academic'}</Text>
            </View>
          </View>
          <Text style={styles.courseTitle} numberOfLines={1}>{item.title}</Text>
        </View>

        <TouchableOpacity
          onPress={() => handleDeleteCourse(item.id, item.title)}
          style={styles.moreBtn}
        >
          <MaterialCommunityIcons name="dots-vertical" size={20} color={PREMIUM.textSub} />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.cardStats}>
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="account-group-outline" size={16} color={PREMIUM.indigo} />
          <Text style={styles.statVal}>{item.student_count || 0}</Text>
          <Text style={styles.statName}>Students</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="book-open-outline" size={16} color={PREMIUM.indigo} />
          <Text style={styles.statVal}>{item.lesson_count || 0}</Text>
          <Text style={styles.statName}>Units</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={PREMIUM.indigo} />
          <Text style={styles.statVal}>{item.duration || 'Flex'}</Text>
          <Text style={styles.statName}>Hours</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, courseTitle: item.title })}
        >
          <LinearGradient
            colors={[PREMIUM.indigo, '#4338ca']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="pencil-box-multiple-outline" size={18} color="#fff" />
            <Text style={styles.actionLabel}>Manage Curriculum</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Surface>
  );

  if (isLoading && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PREMIUM.indigo} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1e1b4b', '#312e81']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Academic Vault</Text>
            <Text style={styles.headerSub}>Control center for all your modules</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateCourse')}
          >
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              style={styles.addBtnInner}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.overviewStrip}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewVal}>{courses.length}</Text>
            <Text style={styles.overviewLabel}>Total Courses</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewVal}>{courses.filter(c => c.is_published).length}</Text>
            <Text style={styles.overviewLabel}>Published</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PREMIUM.indigo} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.illustrateBox}>
              <MaterialCommunityIcons name="bookshelf" size={60} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No Programs Found</Text>
            <Text style={styles.emptyDesc}>Start by creating your first academic program to populate your vault.</Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => navigation.navigate('CreateCourse')}
            >
              <Text style={styles.emptyActionText}>Craft First Course</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomRightRadius: 40,
    ...AppShadows.medium,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  addBtn: {
    ...AppShadows.medium,
  },
  addBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  overviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  overviewLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  moreBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStats: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e293b',
    marginTop: 1,
  },
  statName: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#e2e8f0',
  },
  cardActions: {
    padding: 16,
  },
  primaryAction: {
    ...AppShadows.small,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  illustrateBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 30,
  },
  emptyAction: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    ...AppShadows.medium,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default MyCoursesScreen;
