import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Animated, TouchableOpacity, Easing } from 'react-native';
import { Card, Switch, Text } from 'react-native-paper';
import { Colors, AppShadows } from '@/constants/theme';

function NotificationSettingsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { settings, isLoading, loadSettings, updateSettings } = useNotificationStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (user?.id) {
      loadSettings(user.id);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [user?.id, loadSettings]);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    try {
      if (user?.id) {
        await updateSettings(user.id, { [key]: value });
      }
    } catch (error) {
      console.error('Nexus: Link Failure', error);
    }
  };

  const settingSections = [
    {
      title: 'Dispatch Clusters',
      icon: 'tower-fire',
      settings: [
        { key: 'announcements', label: 'Global Dispatch', description: 'System-wide critical broadcasts', icon: 'bullhorn-variant-outline' },
        { key: 'assignments', label: 'Task Triggers', description: 'Immediate alerts for mission tasks', icon: 'file-document-edit-outline' },
        { key: 'quizzes', label: 'Evaluation Pulse', description: 'Critical sync for quiz availability', icon: 'brain' },
        { key: 'courses', label: 'Module Updates', description: 'New knowledge layer available', icon: 'certificate-outline' },
        { key: 'general', label: 'System Pulse', description: 'Critical system pings and syncs', icon: 'lan-check' },
      ]
    },
    {
      title: 'Signal Haptics',
      icon: 'vibrate',
      settings: [
        { key: 'sound', label: 'Auditory Alert', description: 'Sonic ping for new data', icon: 'volume-high' },
        { key: 'vibration', label: 'Tactile Pulse', description: 'Kinetic response on arrival', icon: 'vibrate' },
      ]
    },
    {
      title: 'External Bridges',
      icon: 'satellite-variant',
      settings: [
        { key: 'emailNotifications', label: 'Archival Link', description: 'Mirror dispatch to primary email', icon: 'email-lock' },
      ]
    }
  ];

  const isStudent = user?.role === 'student';
  const themeColors = (isStudent
    ? ['#064e3b', '#065f46', '#064e3b']
    : ['#1e1b4b', '#312e81', '#1e1b4b']) as readonly [string, string, ...string[]];

  const accentColor = isStudent ? '#10b981' : '#6366f1';
  const iconBg = isStudent ? '#ecfdf5' : '#f5f3ff';
  const iconColor = isStudent ? '#059669' : '#4f46e5';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={themeColors}
        style={styles.nexusHeader}
      >
        <View style={styles.meshWrapper}>
          <MaterialCommunityIcons
            name="broadcast"
            size={300}
            color={isStudent ? "rgba(16, 185, 129, 0.05)" : "rgba(99, 102, 241, 0.05)"}
            style={styles.meshIcon}
          />
        </View>

        <View style={styles.headerBody}>
          <View style={styles.signalRow}>
            <View style={styles.signalBar} />
            <View style={styles.signalBar} />
            <View style={[styles.signalBar, { height: 12 }]} />
            <Text style={styles.nexusLabel}>LINK ACTIVE</Text>
          </View>
          <Text style={styles.nexusTitle}>Notification</Text>
          <Text style={styles.nexusSubtitle}>Configuring real-time system synchronization</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {settingSections.map((section, sIdx) => (
            <View key={sIdx} style={styles.clusterWrapper}>
              <View style={styles.clusterHeader}>
                <MaterialCommunityIcons name={section.icon as any} size={16} color={accentColor} />
                <Text style={styles.clusterTitle}>{section.title}</Text>
              </View>

              <Card style={styles.nexusCard}>
                <Card.Content style={styles.cardPaddingReset}>
                  {section.settings.map((setting, idx) => (
                    <View key={setting.key} style={[styles.dispatchItem, idx === section.settings.length - 1 && styles.noBorder]}>
                      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                        <MaterialCommunityIcons name={setting.icon as any} size={20} color={iconColor} />
                      </View>
                      <View style={styles.dispatchInfo}>
                        <Text style={styles.dispatchLabel}>{setting.label}</Text>
                        <Text style={styles.dispatchDesc}>{setting.description}</Text>
                      </View>
                      <Switch
                        value={Boolean(settings?.[setting.key as keyof typeof settings])}
                        onValueChange={(value) => handleToggle(setting.key as keyof typeof settings, value)}
                        color={accentColor}
                        disabled={isLoading}
                      />
                    </View>
                  ))}
                </Card.Content>
              </Card>
            </View>
          ))}

          {/* Infrastructure Health Tip */}
          <View style={styles.healthTip}>
            <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.tipGradient}>
              <MaterialCommunityIcons name="security" size={20} color="#64748b" />
              <View style={styles.tipBody}>
                <Text style={styles.tipTitle}>Infrastructure Secure</Text>
                <Text style={styles.tipText}>Dispatch clusters are encrypted with TLS 1.3 for maximum transfer integrity.</Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  nexusHeader: {
    height: 175,
    paddingTop: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  meshWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  meshIcon: {
    position: 'absolute',
    right: -60,
    top: -40,
  },
  headerBody: {
    zIndex: 1,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  signalBar: {
    width: 3,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 1,
  },
  nexusLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 2,
    marginLeft: 4,
  },
  nexusTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  nexusSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  clusterWrapper: {
    marginBottom: 28,
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  clusterTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  nexusCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...AppShadows.light,
  },
  cardPaddingReset: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dispatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dispatchInfo: {
    flex: 1,
  },
  dispatchLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  dispatchDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  healthTip: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
  },
  tipGradient: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
  },
  tipText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomSpace: {
    height: 40,
  },
});

export default NotificationSettingsScreen;
