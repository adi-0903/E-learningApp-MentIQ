import { useAnnouncementStore } from '@/store/announcementStore';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Button, Chip, Text, TextInput, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

function CreateAnnouncementScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  const { createAnnouncement, updateAnnouncement, fetchAllAnnouncements } = useAnnouncementStore();
  const { courses, fetchTeacherCourses } = useCourseStore();

  const mode = route.params?.mode || 'create';
  const announcementId = route.params?.announcementId;
  const initialData = route.params?.initialData;

  // Check if user is authenticated
  if (!user?.id) {
    return (
      <View style={styles.centerContainer}>
        <Text>Please log in to create announcements</Text>
      </View>
    );
  }

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [announcementType, setAnnouncementType] = useState<'school' | 'subject'>('school');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [pdfs, setPdfs] = useState<{ name: string; uri: string }[]>([]);
  const [images, setImages] = useState<{ name: string; uri: string }[]>([]);
  const [newLink, setNewLink] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);

  // Load teacher's courses on component mount
  useEffect(() => {
    if (user?.id) {
      fetchTeacherCourses(user.id).catch(error => {
        console.error('Error fetching teacher courses:', error);
        Alert.alert('Error', 'Failed to load your courses. Please try again.');
      });
    }
  }, [user?.id]);

  // Update selected course when courses change
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const addLink = () => {
    if (!newLink.trim()) {
      Alert.alert('Error', 'Please enter a valid link');
      return;
    }
    // Check if it's a PDF link
    if (newLink.toLowerCase().endsWith('.pdf')) {
      const fileName = newLink.split('/').pop()?.split('?')[0] || `PDF_${Date.now()}`;
      setPdfs(prevPdfs => [...prevPdfs, { name: fileName, uri: newLink }]);
    } else {
      setLinks(prevLinks => [...prevLinks, newLink]);
    }
    setNewLink('');
  };

  const removeLink = (index: number) => {
    setLinks(prevLinks => prevLinks.filter((_, i) => i !== index));
  };

  const removePdfLink = (index: number) => {
    setPdfs(prevPdfs => prevPdfs.filter((_, i) => i !== index));
  };

  const handlePreviewPdf = (uri: string) => {
    setPreviewUri(uri);
    setPreviewType('pdf');
  };

  const handlePreviewImage = (uri: string) => {
    setPreviewUri(uri);
    setPreviewType('image');
  };

  const closePreview = () => {
    setPreviewUri(null);
    setPreviewType(null);
  };

  const openPdfInApp = async () => {
    if (!previewUri) return;
    try {
      if (Platform.OS === 'android') {
        // For Android, use the file URI directly
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: previewUri,
          flags: 1,
        });
      } else if (Platform.OS === 'ios') {
        // For iOS, try to open with default PDF viewer
        await WebBrowser.openBrowserAsync(previewUri);
      } else {
        // For web, open in browser
        await WebBrowser.openBrowserAsync(previewUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open PDF. Make sure you have a PDF viewer installed.');
    }
  };


  const pickImageFile = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library in settings to pick images.'
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      // Check if user cancelled
      if (result.canceled) {
        return;
      }

      // Get the selected image
      if (result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        const fileName = image.uri.split('/').pop() || `Image_${Date.now()}`;
        setImages(prevImages => [...prevImages, { name: fileName, uri: image.uri }]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleSaveAnnouncement = async () => {
    // Validate user authentication
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create announcements');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an announcement title');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter announcement content');
      return;
    }
    if (mode === 'create' && announcementType === 'subject' && !selectedCourseId) {
      Alert.alert('Error', 'Please select a subject for this announcement');
      return;
    }

    try {
      setIsLoading(true);

      if (mode === 'edit') {
        const updates: any = { title, content };
        // If adding new attachments during edit, user needs to understand they replace old ones or append depending on backend logic.
        // For simplicity in this iteration, we focus on Title/Content updates as requested by user flow.
        // Attachments update would require more complex UI state management to show existing vs new.

        await updateAnnouncement(announcementId, updates);
        Alert.alert('Success', 'Announcement updated successfully!');
      } else {
        const attachments = {
          links: links.length > 0 ? links : undefined,
          pdfs: pdfs.length > 0 ? pdfs : undefined,
          images: images.length > 0 ? images : undefined,
        };

        await createAnnouncement({
          title,
          content,
          course: announcementType === 'subject' && selectedCourseId ? selectedCourseId : null,
          attachments: Object.keys(attachments).some(key => attachments[key as keyof typeof attachments]) ? attachments : undefined,
        });
        Alert.alert('Success', 'Announcement broadcasted successfully!');
      }

      // Refresh the announcements list to show the new announcement
      await fetchAllAnnouncements();

      // Navigate back
      navigation.goBack();

    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save announcement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={styles.meshBackground}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ultra-Premium Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#020617', '#0f172a', '#1e293b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Artistic Glass Elements */}
            <View style={styles.glassCircle1} />
            <View style={styles.glassCircle2} />

            <View style={styles.headerTopRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <View style={styles.backButtonGlass}>
                  <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={styles.headerTitleGroup}>
                <Text style={styles.premiumTitle}>Broadcast Center</Text>
                <Text style={styles.premiumLabel}>Teacher's Executive Hub</Text>
              </View>

              <View style={styles.broadcastStatus}>
                <View style={styles.statusPulse} />
                <MaterialCommunityIcons name="broadcast" size={24} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {/* Audience Selection - Unified Box */}
          <View style={styles.section}>
            <View style={styles.sectionAccent} />

            {/* Type Part */}
            <View style={styles.subSection}>
              <Text style={styles.sectionTitle}>Target Audience</Text>
              <View style={styles.customSegmentContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAnnouncementType('school')}
                  style={[
                    styles.audienceOption,
                    announcementType === 'school' && styles.audienceOptionActive
                  ]}
                >
                  <MaterialCommunityIcons
                    name="home-city-outline"
                    size={20}
                    color={announcementType === 'school' ? '#4f46e5' : '#64748b'}
                  />
                  <Text style={[
                    styles.audienceOptionText,
                    announcementType === 'school' && styles.audienceOptionTextActive
                  ]}>School-wide</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAnnouncementType('subject')}
                  style={[
                    styles.audienceOption,
                    announcementType === 'subject' && styles.audienceOptionActive
                  ]}
                >
                  <MaterialCommunityIcons
                    name="book-outline"
                    size={20}
                    color={announcementType === 'subject' ? '#4f46e5' : '#64748b'}
                  />
                  <Text style={[
                    styles.audienceOptionText,
                    announcementType === 'subject' && styles.audienceOptionTextActive
                  ]}>Subject-specific</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Subject Selection Part (Conditional inside same box) */}
            {announcementType === 'subject' && courses.length > 0 && (
              <>
                <View style={[styles.boxDivider, { marginVertical: 20 }]} />
                <View style={styles.subSection}>
                  <Text style={[styles.sectionTitle, { fontSize: 13, color: '#64748b' }]}>Target Subject</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.subjectScroll}
                  >
                    {courses.map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        onPress={() => setSelectedCourseId(course.id)}
                        style={[
                          styles.subjectChip,
                          selectedCourseId === course.id && styles.subjectChipActive,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={selectedCourseId === course.id ? "check-circle" : "book-open-page-variant"}
                          size={16}
                          color={selectedCourseId === course.id ? '#4f46e5' : '#64748b'}
                        />
                        <Text
                          style={[
                            styles.subjectChipText,
                            selectedCourseId === course.id && styles.subjectChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {course.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </View>

          {/* Announcement Hub - Unified Box */}
          <View style={styles.section}>
            <View style={styles.sectionAccent} />

            {/* Title Part */}
            <View style={styles.subSection}>
              <Text style={styles.sectionTitle}>Announcement Details</Text>
              <TextInput
                label="Campaign Title"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4f46e5"
                left={<TextInput.Icon icon="format-title" color="#4f46e5" />}
                maxLength={100}
                placeholder="e.g., Important Notice"
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            <View style={styles.boxDivider} />

            {/* Content Part */}
            <View style={[styles.subSection, { paddingTop: 12 }]}>
              <TextInput
                label="Detailed Description"
                value={content}
                onChangeText={setContent}
                mode="outlined"
                style={[styles.input, styles.contentInput]}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4f46e5"
                multiline
                numberOfLines={6}
                maxLength={6000}
                placeholder="Write your announcement message here..."
              />
              <Text style={styles.charCount}>{content.length}/6000</Text>
            </View>
          </View>

          {/* Attachments Section - Unified Box */}
          <View style={styles.section}>
            <View style={styles.sectionAccent} />

            {/* Links Part */}
            <View style={styles.subSection}>
              <Text style={styles.sectionTitle}>📎 Attachments & Media</Text>
              <Text style={styles.linkHint}>Add important resources (Web, PDF)</Text>
              <View style={styles.attachmentInputContainer}>
                <TextInput
                  label="Document URL"
                  value={newLink}
                  onChangeText={setNewLink}
                  mode="outlined"
                  style={styles.attachmentInput}
                  outlineColor="transparent"
                  activeOutlineColor="#4f46e5"
                  placeholder="https://example.com"
                />
                <TouchableOpacity
                  onPress={addLink}
                  style={styles.addIconBtn}
                >
                  <LinearGradient
                    colors={['#4f46e5', '#4338ca']}
                    style={styles.addIconGradient}
                  >
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {(links.length > 0 || pdfs.length > 0) && (
                <View style={styles.chipContainer}>
                  {links.map((link, index) => (
                    <Chip
                      key={`link-${index}`}
                      icon="link"
                      onClose={() => removeLink(index)}
                      style={styles.attachmentChip}
                      textStyle={styles.chipText}
                    >
                      Link {index + 1}
                    </Chip>
                  ))}
                  {pdfs.map((pdf, index) => {
                    const shortName = pdf.name.length > 20 ? pdf.name.substring(0, 17) + '...' : pdf.name;
                    return (
                      <Chip
                        key={`pdf-${index}`}
                        icon="file-pdf-box"
                        onClose={() => removePdfLink(index)}
                        style={styles.attachmentChip}
                        textStyle={styles.chipText}
                      >
                        {shortName}
                      </Chip>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={[styles.boxDivider, { marginVertical: 14 }]} />

            {/* Images Part */}
            <View style={styles.subSection}>
              <Text style={[styles.sectionTitle, { fontSize: 12, color: '#64748b', marginBottom: 10 }]}>Gallery / Visual Aids</Text>
              <Button
                mode="contained"
                onPress={pickImageFile}
                style={styles.uploadButton}
                labelStyle={styles.uploadButtonLabel}
                icon="image-plus"
              >
                Choose Image File
              </Button>
              {images.length > 0 && (
                <View style={[styles.chipContainer, { marginTop: 12 }]}>
                  {images.map((image, index) => {
                    const shortName = image.name.length > 20 ? image.name.substring(0, 17) + '...' : image.name;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handlePreviewImage(image.uri)}
                        style={[styles.attachmentChip, styles.imageChip]}
                      >
                        <View style={styles.chipContent}>
                          <MaterialCommunityIcons name="image" size={16} color="#4f46e5" />
                          <Text style={styles.chipText} numberOfLines={1}>{shortName}</Text>
                          <TouchableOpacity onPress={() => removeImage(index)} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={16} color="#4f46e5" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              labelStyle={styles.buttonLabel}
            >
              Cancel
            </Button>
            <TouchableOpacity
              onPress={handleSaveAnnouncement}
              disabled={isLoading}
              activeOpacity={0.8}
              style={[styles.submitButtonContainer, isLoading && { opacity: 0.7 }]}
            >
              <LinearGradient
                colors={['#6366f1', '#4f46e5', '#4338ca']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="broadcast" size={22} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.submitButtonLabel}>{mode === 'edit' ? 'Update Broadcast' : 'Broadcast Now'}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Image Preview Card - Inside App */}
      {previewUri && previewType === 'image' && (
        <View style={styles.imagePreviewCard}>
          <View style={styles.previewCardHeader}>
            <Text style={styles.previewCardTitle}>Image Preview</Text>
            <TouchableOpacity onPress={closePreview} style={styles.previewCardClose}>
              <MaterialCommunityIcons name="close" size={24} color="#4f46e5" />
            </TouchableOpacity>
          </View>
          <Image source={{ uri: previewUri }} style={styles.previewImageInCard} />
        </View>
      )}

      {previewUri && previewType === 'pdf' && (
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewBackdrop} onPress={closePreview} />
          <View style={styles.previewContainer}>
            <TouchableOpacity style={styles.previewClose} onPress={closePreview}>
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pdfPreview} onPress={openPdfInApp}>
              <MaterialCommunityIcons name="file-pdf-box" size={80} color="#ff9800" />
              <Text style={styles.pdfPreviewText}>PDF Preview</Text>
              <Text style={styles.pdfPreviewSubtext}>Tap to open in external viewer</Text>
              <View style={styles.openButton}>
                <MaterialCommunityIcons name="open-in-app" size={20} color="#fff" />
                <Text style={styles.openButtonText}>Open PDF</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  meshBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#020617',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  headerGradient: {
    paddingTop: 70,
    paddingBottom: 44,
    paddingHorizontal: 26,
    position: 'relative',
  },
  glassCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
  },
  glassCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  backButton: {
    zIndex: 10,
  },
  backButtonGlass: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.8,
  },
  premiumLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  broadcastStatus: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
  },
  statusPulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    top: 8,
    right: 8,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    elevation: 4,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#020617',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  subSection: {
    width: '100%',
  },
  boxDivider: {
    height: 1.5,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  sectionAccent: {
    position: 'absolute',
    top: 0,
    left: 30,
    width: 44,
    height: 5,
    backgroundColor: '#4f46e5',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  customSegmentContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  audienceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  audienceOptionActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#4f46e5',
  },
  audienceOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  audienceOptionTextActive: {
    color: '#4f46e5',
  },
  subjectScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginRight: 10,
  },
  subjectChipActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#4f46e5',
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  subjectChipTextActive: {
    color: '#4f46e5',
  },
  input: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: 18,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 16,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '600',
  },
  linkHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    elevation: 2,
    marginBottom: 24,
  },
  infoCardContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1.2,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  submitButtonContainer: {
    flex: 2.8,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
  },
  submitButtonLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  attachmentInputContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  attachmentInput: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 54,
  },
  addIconBtn: {
    width: 44,
    height: 44,
  },
  addIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#f8fafc',
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 4,
  },
  cancelSmallButton: {
    borderColor: '#ddd',
    borderWidth: 1,
    flex: 0.8,
  },
  cancelSmallLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
    marginTop: 18,
    paddingHorizontal: 0,
  },
  attachmentChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(79, 70, 229, 0.15)',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  pdfChip: {
    backgroundColor: '#fffbeb',
    borderColor: '#fbbf24',
  },
  imageChip: {
    backgroundColor: '#f5f3ff',
    borderColor: '#818cf8',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    maxWidth: 160,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closeButton: {
    padding: 4,
    marginLeft: 4,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '80%',
    zIndex: 1001,
    position: 'relative',
  },
  previewClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1002,
    padding: 8,
  },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  pdfPreview: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  pdfPreviewText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  pdfPreviewSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  openButton: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  imagePreviewCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 999,
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  previewCardClose: {
    padding: 4,
  },
  previewImageInCard: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f8f9fa',
  },
});

export default CreateAnnouncementScreen;
