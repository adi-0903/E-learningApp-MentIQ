import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

const CATEGORY_OPTIONS = [
  { label: 'Technology', value: 'technology' },
  { label: 'Business', value: 'business' },
  { label: 'Art', value: 'art' },
  { label: 'Science', value: 'science' },
];

const LEVEL_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'All Levels', value: 'all_levels' },
];

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  title: string;
}

function PickerModal({ visible, onClose, options, selectedValue, onSelect, title }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                selectedValue === option.value && styles.modalOptionSelected,
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selectedValue === option.value && styles.modalOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {selectedValue === option.value && (
                <MaterialCommunityIcons name="check-circle" size={22} color="#4338ca" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function CreateCourseScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { createCourse, fetchTeacherCourses } = useCourseStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  const getCategoryLabel = () => CATEGORY_OPTIONS.find(o => o.value === category)?.label || '';
  const getLevelLabel = () => LEVEL_OPTIONS.find(o => o.value === level)?.label || '';

  const handleCreateCourse = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!level) {
      Alert.alert('Error', 'Please select a level');
      return;
    }

    if (!user?.id) return;

    setIsLoading(true);
    try {
      await createCourse({
        title,
        description,
        category,
        level,
        duration,
        is_published: isPublished,
      });

      await fetchTeacherCourses(user.id);
      Alert.alert('Success', 'Course created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create course. ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
            <MaterialCommunityIcons name="feather" size={24} color="#818cf8" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Course Studio</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <Text style={styles.headerSubtitle}>Craft your next masterpiece</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>Course Essentials</Text>

          <TextInput
            label="Course Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.premiumInput}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="e.g. Advanced React Patterns"
            placeholderTextColor="#94a3b8"
            right={<TextInput.Icon icon="format-title" color="#64748b" />}
          />

          {/* Category Dropdown */}
          <TouchableOpacity onPress={() => setShowCategoryPicker(true)} activeOpacity={0.7}>
            <View pointerEvents="none">
              <TextInput
                label="Category"
                value={getCategoryLabel()}
                mode="outlined"
                style={styles.premiumInput}
                outlineColor="#cbd5e1"
                activeOutlineColor="#4338ca"
                textColor="#0f172a"
                placeholder="Select a category"
                placeholderTextColor="#94a3b8"
                editable={false}
                right={<TextInput.Icon icon="chevron-down" color="#64748b" />}
              />
            </View>
          </TouchableOpacity>

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.premiumInput, { height: 120, textAlignVertical: 'top' }]}
            outlineColor="#cbd5e1"
            activeOutlineColor="#4338ca"
            textColor="#0f172a"
            placeholder="Describe what students will learn..."
            right={<TextInput.Icon icon="text" color="#64748b" style={{ marginTop: 8 }} />}
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>Course Details</Text>
          <View style={styles.row}>
            {/* Level Dropdown */}
            <TouchableOpacity onPress={() => setShowLevelPicker(true)} activeOpacity={0.7} style={{ flex: 1 }}>
              <View pointerEvents="none">
                <TextInput
                  label="Level"
                  value={getLevelLabel()}
                  mode="outlined"
                  style={styles.premiumInput}
                  outlineColor="#cbd5e1"
                  activeOutlineColor="#4338ca"
                  textColor="#0f172a"
                  placeholder="Select level"
                  placeholderTextColor="#94a3b8"
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" color="#64748b" />}
                />
              </View>
            </TouchableOpacity>
            <TextInput
              label="Duration"
              value={duration}
              onChangeText={setDuration}
              mode="outlined"
              style={[styles.premiumInput, { flex: 1 }]}
              outlineColor="#cbd5e1"
              activeOutlineColor="#4338ca"
              textColor="#0f172a"
              placeholder="e.g. 4 Weeks"
              right={<TextInput.Icon icon="clock-outline" color="#64748b" />}
            />
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleIconContainer}>
              <MaterialCommunityIcons name={isPublished ? "eye-check-outline" : "eye-off-outline"} size={24} color={isPublished ? "#4338ca" : "#64748b"} />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Publish Immediately</Text>
              <Text style={styles.toggleDescription}>
                {isPublished ? 'Course will be visible to students instantly' : 'Course will be saved as a draft'}
              </Text>
            </View>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: '#cbd5e1', true: '#818cf8' }}
              thumbColor={isPublished ? '#4338ca' : '#f1f5f9'}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreateCourse}
          disabled={isLoading}
          activeOpacity={0.8}
          style={styles.submitButtonContainer}
        >
          <LinearGradient
            colors={['#4338ca', '#3730a3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.createButtonText}>
                  {isPublished ? 'Publish Course' : 'Save Draft'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Picker Modal */}
      <PickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        options={CATEGORY_OPTIONS}
        selectedValue={category}
        onSelect={setCategory}
        title="Select Category"
      />

      {/* Level Picker Modal */}
      <PickerModal
        visible={showLevelPicker}
        onClose={() => setShowLevelPicker(false)}
        options={LEVEL_OPTIONS}
        selectedValue={level}
        onSelect={setLevel}
        title="Select Level"
      />
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
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    boxShadow: '0 8px 16px rgba(30, 58, 138, 0.25)',
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
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 2px 8px rgba(100, 116, 139, 0.05)',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  premiumInput: {
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 12px rgba(67, 56, 202, 0.4)',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: '#f8fafc',
  },
  modalOptionSelected: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  modalOptionTextSelected: {
    color: '#4338ca',
    fontWeight: '700',
  },
});

export default CreateCourseScreen;
