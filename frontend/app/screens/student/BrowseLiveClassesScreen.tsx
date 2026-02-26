import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { LiveClass, useLiveClassStore } from '@/store/liveClassStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Snackbar,
  Text,
} from 'react-native-paper';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function BrowseLiveClassesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { fetchActiveLiveClasses, fetchAllLiveClasses, activeClasses, liveClasses, isLoading, joinLiveClass } = useLiveClassStore();
  const { fetchEnrolledCourses } = useCourseStore();

  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Join a live class — calls the backend /join/ endpoint to get the Jitsi meeting URL,
  // then navigates to the live class room screen with the meeting data
  const handleJoinClass = async (liveClass: LiveClass) => {
    if (liveClass.status !== 'live') {
      showSnackbar('This class is not currently live');
      return;
    }

    setJoiningId(liveClass.id);
    try {
      const result = await joinLiveClass(liveClass.id);
      // Navigate to the meeting room with the data from the backend
      navigation.navigate('StudentLiveClassRoom', {
        classId: liveClass.id,
        meetingUrl: result.meetingUrl,
        roomName: result.channelName || result.roomId,
        title: liveClass.title,
      });
    } catch (error: any) {
      const msg = error?.message || 'Failed to join class';
      showSnackbar(msg);
    } finally {
      setJoiningId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#ef4444';
      case 'scheduled':
        return Colors.light.primary;
      case 'ended':
      case 'completed':
        return Colors.light.textSecondary;
      case 'cancelled':
        return Colors.light.error;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live':
        return 'LIVE NOW';
      case 'scheduled':
        return 'SCHEDULED';
      case 'ended':
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'live':
        return 'access-point';
      case 'scheduled':
        return 'calendar-clock';
      case 'ended':
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderLiveClassCard = ({ item }: { item: LiveClass }) => {
    const isLive = item.status === 'live';
    const isScheduled = item.status === 'scheduled';
    const isEnded = item.status === 'ended' || item.status === 'completed';
    const isJoining = joiningId === item.id;

    return (
      <View style={[styles.card, isLive && styles.cardLive]}>
        {/* Live pulse indicator */}
        {isLive && (
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.liveBanner}
          >
            <View style={styles.liveDot} />
            <Text style={styles.liveBannerText}>LIVE NOW</Text>
          </LinearGradient>
        )}

        <View style={styles.cardBody}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.classTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.mentorRow}>
                <MaterialCommunityIcons name="account-circle" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.teacherName}>{item.teacherName || 'Instructor'}</Text>
              </View>
            </View>
            {!isLive && (
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                <MaterialCommunityIcons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}

          {/* Meta grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>SCHEDULE</Text>
              <Text style={styles.metaValue}>
                {item.scheduledStartTime
                  ? format(new Date(item.scheduledStartTime), 'MMM dd, HH:mm')
                  : '—'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>PARTICIPANTS</Text>
              <Text style={styles.metaValue}>
                {item.participantCount ?? 0}{item.maxParticipants ? `/${item.maxParticipants}` : ''}
              </Text>
            </View>
          </View>

          {/* Recording link */}
          {item.recordingUrl ? (
            <View style={styles.recordingRow}>
              <MaterialCommunityIcons name="movie-open" size={16} color="#6366f1" />
              <Text style={styles.recordingText}>Recording Available</Text>
            </View>
          ) : null}

          {/* Action button */}
          <View style={styles.actionContainer}>
            {isLive ? (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinClass(item)}
                disabled={isJoining}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isJoining ? ['#9ca3af', '#6b7280'] : ['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinButtonGradient}
                >
                  {isJoining ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="video" size={20} color="#fff" />
                  )}
                  <Text style={styles.joinButtonText}>
                    {isJoining ? 'CONNECTING...' : 'ENTER CLASSROOM'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : isScheduled ? (
              <View style={styles.scheduledInfo}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={Colors.light.primary} />
                <Text style={styles.scheduledText}>
                  Starts {item.scheduledStartTime
                    ? format(new Date(item.scheduledStartTime), 'MMM dd \'at\' HH:mm')
                    : 'soon'}
                </Text>
              </View>
            ) : isEnded ? (
              <View style={styles.endedInfo}>
                <MaterialCommunityIcons name="check-circle" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.endedText}>Session Completed</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>🎥 Virtual Classroom</Text>
          <Text style={styles.subtitle}>Join live sessions with your teachers</Text>
        </View>
      </LinearGradient>

      {isLoading && liveClasses.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Syncing with live servers...</Text>
        </View>
      ) : (
        <FlatList
          data={liveClasses}
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
                    name="video-wireless-outline"
                    size={64}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.comingSoonTitle}>No Live Classes</Text>
                  <Text style={styles.comingSoonSubtitle}>
                    When your teachers schedule or start live sessions, they'll appear here
                  </Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Join live classes with teachers</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Real-time video interaction</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>In-class chat messaging</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.success} />
                      <Text style={styles.featureText}>Access recordings after class</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  listContent: {
    padding: Spacing.m,
    paddingBottom: Spacing.xxl,
  },

  // ─── Card Styles ──────────────────────────────────────────────────
  card: {
    marginBottom: Spacing.m,
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.l,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    ...AppShadows.small,
  },
  cardLive: {
    borderColor: '#fca5a5',
    borderWidth: 1.5,
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveBannerText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  cardBody: {
    padding: Spacing.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.s,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.m,
  },
  classTitle: {
    ...Typography.h3,
    fontSize: 17,
    color: Colors.light.text,
    marginBottom: 4,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teacherName: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.m,
    lineHeight: 18,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.m,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    gap: Spacing.m,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.textLight,
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.light.text,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef2ff',
    padding: Spacing.s,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
  },
  recordingText: {
    ...Typography.bodySmall,
    color: '#6366f1',
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 4,
  },
  joinButton: {
    borderRadius: BorderRadius.m,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  scheduledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primaryLight,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    gap: 10,
  },
  scheduledText: {
    color: Colors.light.primary,
    fontWeight: '600',
    ...Typography.bodySmall,
    flex: 1,
  },
  endedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    gap: 10,
  },
  endedText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
    ...Typography.bodySmall,
  },

  // ─── Empty State ──────────────────────────────────────────────────
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
    fontSize: 20,
    color: Colors.light.text,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    marginTop: Spacing.s,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    ...Typography.body,
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
