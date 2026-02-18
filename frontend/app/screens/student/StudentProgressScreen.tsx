import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Text, ProgressBar, ActivityIndicator, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { useCourseStore } from '@/store/courseStore';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

function StudentProgressScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { enrollments, isLoading, fetchStudentEnrollments } = useProgressStore();
  const { courses, fetchEnrolledCourses } = useCourseStore();
  const [courseProgress, setCourseProgress] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchStudentEnrollments(user.id);
      fetchEnrolledCourses(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    const progress = enrollments
      .map(enrollment => {
        const course = courses.find(c => c.id === enrollment.courseId);
        return {
          ...enrollment,
          courseName: course?.title || 'Unknown Course',
        };
      })
      .filter(item => item.courseName !== 'Unknown Course');
    setCourseProgress(progress);
  }, [enrollments, courses]);

  const renderProgressCard = ({ item, index }: { item: any, index: number }) => (
    <Surface key={item.id || index} style={styles.cardWrapper} elevation={2}>
      <View style={styles.cardIconBox}>
        <MaterialCommunityIcons name="book-open-page-variant" size={24} color={Colors.light.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.courseName}</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.percentText}>{Math.round(item.completionPercentage)}% Complete</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${item.completionPercentage}%` }]}
          />
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.statusChip}>
            <View style={[styles.dot, { backgroundColor: item.completionPercentage >= 100 ? Colors.light.success : Colors.light.warning }]} />
            <Text style={styles.statusText}>{item.completionPercentage >= 100 ? 'Completed' : 'In Progress'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CourseDetail', { courseId: item.courseId })}>
            <MaterialCommunityIcons name="arrow-right-circle" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Surface>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const completedCourses = courseProgress.filter(c => c.completionPercentage >= 100).length;
  const totalCourses = courseProgress.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Learning Progress</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCourses}</Text>
            <Text style={styles.summaryLabel}>Enrolled</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completedCourses}</Text>
            <Text style={styles.summaryLabel}>Finished</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {totalCourses > 0 ? Math.round(courseProgress.reduce((acc, c) => acc + c.completionPercentage, 0) / totalCourses) : 0}%
            </Text>
            <Text style={styles.summaryLabel}>Overall</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Course Roadmap</Text>

        {courseProgress.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="flower-outline" size={80} color={Colors.light.textLight} />
            <Text style={styles.emptyTitle}>Your garden is waiting</Text>
            <Text style={styles.emptySub}>Start a course to see your progress bloom here.</Text>
          </View>
        ) : (
          courseProgress.map((item, index) => renderProgressCard({ item, index }))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  cardWrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 16,
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  percentText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
});

export default StudentProgressScreen;
