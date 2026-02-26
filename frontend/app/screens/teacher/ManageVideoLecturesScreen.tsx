import { Lesson, useCourseStore } from '@/store/courseStore';
import { mediaApi, API_BASE_URL } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { ActivityIndicator, Button, FAB, Text, TextInput, Surface } from 'react-native-paper';
import { AppShadows, Colors } from '@/constants/theme';

const PREMIUM = {
  bg: '#f8fafc',
  slate: '#1e293b',
  indigo: '#4f46e5',
  violet: '#6366f1',
  textMain: '#0f172a',
  textSub: '#64748b',
  cardBg: '#ffffff',
  accent: '#eff6ff'
};

export default function ManageVideoLecturesScreen({ route, navigation }: any) {
  const { courseId, courseTitle } = route?.params || {};
  const { lessons, isLoading, fetchLessons, deleteLesson, createLesson } = useCourseStore();
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoFile: null as any,
    duration: '',
  });

  useEffect(() => {
    if (courseId) {
      fetchLessons(courseId);
    }
  }, [courseId]);

  if (!courseId) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="titleMedium" style={{ color: PREMIUM.textSub }}>Invalid course ID</Text>
      </View>
    );
  }

  const pickVideoFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, videoFile: result.assets[0] });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video file');
    }
  };

  const handleAddVideo = async () => {
    if (!formData.title.trim() || !formData.videoFile) return;

    setIsUploading(true);
    try {
      // 1. Prepare Media Upload
      const mediaData = new FormData();
      mediaData.append('file', {
        uri: formData.videoFile.uri,
        name: formData.videoFile.name,
        type: formData.videoFile.mimeType || 'video/mp4',
      } as any);
      mediaData.append('title', formData.title);
      mediaData.append('course', courseId);

      // 2. Upload to Media Vault
      const uploadRes = await mediaApi.upload(mediaData);
      let videoUrl = uploadRes.data.data.file_url;

      // Ensure videoUrl is an absolute URL (Django URLField requirement)
      if (videoUrl && videoUrl.startsWith('/')) {
        const rootUrl = API_BASE_URL.replace('/api', '');
        videoUrl = `${rootUrl}${videoUrl}`;
      }

      // 3. Create Lesson Linked to Video
      await createLesson({
        course: courseId,
        title: formData.title,
        description: formData.description,
        video_url: videoUrl,
        sequence_number: lessons.length + 1,
        content: formData.description, // Optional
        duration: parseInt(formData.duration) || 0,
      });

      // 4. Finalize
      await fetchLessons(courseId);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        videoFile: null,
        duration: '',
      });
      Alert.alert('Success', 'Lecture published to curriculum vault.');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Could not publish video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (lessonId: string) => {
    Alert.alert('Archive Video', 'Are you sure you want to remove this lecture? This action is irreversible.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLesson(lessonId);
            fetchLessons(courseId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete video');
          }
        },
      },
    ]);
  };

  const renderVideoItem = ({ item }: { item: Lesson }) => (
    <Surface style={styles.videoCard} elevation={1}>
      <View style={styles.videoCardContent}>
        <View style={styles.cardMain}>
          <View style={styles.playIconBox}>
            <LinearGradient
              colors={[PREMIUM.indigo, PREMIUM.violet]}
              style={styles.iconGradient}
            >
              <MaterialCommunityIcons name="play" size={20} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.textInfo}>
            <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.metaBadgeRow}>
              <View style={styles.badge}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={PREMIUM.indigo} />
                <Text style={styles.badgeText}>{item.duration || '0'}m</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}>
                <Text style={[styles.badgeText, { color: '#64748b' }]}>Lecture</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.trashBtn}
            onPress={() => handleDeleteVideo(item.id)}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="calendar-range" size={14} color={PREMIUM.textSub} />
            <Text style={styles.footerText}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
            </Text>
          </View>
          <View style={styles.activeStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1e1b4b', '#312e81']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Lecture Vault</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{courseTitle || 'Curriculum Assets'}</Text>
          </View>
        </View>

        <Surface style={styles.statsSurface} elevation={0}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{lessons.length}</Text>
            <Text style={styles.statLab}>Lectures</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>
              {lessons.reduce((acc, curr) => acc + (curr.duration || 0), 0)}m
            </Text>
            <Text style={styles.statLab}>Runtime</Text>
          </View>
        </Surface>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PREMIUM.indigo} />
          <Text style={styles.loadingText}>Synchronizing Vault...</Text>
        </View>
      ) : (
        <FlatList
          data={lessons}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyVault}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="video-plus-outline" size={60} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Vault is Empty</Text>
              <Text style={styles.emptySubtitle}>Start populating your curriculum by uploading professional video lectures.</Text>
            </View>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismiss}
            activeOpacity={1}
            onPress={() => setShowForm(false)}
          />
          <Surface style={styles.modalCard} elevation={5}>
            <View style={styles.dragHandle} />

            <LinearGradient
              colors={[PREMIUM.indigo, PREMIUM.violet]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeaderGradient}
            >
              <View style={styles.modalHeaderInner}>
                <View style={styles.modalIconBox}>
                  <MaterialCommunityIcons name="rocket-launch" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitleText}>Curriculum Asset</Text>
                  <Text style={styles.modalSubtitle}>Configure your new video lecture</Text>
                </View>
                <TouchableOpacity onPress={() => setShowForm(false)} style={styles.modalCloseCircle}>
                  <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.inputStack}>
                <View style={styles.inputGroup}>
                  <TextInput
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="e.g. Advanced System Design"
                    style={styles.textInput}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor={PREMIUM.indigo}
                    textColor={PREMIUM.textMain}
                    placeholderTextColor={PREMIUM.textSub}
                    left={<TextInput.Icon icon="format-text" color={PREMIUM.indigo} />}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Briefly describe the learning outcomes..."
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor={PREMIUM.indigo}
                    textColor={PREMIUM.textMain}
                    placeholderTextColor={PREMIUM.textSub}
                    left={<TextInput.Icon icon="text-long" color={PREMIUM.indigo} />}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <MaterialCommunityIcons name="video-wireless" size={16} color={PREMIUM.indigo} />
                    <Text style={styles.inputLabel}>Primary Source</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.uploadBox, formData.videoFile && styles.uploadBoxActive]}
                    onPress={pickVideoFile}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.uploadIconCircle, formData.videoFile && { backgroundColor: '#d1fae5' }]}>
                      <MaterialCommunityIcons
                        name={formData.videoFile ? "check-decagram" : "cloud-upload-outline"}
                        size={28}
                        color={formData.videoFile ? "#10b981" : PREMIUM.indigo}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadTitle}>
                        {formData.videoFile ? 'Video Linked Successfully' : 'Select Video File'}
                      </Text>
                      <Text style={styles.uploadSub} numberOfLines={1}>
                        {formData.videoFile ? formData.videoFile.name : 'MP4, MOV, or AVI (Max 500MB)'}
                      </Text>
                    </View>
                    {!formData.videoFile && <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />}
                  </TouchableOpacity>
                </View>

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={formData.duration}
                      onChangeText={(text) => setFormData({ ...formData, duration: text })}
                      placeholder="e.g. 15"
                      keyboardType="numeric"
                      style={styles.textInput}
                      mode="flat"
                      underlineColor="transparent"
                      activeUnderlineColor={PREMIUM.indigo}
                      textColor={PREMIUM.textMain}
                      placeholderTextColor={PREMIUM.textSub}
                      left={<TextInput.Icon icon="timer-outline" color={PREMIUM.indigo} />}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.publishBtn, (!formData.title || !formData.videoFile || isUploading) && styles.publishBtnDisabled]}
                onPress={handleAddVideo}
                disabled={!formData.title || !formData.videoFile || isUploading}
              >
                <LinearGradient
                  colors={[PREMIUM.indigo, PREMIUM.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.publishGradient}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                  )}
                  <Text style={styles.publishBtnText}>
                    {isUploading ? 'Securing Asset...' : 'Publish to Curriculum'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Surface>
        </View>
      </Modal>

      <FAB
        icon="plus"
        label="Add Lecture"
        onPress={() => setShowForm(true)}
        style={styles.fab}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PREMIUM.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  statsSurface: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  statLab: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  listContent: {
    padding: 24,
    paddingTop: 30,
    paddingBottom: 100,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...AppShadows.small,
  },
  videoCardContent: {
    padding: 16,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  playIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PREMIUM.textMain,
    marginBottom: 4,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: PREMIUM.indigo,
  },
  trashBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  cardDesc: {
    fontSize: 13,
    color: PREMIUM.textSub,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: PREMIUM.textSub,
    fontWeight: '600',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: PREMIUM.textSub,
    fontWeight: '600',
  },
  emptyVault: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconBox: {
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
    color: PREMIUM.textMain,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PREMIUM.textSub,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeaderGradient: {
    marginTop: 12,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  modalHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScroll: {
    padding: 24,
  },
  inputStack: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: PREMIUM.textMain,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: PREMIUM.bg,
    borderRadius: 12,
    fontSize: 15,
    color: PREMIUM.textMain,
  },
  textArea: {
    backgroundColor: PREMIUM.bg,
    borderRadius: 12,
    minHeight: 100,
    fontSize: 15,
    color: PREMIUM.textMain,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    backgroundColor: PREMIUM.bg,
  },
  uploadBoxActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    borderStyle: 'solid',
  },
  uploadIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PREMIUM.textMain,
  },
  uploadSub: {
    fontSize: 12,
    color: PREMIUM.textSub,
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  publishBtn: {
    marginTop: 10,
    marginBottom: 40,
    ...AppShadows.medium,
  },
  publishBtnDisabled: {
    opacity: 0.5,
  },
  publishGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  fab: {
    position: 'absolute',
    margin: 24,
    right: 0,
    bottom: 20,
    backgroundColor: PREMIUM.indigo,
    borderRadius: 20,
  },
});
