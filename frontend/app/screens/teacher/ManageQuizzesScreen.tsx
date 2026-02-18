import { Quiz, useQuizStore } from '@/store/quizStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View, StatusBar } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

function ManageQuizzesScreen({ route, navigation }: any) {
  const { courseId } = route?.params || {};

  if (!courseId) {
    return (
      <View style={styles.centerContainer}>
        <Text>Invalid course ID</Text>
      </View>
    );
  }

  const { quizzes, isLoading, fetchCourseQuizzes, deleteQuiz } = useQuizStore();

  useEffect(() => {
    if (courseId) {
      fetchCourseQuizzes(courseId).catch(error => {
        console.error('Error fetching quizzes:', error);
      });
    }
  }, [courseId]);

  const handleDeleteQuiz = (quizId: string, quizTitle: string) => {
    Alert.alert(
      'Delete Quiz',
      `Delete "${quizTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteQuiz(quizId);
              await fetchCourseQuizzes(courseId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete quiz');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <View style={styles.quizCard}>
      <View style={styles.quizRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#d97706" />
        </View>

        <View style={styles.quizContent}>
          <Text style={styles.quizTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.quizMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="help-circle-outline" size={14} color="#78716c" />
              <Text style={styles.quizMetaText}>{item.totalQuestions || 0} Questions</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="check-decagram-outline" size={14} color="#78716c" />
              <Text style={styles.quizMetaText}>{item.passingScore || 0}% Passing</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateQuiz', { courseId, quizId: item.id })}
            style={[styles.actionButton, styles.editButton]}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#d97706" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteQuiz(item.id, item.title)}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading && quizzes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#78350f', '#b45309', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerDecoration} />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>Assessments</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerMainTitle}>Manage Quizzes</Text>
        <Text style={styles.headerSubtitle}>Evaluate student progress</Text>
      </LinearGradient>

      <FlatList
        data={quizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={48} color="#d6d3d1" />
            </View>
            <Text style={styles.emptyTitle}>No quizzes yet</Text>
            <Text style={styles.emptySubtitle}>Create assessments to test knowledge</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fabContainer}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CreateQuiz', { courseId })}
      >
        <LinearGradient
          colors={['#d97706', '#b45309']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffbeb', // Very light amber/warm background
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    marginBottom: 8,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
  },
  headerTitleText: {
    color: '#ffedd5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffedd5',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#a8a29e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#fed7aa', // Light orange border
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quizContent: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 6,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quizMetaText: {
    fontSize: 12,
    color: '#78716c',
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#d6d3d1',
  },
  actionsContainer: {
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#fff7ed',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#44403c',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#a8a29e',
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    elevation: 6,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ManageQuizzesScreen;
