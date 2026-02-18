import { useAuthStore } from '@/store/authStore';
import { Course, useCourseStore } from '@/store/courseStore';
import { useLiveClassStore } from '@/store/liveClassStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import {
  Button,
  Card,
  Snackbar,
  Text,
  TextInput
} from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function CreateLiveClassScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { courses, fetchTeacherCourses } = useCourseStore();
  const { createLiveClass, isLoading } = useLiveClassStore();

  if (!user?.id) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Please log in to create live classes</Text>
      </View>
    );
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [scheduledStartTime, setScheduledStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseMenuVisible, setCourseMenuVisible] = useState(false);
  const courseButtonRef = useRef(null);

  useEffect(() => {
    loadTeacherCourses();
  }, [user?.id]);

  const loadTeacherCourses = async () => {
    if (user?.id) {
      try {
        await fetchTeacherCourses(user.id);
      } catch (error) {
        console.error('Error loading courses:', error);
        showSnackbar(error instanceof Error ? error.message : 'Failed to load courses');
      } finally {
        setCoursesLoading(false);
      }
    } else {
      setCoursesLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const generateRoomId = () => {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(scheduledStartTime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setScheduledStartTime(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newTime = new Date(scheduledStartTime);
      newTime.setHours(selectedTime.getHours());
      newTime.setMinutes(selectedTime.getMinutes());
      setScheduledStartTime(newTime);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      showSnackbar('Please enter a class title');
      return false;
    }
    if (!selectedCourse) {
      showSnackbar('Please select a course');
      return false;
    }
    if (scheduledStartTime <= new Date()) {
      showSnackbar('Scheduled time must be in the future');
      return false;
    }
    if (maxParticipants && (isNaN(parseInt(maxParticipants)) || parseInt(maxParticipants) <= 0)) {
      showSnackbar('Maximum participants must be a positive number');
      return false;
    }
    return true;
  };

  const handleCreateLiveClass = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      const roomId = generateRoomId();
      await createLiveClass({
        course: selectedCourse!.id,
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_start_time: scheduledStartTime.toISOString(),
        max_participants: maxParticipants && !isNaN(parseInt(maxParticipants)) ? parseInt(maxParticipants) : undefined,
      });

      showSnackbar('Live class created successfully!');
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error creating live class:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to create live class');
    }
  };

  if (coursesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4338ca" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1e1b4b', '#312e81', '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grandHeader}
      >
        <View style={styles.headerCircleSmall} />
        <View style={styles.headerCircleBig} />

        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Schedule</Text>
            <Text style={styles.greetingSub}>Live Class</Text>
          </View>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="calendar-clock" size={56} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.mainCard}>

          {/* Title Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>CLASS DETAILS</Text>
            <TextInput
              mode="flat"
              label="Class Title"
              value={title}
              onChangeText={setTitle}
              style={styles.modernInput}
              underlineColor="transparent"
              activeUnderlineColor="#4338ca"
              textColor="#1e293b"
              placeholder="e.g. Advanced Physics - Chapter 4"
              placeholderTextColor="#94a3b8"
              left={<TextInput.Icon icon="format-title" color="#64748b" />}
            />

            <TextInput
              mode="flat"
              label="Description / Agenda"
              value={description}
              onChangeText={setDescription}
              style={[styles.modernInput, { minHeight: 80, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={3}
              underlineColor="transparent"
              activeUnderlineColor="#4338ca"
              textColor="#1e293b"
              placeholder="What will represent this session?"
              left={<TextInput.Icon icon="text-short" color="#64748b" style={{ marginTop: 8 }} />}
            />
          </View>

          {/* Course Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>ASSIGN COURSE</Text>
            {courses.length > 0 ? (
              <View>
                <TouchableOpacity
                  onPress={() => setCourseMenuVisible(!courseMenuVisible)}
                  style={styles.courseSelector}
                  activeOpacity={0.8}
                >
                  <View style={styles.courseSelectorContent}>
                    <View style={[styles.courseIcon, selectedCourse ? { backgroundColor: '#4338ca' } : {}]}>
                      <MaterialCommunityIcons name="book-education-outline" size={24} color={selectedCourse ? '#fff' : '#64748b'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseSelectorLabel}>
                        {selectedCourse?.title || 'Select a Course'}
                      </Text>
                      {selectedCourse && <Text style={styles.courseSelectorSub}>Selected Course</Text>}
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={24} color="#64748b" />
                  </View>
                </TouchableOpacity>

                {courseMenuVisible && (
                  <View style={styles.courseMenu}>
                    {courses.map((course) => (
                      <TouchableOpacity
                        key={course.id}
                        style={styles.courseMenuItem}
                        onPress={() => {
                          setSelectedCourse(course);
                          setCourseMenuVisible(false);
                        }}
                      >
                        <Text style={[styles.courseMenuItemText, selectedCourse?.id === course.id && styles.courseMenuItemTextActive]}>
                          {course.title}
                        </Text>
                        {selectedCourse?.id === course.id && <MaterialCommunityIcons name="check" size={20} color="#4338ca" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyCourseBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#854d0e" />
                <Text style={styles.emptyCourseText}>No active courses found.</Text>
              </View>
            )}
          </View>

          {/* Schedule Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>DATE & TIME</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.timeCard}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.timeCardIcon}>
                  <MaterialCommunityIcons name="calendar-month" size={22} color="#4338ca" />
                </View>
                <View>
                  <Text style={styles.timeCardLabel}>Date</Text>
                  <Text style={styles.timeCardValue}>{scheduledStartTime.toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeCard}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.timeCardIcon}>
                  <MaterialCommunityIcons name="clock-outline" size={22} color="#4338ca" />
                </View>
                <View>
                  <Text style={styles.timeCardLabel}>Time</Text>
                  <Text style={styles.timeCardValue}>{scheduledStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={scheduledStartTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={scheduledStartTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}

          <View style={{ height: 20 }} />

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={handleCreateLiveClass}
            disabled={isLoading || courses.length === 0}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4338ca', '#3730a3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Schedule Class</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: '#1e293b' }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  grandHeader: {
    height: 280,
    paddingTop: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircleSmall: {
    position: 'absolute',
    top: -20,
    right: 60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCircleBig: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 14,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  greeting: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  greetingSub: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 38,
  },
  headerIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 16,
    transform: [{ rotate: '-10deg' }]
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    marginHorizontal: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#64748b',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 12,
    letterSpacing: 1,
  },
  modernInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    fontSize: 16,
  },
  courseSelector: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  courseSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  courseSelectorSub: {
    fontSize: 13,
    color: '#64748b',
  },
  courseMenu: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  courseMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  courseMenuItemText: {
    fontSize: 15,
    color: '#475569',
  },
  courseMenuItemTextActive: {
    color: '#4338ca',
    fontWeight: '600',
  },
  emptyCourseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  emptyCourseText: {
    color: '#854d0e',
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  timeCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCardLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  timeCardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#4338ca',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelLink: {
    alignItems: 'center',
    padding: 16,
    marginTop: 4,
  },
  cancelLinkText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  }
});
