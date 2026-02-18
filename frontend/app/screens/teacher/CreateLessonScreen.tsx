import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { useCourseStore } from '@/store/courseStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function CreateLessonScreen({ route, navigation }: any) {
  const { courseId, lessonId } = route.params;
  const { createLesson, updateLesson, fetchLessons, getLessonById } = useCourseStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [sequenceNumber, setSequenceNumber] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const isEditing = !!lessonId;

  useEffect(() => {
    if (isEditing) {
      loadLesson();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    setIsFetching(true);
    try {
      const lesson = await getLessonById(lessonId);
      if (lesson) {
        setTitle(lesson.title);
        setDescription(lesson.description || '');
        setContent(lesson.content || '');
        setVideoUrl(lesson.videoUrl || '');
        setFileUrl(lesson.fileUrl || '');
        setSequenceNumber(String(lesson.sequenceNumber || 1));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load lesson details');
      navigation.goBack();
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a lesson title');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        await updateLesson(lessonId, {
          title,
          description,
          content,
          videoUrl,
          fileUrl,
          sequenceNumber: parseInt(sequenceNumber) || 1,
        });
        Alert.alert('Success', 'Lesson updated successfully!');
      } else {
        await createLesson({
          course: courseId,
          title,
          description,
          content,
          video_url: videoUrl,
          file_url: fileUrl,
          sequence_number: parseInt(sequenceNumber) || 1,
        });
        Alert.alert('Success', 'Lesson created successfully!');
      }

      await fetchLessons(courseId);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} lesson`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerDecorationCircle} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name={isEditing ? "pencil" : "plus"} size={16} color="#818cf8" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitleBadge}>{isEditing ? 'EDIT LESSON' : 'NEW LESSON'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <Text style={styles.headerMainTitle}>
          {isEditing ? 'Update Content' : 'Add New Content'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isEditing ? 'Refine your lesson details below' : 'Create engaging material for your students'}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>Basic Information</Text>

          <TextInput
            label="Lesson Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.premiumInput}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="e.g. Introduction to Variables"
            placeholderTextColor="#94a3b8"
            right={<TextInput.Icon icon="format-title" color="#64748b" />}
          />

          <TextInput
            label="Sequence Number"
            value={sequenceNumber}
            onChangeText={setSequenceNumber}
            mode="outlined"
            keyboardType="numeric"
            style={styles.premiumInput}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="Order in course (e.g. 1)"
            right={<TextInput.Icon icon="sort-numeric-ascending" color="#64748b" />}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.premiumInput, { height: 100, textAlignVertical: 'top' }]}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="Brief overview of this lesson..."
            right={<TextInput.Icon icon="text-short" color="#64748b" style={{ marginTop: 8 }} />}
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>Content & Media</Text>

          <TextInput
            label="Text Content"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.premiumInput, { height: 100, textAlignVertical: 'top' }]}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="Write your lesson content here..."
            right={<TextInput.Icon icon="file-document-edit-outline" color="#64748b" style={{ marginTop: 8 }} />}
          />

          <View style={styles.divider} />

          <TextInput
            label="Video URL (Optional)"
            value={videoUrl}
            onChangeText={setVideoUrl}
            mode="outlined"
            style={styles.premiumInput}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="https://youtube.com/..."
            right={<TextInput.Icon icon="video" color="#64748b" />}
          />

          <TextInput
            label="File/Resource URL (Optional)"
            value={fileUrl}
            onChangeText={setFileUrl}
            mode="outlined"
            style={styles.premiumInput}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="Link to PDF or resource"
            right={<TextInput.Icon icon="paperclip" color="#64748b" />}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
          style={styles.submitButtonContainer}
        >
          <LinearGradient
            colors={['#4338ca', '#3730a3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Save Changes' : 'Create Lesson'}
                </Text>
                <MaterialCommunityIcons name={isEditing ? "content-save-outline" : "arrow-right"} size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  premiumHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 8,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  headerDecorationCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e0e7ff',
    letterSpacing: 1,
  },
  headerMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1, // Tighter for large text
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
    marginTop: -20, // Negative margin to overlap
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 3,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  premiumInput: {
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#4338ca',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CreateLessonScreen;
