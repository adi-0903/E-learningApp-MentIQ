import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { useProgressStore } from '@/store/progressStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Card, Searchbar, Text } from 'react-native-paper';
import { Colors, Spacing, AppShadows, BorderRadius, Typography } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

function BrowseCoursesScreen({ navigation }: any) {
  const { courses, isLoading, fetchCourses } = useCourseStore();
  const { user } = useAuthStore();
  const { enrollInCourse } = useProgressStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

  const CATEGORIES = [
    { label: 'All', value: 'all' },
    { label: 'Technology', value: 'technology' },
    { label: 'Business', value: 'business' },
    { label: 'Art', value: 'art' },
    { label: 'Science', value: 'science' },
  ];

  useEffect(() => {
    fetchCourses().catch(err => {
      console.error('BrowseCourses - fetch error:', err);
    });
  }, []);

  useEffect(() => {
    try {
      const filtered = courses.filter(course => {
        const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'all' ||
          (course.category && course.category.toLowerCase() === selectedCategory);

        return matchesSearch && matchesCategory;
      });
      setFilteredCourses(filtered);
    } catch (error) {
      console.error('Error filtering courses:', error);
      setFilteredCourses(courses);
    }
  }, [courses, searchQuery, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCourses();
    } catch (error) {
      console.error('Error refreshing courses:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) {
      alert('Please log in to enroll in courses'); // keeping alert for simplicity or could use a custom modal
      return;
    }

    try {
      await enrollInCourse(user.id, courseId);
      navigation.navigate('StudentHome');
    } catch (error) {
      // Error handling remains same
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('Already enrolled')) {
        alert('You are already enrolled in this course');
      } else {
        alert('Failed to enroll in course: ' + errorMessage);
      }
    }
  };

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity
      key={course.id}
      onPress={() => {
        if (course.id) {
          navigation.navigate('CourseDetail', { courseId: course.id });
        }
      }}
      activeOpacity={0.9}
      style={styles.courseCardContainer}
    >
      <View style={[styles.courseCard, AppShadows.light]}>
        <View style={styles.cardContent}>
          {/* Header with Icon */}
          <View style={styles.courseHeader}>
            <View style={styles.courseIconContainer}>
              <MaterialCommunityIcons name="book-open-page-variant" size={28} color={Colors.light.primary} />
            </View>
            <View style={styles.courseHeaderText}>
              <Text style={styles.courseCategory}>{course.category || 'Generate'}</Text>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.title}
              </Text>
            </View>
          </View>

          {/* Teacher Info */}
          {course.teacherName && (
            <Text style={styles.teacherName}>By {course.teacherName}</Text>
          )}

          {/* Details Row */}
          <View style={styles.detailsRow}>
            {course.duration && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.light.textLight} />
                <Text style={styles.detailText}>{course.duration}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Footer */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleEnroll(course.id);
              }}
              disabled={user?.role !== 'student'}
            >
              <View style={styles.enrollButtonSimple}>
                <Text style={styles.enrollButtonTextSimple}>Enroll Now</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.light.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && courses.length === 0) {
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
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>🔍 Browse Courses</Text>
          <Text style={styles.subtitle}>Discover new skills and passions</Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search courses..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor={Colors.light.primary}
          placeholderTextColor={Colors.light.textLight}
        />
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => setSelectedCategory(cat.value)}
              style={[
                styles.filterChip,
                selectedCategory === cat.value && styles.filterChipActive
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat.value && styles.filterChipTextActive
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={({ item }) => renderCourseCard(item)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={64}
              color={Colors.light.textLight}
              style={{ opacity: 0.5, marginBottom: Spacing.m }}
            />
            <Text style={styles.emptyStateText}>No courses found matching your search.</Text>
          </View>
        }
      />
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.l,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: Spacing.s,
    ...AppShadows.medium,
  },
  headerContent: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  greeting: {
    ...Typography.h2,
    color: Colors.light.white,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    paddingHorizontal: Spacing.l,
    marginTop: -Spacing.l, // Overlap deeply
    marginBottom: Spacing.m,
  },
  searchbar: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    height: 50,
    ...AppShadows.medium,
  },
  searchInput: {
    ...Typography.body,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.s,
    paddingBottom: Spacing.xxl,
  },
  filterWrapper: {
    marginBottom: Spacing.m,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.s,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...AppShadows.light,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.light.white,
  },
  courseCardContainer: {
    marginBottom: Spacing.m,
  },
  courseCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardContent: {
    padding: Spacing.m,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.s,
  },
  courseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.m,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  courseHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  courseCategory: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  courseTitle: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.light.text,
    lineHeight: 22,
  },
  teacherName: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.m,
    marginLeft: 60 + Spacing.s, // Indent to align with title if icon is 48 + mr 12 + pl 16? No, just keep simple
    marginTop: -Spacing.s, // Pull up a bit
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 60, // align with text
    gap: Spacing.m,
    marginBottom: Spacing.m,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...Typography.caption,
    color: Colors.light.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginHorizontal: -Spacing.m, // Extend to edges
    marginBottom: Spacing.s,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 4,
  },
  enrollButtonSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  enrollButtonTextSimple: {
    ...Typography.bodySmall,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.s,
  },
});

export default BrowseCoursesScreen;
