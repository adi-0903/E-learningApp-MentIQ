import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { LiveClass, useLiveClassStore } from '@/store/liveClassStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  Snackbar,
  Text
} from 'react-native-paper';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function BrowseLiveClassesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { fetchActiveLiveClasses, fetchAllLiveClasses, activeClasses, liveClasses, isLoading } = useLiveClassStore();
  const { fetchEnrolledCourses, courses } = useCourseStore();

  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled'>('active');
  const [filteredClasses, setFilteredClasses] = useState<LiveClass[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [activeTab, activeClasses, liveClasses]);

  const loadData = async () => {
    if (user?.id) {
      try {
        await Promise.all([
          fetchActiveLiveClasses(),
          fetchAllLiveClasses(),
          fetchEnrolledCourses(user.id),
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        showSnackbar('Failed to load live classes');
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user?.id]);

  const filterClasses = () => {
    let data = activeTab === 'active' ? activeClasses : liveClasses;

    // Filter by scheduled status if not active tab
    if (activeTab === 'scheduled') {
      data = data.filter((c) => c.status === 'scheduled');
    }

    // Show all live classes (not filtering by enrolled courses)
    // Students can join any live class regardless of course enrollment
    setFilteredClasses(data);
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleJoinClass = (liveClass: LiveClass) => {
    if (liveClass.status !== 'active') {
      showSnackbar('This class is not currently active');
      return;
    }

    Alert.alert(
      'Join Live Class',
      `Join "${liveClass.title}" by ${liveClass.teacherName}?`,
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Join',
          onPress: () => {
            navigation.navigate('StudentLiveClassRoom', { classId: liveClass.id });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.light.success;
      case 'scheduled':
        return Colors.light.primary;
      case 'completed':
        return Colors.light.textSecondary;
      case 'cancelled':
        return Colors.light.error;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'play-circle';
      case 'scheduled':
        return 'calendar-clock';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderLiveClassCard = ({ item }: { item: LiveClass }) => (
    <Card style={[styles.card, AppShadows.small]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.classTitle}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={styles.teacherName}>
              by {item.teacherName}
            </Text>
            <Chip
              icon={getStatusIcon(item.status)}
              style={{ backgroundColor: getStatusColor(item.status), marginTop: 8 }}
              textStyle={{ color: Colors.light.white, ...Typography.caption, fontWeight: '700' }}
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
          <MaterialCommunityIcons
            name={getStatusIcon(item.status)}
            size={32}
            color={getStatusColor(item.status)}
          />
        </View>

        {item.description && (
          <Text variant="bodySmall" style={styles.description}>
            {item.description}
          </Text>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>
              {format(new Date(item.scheduledStartTime || new Date()), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.detailText}>
              {format(new Date(item.scheduledStartTime || new Date()), 'HH:mm')}
            </Text>
          </View>
          {item.participantCount !== undefined && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-multiple" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.detailText}>
                {item.participantCount} participant{item.participantCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionContainer}>
          {item.status === 'active' ? (
            <Button
              mode="contained"
              onPress={() => handleJoinClass(item)}
              style={styles.joinButton}
              icon="video"
              buttonColor={Colors.light.error} // Red for LIVE
            >
              Join Live
            </Button>
          ) : item.status === 'scheduled' ? (
            <View style={styles.scheduledInfo}>
              <MaterialCommunityIcons name="information" size={20} color={Colors.light.primary} />
              <Text style={styles.scheduledText}>
                Starts {format(new Date(item.scheduledStartTime || new Date()), 'MMM dd, HH:mm')}
              </Text>
            </View>
          ) : (
            <Button mode="outlined" disabled style={{ borderColor: Colors.light.border }}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>🎥 Live Classes</Text>
          <Text style={styles.subtitle}>Join live sessions with your teachers</Text>
        </View>
      </LinearGradient>

      {/* <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'active' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('active')}
          style={styles.tabButton}
        >
          Live Now
        </Button>
        <Button
          mode={activeTab === 'scheduled' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('scheduled')}
          style={styles.tabButton}
        >
          Scheduled
        </Button>
      </View> */}

      {isLoading && filteredClasses.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredClasses}
          renderItem={renderLiveClassCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.comingSoonCard}>
                <LinearGradient
                  colors={[Colors.light.primaryLight, '#fff']}
                  style={styles.comingSoonGradient}
                >
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={64}
                    color={Colors.light.primary}
                  />
                  <Text variant="headlineMedium" style={styles.comingSoonTitle}>
                    Coming Soon
                  </Text>
                  <Text variant="bodyMedium" style={styles.comingSoonSubtitle}>
                    Live class streaming feature is being prepared for you
                  </Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Join live classes with teachers</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Real-time interaction</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Learn from anywhere</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Access recorded live lectures</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          }
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: Colors.light.text }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  premiumHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.l,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...AppShadows.medium,
  },
  headerContent: {
    gap: 4,
  },
  greeting: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.light.white,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.light.white,
  },
  searchBar: {
    margin: 0,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
    paddingTop: Spacing.xl,
    gap: Spacing.s,
    backgroundColor: Colors.light.white,
  },
  tabButton: {
    flex: 1,
  },
  tabs: {
    backgroundColor: Colors.light.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.m,
  },
  card: {
    marginBottom: Spacing.m,
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.m,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.m,
  },
  classTitle: {
    ...Typography.h3,
    fontSize: 18,
    marginBottom: 4,
    color: Colors.light.text,
  },
  teacherName: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.s,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.m,
    fontStyle: 'italic',
  },
  detailsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: Spacing.s,
    color: Colors.light.textSecondary,
    ...Typography.caption,
  },
  actionContainer: {
    marginTop: Spacing.s,
  },
  joinButton: {
    borderRadius: BorderRadius.m,
  },
  scheduledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primaryLight,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
  },
  scheduledText: {
    marginLeft: Spacing.m,
    color: Colors.light.primary,
    fontWeight: '500',
    ...Typography.bodySmall,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.l,
  },
  comingSoonCard: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.xl,
    ...AppShadows.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
    width: '100%',
    overflow: 'hidden',
  },
  comingSoonGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  comingSoonTitle: {
    marginTop: Spacing.m,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    marginTop: Spacing.s,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureList: {
    marginTop: Spacing.l,
    width: '100%',
    gap: Spacing.m,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingVertical: Spacing.s,
    width: '100%',
  },
  featureText: {
    color: Colors.light.text,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
});
