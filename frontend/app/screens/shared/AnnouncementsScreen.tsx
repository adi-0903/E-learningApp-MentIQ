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
import * as Sharing from 'expo-sharing';
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

  const handleActionSheet = (announcement: any) => {
    Alert.alert(
      'Announcement Options',
      `Manage "${announcement.title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit Update',
          onPress: () => {
            navigation.navigate('CreateAnnouncement', {
              mode: 'edit',
              announcementId: announcement.id,
              initialData: {
                title: announcement.title,
                content: announcement.content,
                // Note: Attachments logic would be complex to restore fully here without API change
              }
            });
          }
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => confirmDelete(announcement.id.toString(), announcement.title),
        },
      ]
    );
  };

  const confirmDelete = (announcementId: string, title: string) => {
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

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permissions to download images.');
        return;
      }

      // Create a valid file path in the document directory
      const fileName = imageName ? imageName.replace(/[^a-zA-Z0-9._-]/g, '_') : `image_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Download the file
      const downloadRes = await FileSystem.downloadAsync(imageUri, fileUri);

      if (downloadRes.status === 200) {
        try {
          // Try to save directly to gallery
          const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
          // Album creation is optional and might fail on some Android versions in Expo Go
          await MediaLibrary.createAlbumAsync('Download', asset, false).catch(() => { });
          Alert.alert('Saved!', 'Image saved to your gallery.');
        } catch (saveError) {
          console.log('MediaLibrary save failed, falling back to share:', saveError);
          // Fallback: Open system share sheet so user can "Save to Files" or "Photos"
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadRes.uri);
          } else {
            Alert.alert('Saved', 'Image downloaded to local app storage.');
          }
        }
      } else {
        throw new Error('Download failed');
      }

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Issue',
        'Could not save automatically. Opening options...',
        [
          {
            text: 'Share/Save',
            onPress: async () => {
              // Try to download blindly and share if original flow failed
              try {
                const tmpUri = FileSystem.cacheDirectory + 'temp_download.jpg';
                await FileSystem.downloadAsync(imageUri, tmpUri);
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(tmpUri);
                }
              } catch (e) {
                WebBrowser.openBrowserAsync(imageUri);
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderAnnouncementItem = (announcement: any, index: number) => {
    const isSchoolWide = announcement.courseId === null;
    const course = !isSchoolWide ? courses.find(c => c.id === announcement.courseId) : null;
    const attachments = parseAttachments(announcement.attachments);
    const isExpanded = expandedIds.has(announcement.id.toString());

    return (
      <Animated.View
        style={[
          styles.nexusCard,
          { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }] }
        ]}
      >
        <TouchableOpacity activeOpacity={0.95} onPress={() => toggleExpand(announcement.id.toString())}>
          <LinearGradient
            colors={isSchoolWide ? ['#10b981', '#34d399'] : ['#6366f1', '#818cf8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardGradientStrip}
          />

          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <View style={[styles.typeBadge, { backgroundColor: isSchoolWide ? '#ecfdf5' : '#eef2ff' }]}>
                <Text style={[styles.typeText, { color: isSchoolWide ? '#059669' : '#4f46e5' }]}>
                  {isSchoolWide ? 'INSTITUTIONAL' : 'COURSE UPDATE'}
                </Text>
              </View>
              <Text style={styles.timeTag}>{format(new Date(announcement.createdAt), 'MMM d, h:mm a')}</Text>

              {announcement.isAuthor && (
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleActionSheet(announcement);
                  }}>
                  <MaterialCommunityIcons name="dots-horizontal" size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.anTitle}>{announcement.title}</Text>

            {isExpanded && (
              <View style={styles.expandedContent}>
                <Text style={styles.anContent}>{announcement.content}</Text>

                {attachments && (
                  <View style={styles.expandedAttachments}>
                    {attachments.images?.map((img, idx) => (
                      <TouchableOpacity
                        key={`img-${idx}`}
                        style={styles.attachmentRow}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleImagePress(attachments.images!, idx);
                        }}
                      >
                        <View style={[styles.attIconBox, { backgroundColor: '#e0e7ff' }]}>
                          <MaterialCommunityIcons name="image-outline" size={22} color="#4f46e5" />
                        </View>
                        <View style={styles.attInfo}>
                          <Text style={styles.attTitle}>Image Attachment</Text>
                          <Text style={styles.attSubtitle}>Click to view</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
                      </TouchableOpacity>
                    ))}

                    {attachments.pdfs?.map((pdf, idx) => (
                      <TouchableOpacity
                        key={`pdf-${idx}`}
                        style={styles.attachmentRow}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenPdf(pdf.uri);
                        }}
                      >
                        <View style={[styles.attIconBox, { backgroundColor: '#ffe4e6' }]}>
                          <MaterialCommunityIcons name="file-pdf-box" size={22} color="#e11d48" />
                        </View>
                        <View style={styles.attInfo}>
                          <Text style={styles.attTitle}>{pdf.name || `Document ${idx + 1}`}</Text>
                          <Text style={styles.attSubtitle}>PDF Document</Text>
                        </View>
                        <MaterialCommunityIcons name="download-outline" size={20} color="#cbd5e1" />
                      </TouchableOpacity>
                    ))}

                    {attachments.links?.map((link, idx) => (
                      <TouchableOpacity
                        key={`link-${idx}`}
                        style={styles.attachmentRow}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenLink(link);
                        }}
                      >
                        <View style={[styles.attIconBox, { backgroundColor: '#dcfce7' }]}>
                          <MaterialCommunityIcons name="link-variant" size={22} color="#16a34a" />
                        </View>
                        <View style={styles.attInfo}>
                          <Text style={styles.attTitle} numberOfLines={1}>{link}</Text>
                          <Text style={styles.attSubtitle}>External Link</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={18} color="#cbd5e1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.authorRow}>
                    <LinearGradient
                      colors={['#f1f5f9', '#e2e8f0']}
                      style={styles.miniAvatar}
                    >
                      <Text style={styles.avatarText}>
                        {isSchoolWide ? 'A' : (course?.title.charAt(0) || 'C')}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.authorLabel}>Posted by</Text>
                      <Text style={styles.authorName}>{isSchoolWide ? 'Administration' : course?.title}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.expandToggle}>
              <MaterialCommunityIcons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={24}
                color={isExpanded ? "#6366f1" : "#cbd5e1"}
              />
            </View>
          </View>
        </TouchableOpacity>
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

      {(user?.role === 'teacher') && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.transmissionBtn}
          onPress={() => navigation.navigate('CreateAnnouncement')}
        >
          <LinearGradient
            colors={['#4f46e5', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#fff" />
            <Text style={styles.btnText}>New Dispatch</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

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
    height: 220,
    paddingTop: 70,
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
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 1)',
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardGradientStrip: {
    height: 6,
    width: '100%',
  },
  cardInner: {
    padding: 20,
    paddingTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeTag: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  moreBtn: {
    padding: 4,
    marginRight: -4,
  },
  anTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  expandedContent: {
    marginTop: 12,
  },
  anContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 16,
  },
  expandedAttachments: {
    gap: 12,
    marginBottom: 20,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  attIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attInfo: {
    flex: 1,
  },
  attTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  attSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  authorLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  expandToggle: {
    alignItems: 'center',
    marginTop: 12,
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
    bottom: 24,
    alignSelf: 'center',
    width: 160,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Keep required legacy styles but they may be unused if all migrated
  nexusAttachments: { display: 'none' },
  mediaPreview: { display: 'none' },
  mediaLabel: { display: 'none' },
  cardIndicator: { display: 'none' },
});

export default AnnouncementsScreen;
