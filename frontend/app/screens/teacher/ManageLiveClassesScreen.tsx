import { useAuthStore } from '@/store/authStore';
import { LiveClass, useLiveClassStore } from '@/store/liveClassStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Button,
  Card,
  Dialog,
  FAB,
  Portal,
  Snackbar,
  Text,
} from 'react-native-paper';

export default function ManageLiveClassesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const {
    liveClasses,
    fetchTeacherLiveClasses,
    isLoading,
    startLiveClass,
    endLiveClass,
    updateLiveClass,
    deleteLiveClass,
  } = useLiveClassStore();

  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogAction, setDialogAction] = useState<'start' | 'end' | 'cancel' | 'delete' | null>(null);

  useEffect(() => {
    loadLiveClasses();
  }, []);

  const loadLiveClasses = async () => {
    if (user?.id) {
      try {
        await fetchTeacherLiveClasses(user.id);
      } catch (error) {
        console.error('Error loading live classes:', error);
        showSnackbar('Failed to load live classes');
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLiveClasses();
    setRefreshing(false);
  }, [user?.id]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleStartClass = async () => {
    if (!selectedClass) return;
    try {
      await startLiveClass(selectedClass.id);
      showSnackbar('Live class started!');
      await loadLiveClasses();
      setDialogVisible(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error starting live class:', error);
      showSnackbar('Failed to start live class');
    }
  };

  const handleEndClass = async () => {
    if (!selectedClass) return;
    try {
      await endLiveClass(selectedClass.id);
      showSnackbar('Live class ended!');
      await loadLiveClasses();
      setDialogVisible(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error ending live class:', error);
      showSnackbar('Failed to end live class');
    }
  };

  const handleCancelClass = async () => {
    if (!selectedClass) return;
    try {
      await updateLiveClass(selectedClass.id, { status: 'cancelled' });
      showSnackbar('Live class cancelled!');
      await loadLiveClasses();
      setDialogVisible(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error cancelling live class:', error);
      showSnackbar('Failed to cancel live class');
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      await deleteLiveClass(selectedClass.id);
      showSnackbar('Live class deleted!');
      await loadLiveClasses();
      setDialogVisible(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error deleting live class:', error);
      showSnackbar('Failed to delete live class');
    }
  };

  const showConfirmDialog = (action: 'start' | 'end' | 'cancel' | 'delete', liveClass: LiveClass) => {
    setSelectedClass(liveClass);
    setDialogAction(action);
    setDialogVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'scheduled': return '#4338ca';
      case 'completed': return '#64748b';
      case 'cancelled': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'LIVE NOW';
      case 'scheduled': return 'UPCOMING';
      case 'completed': return 'ENDED';
      case 'cancelled': return 'CANCELLED';
      default: return status.toUpperCase();
    }
  };

  const renderPremiumLiveClassCard = ({ item }: { item: LiveClass }) => (
    <Card style={styles.premiumCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => showConfirmDialog('delete', item)}>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.classTitle} numberOfLines={2}>{item.title}</Text>

        {item.description && (
          <Text style={styles.classDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>
              {format(new Date(item.scheduledStartTime || new Date()), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>
              {format(new Date(item.scheduledStartTime || new Date()), 'HH:mm')}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          {item.status === 'scheduled' && (
            <>
              <Button
                mode="contained"
                onPress={() => showConfirmDialog('start', item)}
                style={[styles.actionBtn, { backgroundColor: '#4338ca' }]}
                labelStyle={styles.btnLabel}
              >
                Start Class
              </Button>
              <Button
                mode="outlined"
                onPress={() => showConfirmDialog('cancel', item)}
                style={[styles.actionBtn, { borderColor: '#ef4444' }]}
                textColor="#ef4444"
                labelStyle={styles.btnLabel}
              >
                Cancel
              </Button>
            </>
          )}
          {item.status === 'active' && (
            <>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('LiveClassRoom', { classId: item.id })}
                style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                labelStyle={styles.btnLabel}
              >
                Join Room
              </Button>
              <Button
                mode="contained"
                onPress={() => showConfirmDialog('end', item)}
                style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                labelStyle={styles.btnLabel}
              >
                End Class
              </Button>
            </>
          )}
          {(item.status === 'completed' || item.status === 'cancelled') && (
            <View style={styles.archiveContainer}>
              <Text style={styles.archiveText}>Class is archived</Text>
              <Button
                mode="text"
                onPress={() => showConfirmDialog('delete', item)}
                textColor="#ef4444"
                compact
              >
                Delete
              </Button>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const getDialogTitle = () => {
    switch (dialogAction) {
      case 'start': return 'Start Live Class?';
      case 'end': return 'End Live Class?';
      case 'cancel': return 'Cancel Live Class?';
      case 'delete': return 'Delete Live Class?';
      default: return 'Confirm Action';
    }
  };

  const getDialogMessage = () => {
    switch (dialogAction) {
      case 'start': return 'This will start the live class and students will be able to join.';
      case 'end': return 'This will end the live class and disconnect all participants.';
      case 'cancel': return 'This will cancel the scheduled live class.';
      case 'delete': return 'This action cannot be undone.';
      default: return 'Are you sure?';
    }
  };

  const handleDialogConfirm = async () => {
    switch (dialogAction) {
      case 'start': await handleStartClass(); break;
      case 'end': await handleEndClass(); break;
      case 'cancel': await handleCancelClass(); break;
      case 'delete': await handleDeleteClass(); break;
    }
  };

  if (isLoading && liveClasses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4338ca" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerDecorationCircle} />
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Live Studio</Text>
          <Text style={styles.subtitle}>Broadcast to your students in real-time</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={liveClasses}
        renderItem={renderPremiumLiveClassCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4338ca" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#eef2ff', '#e0e7ff']} style={styles.emptyIconBg}>
              <MaterialCommunityIcons name="video-wireless-outline" size={64} color="#4338ca" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Live Classes</Text>
            <Text style={styles.emptySubtitle}>
              Schedule a new class to interact with your students live!
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10b981" />
                <Text style={styles.featureText}>Real-time HD streaming</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10b981" />
                <Text style={styles.featureText}>Interactive chat & polls</Text>
              </View>
            </View>
          </View>
        }
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={{ borderRadius: 16 }}>
          <Dialog.Title style={styles.dialogTitle}>{getDialogTitle()}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>{getDialogMessage()}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor="#64748b">Cancel</Button>
            <Button
              onPress={handleDialogConfirm}
              textColor={dialogAction === 'delete' || dialogAction === 'cancel' || dialogAction === 'end' ? '#ef4444' : '#4338ca'}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateLiveClass')}
        color="#fff"
        theme={{ colors: { primary: '#4338ca' } }}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#1e293b' }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  premiumHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10,
  },
  headerDecorationCircle: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
  },
  headerContent: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  premiumCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(100, 116, 139, 0.1)',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  classDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
  },
  btnLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  archiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 10,
  },
  archiveText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  featureList: {
    width: '100%',
    paddingHorizontal: 40,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  dialogTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  dialogText: {
    color: '#475569',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4338ca',
  },
});
