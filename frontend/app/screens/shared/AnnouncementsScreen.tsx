import { useAnnouncementStore, type Attachment } from '@/store/announcementStore';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { useNotificationStore } from '@/store/notificationStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, FlatList, Platform, ScrollView, StyleSheet, TouchableOpacity, View, Animated, Easing } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { ActivityIndicator, FAB, Searchbar, Text } from 'react-native-paper';
import { Colors, AppShadows } from '@/constants/theme';

function AnnouncementsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { announcements, isLoading, fetchCourseAnnouncements, fetchSchoolAnnouncements, fetchSubjectAnnouncements, fetchAllAnnouncements, deleteAnnouncement } = useAnnouncementStore();
  const { courses } = useCourseStore();
  const { markAllAsRead } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'school' | 'subject'>('all');
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<Array<{ uri: string }>>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Fetch announcements based on selected filter
      if (selectedFilter === 'all') {
        fetchAllAnnouncements();
      } else if (selectedFilter === 'school') {
        fetchSchoolAnnouncements();
      } else if (selectedFilter === 'subject') {
        fetchSubjectAnnouncements();
      }

      // Reset unread count when viewing announcements
      markAllAsRead();
    }, [selectedFilter, fetchAllAnnouncements, fetchSchoolAnnouncements, fetchSubjectAnnouncements, markAllAsRead])
  );

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteAnnouncement = (announcementId: string, title: string) => {
    Alert.alert(
      'System: Delete Update',
      `Permanently remove "${title}" from the logs?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Purge',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnouncement(announcementId);
              // Refresh the announcements list
              if (selectedFilter === 'all') {
                fetchAllAnnouncements();
              } else if (selectedFilter === 'school') {
                fetchSchoolAnnouncements();
              } else if (selectedFilter === 'subject') {
                fetchSubjectAnnouncements();
              }
            } catch (e) { Alert.alert('Error', 'Purge failed'); }
          },
        },
      ]
    );
  };

  const parseAttachments = (attachmentsStr: string | undefined): Attachment | null => {
    if (!attachmentsStr) return null;
    try { return JSON.parse(attachmentsStr); } catch { return null; }
  };

  const handleOpenLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  const handleOpenPdf = async (uri: string) => {
    try {
      if (Platform.OS === 'android') {
        // For Android, use IntentLauncher with MIME type to open with available PDF viewer
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: uri,
          flags: 1,
          type: 'application/pdf',
        });
      } else {
        // For iOS and other platforms, use WebBrowser
        await WebBrowser.openBrowserAsync(uri);
      }
    } catch (error) {
      console.error('PDF open error:', error);
      Alert.alert('Error', 'Unable to open PDF. Make sure you have a PDF viewer installed.');
    }
  };

  const handleDownloadImage = async (imageUri: string, imageName?: string) => {
    try {
      // Check if it's a local file URI
      const isLocalFile = imageUri.startsWith('file://');

      // Check if running in Expo Go
      const isExpoGo = __DEV__;

      if (isExpoGo || isLocalFile) {
        // In Expo Go or for local files, show alternative options
        const message = isLocalFile
          ? 'This is a local image file. You can view it in the image viewer but cannot download it directly.'
          : 'Due to Android permission changes, image download is limited in Expo Go. Please:\n\n1. Use a development build for full functionality\n2. Or manually save the image by long-pressing it';

        Alert.alert(
          'Image Access',
          message,
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }

      // Request media library permissions (write only)
      const { status } = await MediaLibrary.requestPermissionsAsync(false);
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permissions to download images.');
        return;
      }

      // Generate a unique filename if not provided
      const fileName = imageName || `announcement_image_${Date.now()}.jpg`;
      // Sanitize filename for file system compatibility
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Use a simple approach with a working cache directory path
      const fileUri = `file:///tmp/${sanitizedFileName}`;

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);

      if (downloadResult.status === 200) {
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('ELearning Downloads', asset, false);

        Alert.alert('Success', 'Image downloaded successfully!');
      } else {
        Alert.alert('Error', 'Failed to download image');
      }
    } catch (error) {
      console.error('Download error:', error);

      // Check if it's a local file URI to avoid WebBrowser error
      const isLocalFile = imageUri.startsWith('file://');

      if (isLocalFile) {
        Alert.alert(
          'Download Error',
          'Unable to download local image file. Local files can only be viewed in the image viewer.',
          [{ text: 'OK', style: 'cancel' }]
        );
      } else {
        // Provide fallback for remote images only
        Alert.alert(
          'Download Error',
          'Unable to download image. This may be due to Expo Go limitations. Consider using a development build for full functionality.',
          [
            { text: 'Open in Browser', onPress: () => WebBrowser.openBrowserAsync(imageUri) },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    }
  };

  const renderAnnouncementItem = (announcement: any, index: number) => {
    const isSchoolWide = announcement.courseId === null;
    const course = !isSchoolWide ? courses.find(c => c.id === announcement.courseId) : null;
    const attachments = parseAttachments(announcement.attachments);

    return (
      <Animated.View
        style={[
          styles.nexusCard,
          { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }] }
        ]}
      >
        <View style={styles.cardIndicator} />
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={styles.badgeWrapper}>
              <View style={[styles.typeBadge, { backgroundColor: isSchoolWide ? '#ecfdf5' : '#eef2ff' }]}>
                <Text style={[styles.typeText, { color: isSchoolWide ? '#059669' : '#4f46e5' }]}>
                  {isSchoolWide ? 'INSTITUTIONAL' : 'COURSE UPDATE'}
                </Text>
              </View>
              <Text style={styles.timeTag}>{format(new Date(announcement.createdAt), 'MMM d, h:mm a')}</Text>
            </View>
            {user?.role === 'teacher' && announcement.teacherId === user.id && (
              <TouchableOpacity onPress={() => handleDeleteAnnouncement(announcement.id.toString(), announcement.title)}>
                <MaterialCommunityIcons name="dots-horizontal" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.anTitle}>{announcement.title}</Text>
          <Text style={styles.anContent} numberOfLines={3}>{announcement.content}</Text>

          {attachments && (
            <View style={styles.nexusAttachments}>
              {attachments.images?.length ? (
                <TouchableOpacity
                  style={styles.mediaPreview}
                  onPress={() => handleImagePress(attachments.images!, 0)}
                >
                  <MaterialCommunityIcons name="image-multiple" size={16} color="#6366f1" />
                  <Text style={styles.mediaLabel}>{attachments.images.length} Insights</Text>
                </TouchableOpacity>
              ) : null}
              {attachments.pdfs?.length ? (
                <TouchableOpacity style={[styles.mediaPreview, { backgroundColor: '#fff1f2' }]} onPress={() => handleOpenPdf(attachments.pdfs![0].uri)}>
                  <MaterialCommunityIcons name="file-pdf-box" size={16} color="#e11d48" />
                  <Text style={[styles.mediaLabel, { color: '#e11d48' }]}>{attachments.pdfs.length} Documents</Text>
                </TouchableOpacity>
              ) : null}
              {attachments.links?.length ? (
                <TouchableOpacity style={[styles.mediaPreview, { backgroundColor: '#f0fdf4' }]} onPress={() => handleOpenLink(attachments.links![0])}>
                  <MaterialCommunityIcons name="link-variant" size={16} color="#16a34a" />
                  <Text style={[styles.mediaLabel, { color: '#16a34a' }]}>{attachments.links.length} Links</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.authorRow}>
              <View style={styles.miniAvatar}>
                <Text style={styles.avatarText}>M</Text>
              </View>
              <Text style={styles.authorName}>{isSchoolWide ? 'Bloom Admin' : course?.title}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
          </View>
        </View>
      </Animated.View>
    );
  };

  const handleImagePress = (images: Array<{ name: string; uri: string }>, index: number) => {
    setCurrentImages(images.map(img => ({ uri: img.uri })));
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  const isStudent = user?.role === 'student';
  const themeColors = (isStudent
    ? ['#06201f', '#064e3b', '#065f46']
    : ['#0f172a', '#1e1b4b', '#312e81']) as readonly [string, string, ...string[]];

  if (isLoading && announcements.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={isStudent ? '#10b981' : '#6366f1'} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={themeColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.nexusHeader}
      >
        <View style={styles.blurMesh}>
          <MaterialCommunityIcons
            name="broadcast"
            size={300}
            color={isStudent ? "rgba(16, 185, 129, 0.05)" : "rgba(99, 102, 241, 0.05)"}
            style={styles.meshIcon}
          />
        </View>
        <View style={styles.headerBody}>
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveText}>LIVE UPDATES</Text>
          </View>
          <Text style={styles.nexusTitle}>Update</Text>
          <Text style={styles.nexusSubtitle}>Intelligent dispatch of system broadcasts</Text>
        </View>
      </LinearGradient>

      <View style={styles.nexusContent}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Filter transmissions..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.nexusSearch}
            placeholderTextColor="#94a3b8"
            iconColor="#6366f1"
            inputStyle={styles.searchText}
          />
        </View>

        <View style={styles.filterHub}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {(['all', 'school', 'subject'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, selectedFilter === filter && styles.activeChip]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.chipText, selectedFilter === filter && styles.activeChipText]}>
                  {filter.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredAnnouncements}
          renderItem={({ item, index }) => renderAnnouncementItem(item, index)}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.scrollList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyNexus}>
              <View style={styles.emptyPulse}>
                <MaterialCommunityIcons name="waveform" size={48} color="#e2e8f0" />
              </View>
              <Text style={styles.emptyTitle}>Log Clear</Text>
              <Text style={styles.emptyDesc}>No background transmissions found.</Text>
            </View>
          }
        />
      </View>

      {
        user?.role === 'teacher' && (
          <TouchableOpacity
            style={styles.transmissionBtn}
            onPress={() => navigation.navigate('CreateAnnouncement')}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              style={styles.btnGradient}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              <Text style={styles.btnText}>NEW DISPATCH</Text>
            </LinearGradient>
          </TouchableOpacity>
        )
      }

      <ImageViewing
        images={currentImages}
        imageIndex={currentImageIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        HeaderComponent={({ imageIndex }: { imageIndex: number }) => (
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity
              style={styles.imageViewerButton}
              onPress={() => setImageViewerVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageViewerButton}
              onPress={() => handleDownloadImage(currentImages[imageIndex]?.uri, `image_${imageIndex + 1}.jpg`)}
            >
              <MaterialCommunityIcons name="download" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  nexusHeader: {
    height: 180,
    paddingTop: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  blurMesh: {
    ...StyleSheet.absoluteFillObject,
  },
  meshIcon: {
    position: 'absolute',
    right: -50,
    top: -30,
  },
  headerBody: {
    zIndex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 2,
  },
  nexusTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  nexusSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  nexusContent: {
    flex: 1,
    marginTop: -25,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  nexusSearch: {
    backgroundColor: '#fff',
    borderRadius: 20,
    height: 52,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  searchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterHub: {
    marginBottom: 20,
  },
  filterList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activeChip: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
  },
  activeChipText: {
    color: '#fff',
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  nexusCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    ...AppShadows.medium,
  },
  cardIndicator: {
    height: 4,
    width: '100%',
    backgroundColor: '#6366f1',
  },
  cardInner: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timeTag: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  anTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 6,
  },
  anContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  nexusAttachments: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  mediaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  mediaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366f1',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  emptyNexus: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyPulse: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
  },
  transmissionBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: '60%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  imageViewerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnnouncementsScreen;
