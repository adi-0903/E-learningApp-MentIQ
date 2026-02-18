import { useQuizStore, Quiz, QuizQuestion } from '@/store/quizStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, StatusBar, ActivityIndicator } from 'react-native';
import { Button, Card, Text, TextInput, Divider, Switch } from 'react-native-paper';

function CreateQuizScreen({ route, navigation }: any) {
  const { courseId, quizId } = route.params;
  const { createQuiz, updateQuiz, fetchCourseQuizzes, getQuizById, fetchQuizQuestions, quizQuestions, addQuestion } = useQuizStore();

  const isEditing = !!quizId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passedScoreInput, setPassedScoreInput] = useState('70');
  const [timeLimitInput, setTimeLimitInput] = useState('30'); // Default 30 mins

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Question Management State
  const [localQuestions, setLocalQuestions] = useState<any[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // New Question Form State
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrectLetter, setNewQCorrectLetter] = useState('a');

  useEffect(() => {
    if (isEditing) {
      loadQuizDetails();
    }
  }, [quizId]);

  const loadQuizDetails = async () => {
    setIsFetching(true);
    try {
      const quiz = await getQuizById(quizId);
      if (quiz) {
        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setPassedScoreInput(String(quiz.passingScore));
        setTimeLimitInput(String(quiz.timeLimit || 30));
      }
      // Fetch questions
      await fetchQuizQuestions(quizId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quiz details');
      navigation.goBack();
    } finally {
      setIsFetching(false);
    }
  };

  // Sync store questions to local state for display when editing
  useEffect(() => {
    if (isEditing && quizQuestions) {
      setLocalQuestions(quizQuestions);
    }
  }, [quizQuestions, isEditing]);

  const handleAddQuestionLocal = () => {
    if (!newQText.trim()) {
      Alert.alert('Error', 'Please enter a question text');
      return;
    }
    if (newQOptions[0].trim() === '' || newQOptions[1].trim() === '') {
      Alert.alert('Error', 'Please fill at least the first two options');
      return;
    }

    const questionObj = {
      id: Date.now().toString(),
      questionText: newQText,
      option_a: newQOptions[0],
      option_b: newQOptions[1],
      option_c: newQOptions[2],
      option_d: newQOptions[3],
      correctAnswer: newQCorrectLetter,
      sequenceNumber: localQuestions.length + 1,
    };

    setLocalQuestions([...localQuestions, questionObj]);
    resetQuestionForm();
    setShowAddQuestion(false);
  };

  const resetQuestionForm = () => {
    setNewQText('');
    setNewQOptions(['', '', '', '']);
    setNewQCorrectLetter('a');
  };

  const handleDeleteLocalQuestion = (index: number) => {
    const updated = [...localQuestions];
    updated.splice(index, 1);
    setLocalQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a quiz title');
      return;
    }

    setIsLoading(true);
    try {
      // Backend expects duration in minutes
      const questionsData = localQuestions.map((q, idx) => ({
        question_text: q.questionText,
        option_a: q.option_a || '',
        option_b: q.option_b || '',
        option_c: q.option_c || '',
        option_d: q.option_d || '',
        correct_answer: (q.correctAnswer || 'a').toLowerCase(),
        sequence_number: idx + 1
      }));

      const payload = {
        course: courseId,
        title,
        description,
        duration: parseInt(timeLimitInput) || 30,
        passing_score: parseInt(passedScoreInput) || 70,
        is_published: true,
        questions: questionsData
      };

      if (isEditing) {
        await updateQuiz(quizId, {
          title,
          description,
          passingScore: parseInt(passedScoreInput) || 70,
          timeLimit: parseInt(timeLimitInput) || 30, // 'duration' in backend
        } as any);

        // For editing, we add new questions individually if they don't have an ID
        for (const q of localQuestions) {
          if (!q.quizId && !String(q.id).includes('-') && String(q.id).length > 5) {
            await addQuestion(quizId, {
              question_text: q.questionText,
              question_type: 'multiple_choice',
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              correct_answer: q.correctAnswer,
              sequence_number: q.sequenceNumber
            } as any);
          }
        }
        Alert.alert('Success', 'Quiz updated successfully!');
      } else {
        await createQuiz(payload as any);
        Alert.alert('Success', 'Quiz created successfully!');
      }

      await fetchCourseQuizzes(courseId);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save quiz. Check if all fields are correct.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={['#78350f', '#b45309', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerDecoration} />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>{isEditing ? 'EDIT QUIZ' : 'NEW QUIZ'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <Text style={styles.headerMainTitle}>{isEditing ? 'Update Quiz' : 'Create Assessment'}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeader}>Quiz Details</Text>

          <TextInput
            label="Quiz Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            outlineColor="#cbd5e1"
            activeOutlineColor="#d97706"
            textColor="#1c1917"
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.input}
            outlineColor="#cbd5e1"
            activeOutlineColor="#d97706"
            textColor="#1c1917"
          />

          <View style={styles.row}>
            <TextInput
              label="Passing Score (%)"
              value={passedScoreInput}
              onChangeText={setPassedScoreInput}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              outlineColor="#cbd5e1"
              activeOutlineColor="#d97706"
              textColor="#1c1917"
            />
            <TextInput
              label="Time Limit (mins)"
              value={timeLimitInput}
              onChangeText={setTimeLimitInput}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              outlineColor="#cbd5e1"
              activeOutlineColor="#d97706"
              textColor="#1c1917"
            />
          </View>
        </Card>

        <View>
          <Text style={styles.questionsHeader}>Questions ({localQuestions.length})</Text>

          {localQuestions.map((q, index) => (
            <View key={q.id || index} style={styles.questionItem}>
              <View style={styles.questionIndex}>
                <Text style={styles.indexText}>Q{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.qText}>{q.questionText}</Text>
                <Text style={styles.qAnswer}>Correct Option: {(q.correctAnswer || 'a').toUpperCase()}</Text>
              </View>
              {!q.quizId && (
                <TouchableOpacity onPress={() => handleDeleteLocalQuestion(index)}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {showAddQuestion ? (
            <Card style={styles.addQuestionCard}>
              <Text style={styles.addQHeader}>New Question</Text>
              <TextInput
                label="Question Text"
                value={newQText}
                onChangeText={setNewQText}
                mode="outlined"
                style={styles.input}
                activeOutlineColor="#d97706"
              />

              <Text style={styles.microLabel}>Options</Text>
              <View style={styles.optionsGrid}>
                {['a', 'b', 'c', 'd'].map((letter, idx) => (
                  <View key={letter} style={styles.optionRow}>
                    <TouchableOpacity
                      onPress={() => setNewQCorrectLetter(letter)}
                      style={[
                        styles.selectionCircle,
                        newQCorrectLetter === letter && styles.selectionCircleActive
                      ]}
                    >
                      <Text style={[
                        styles.selectionLetter,
                        newQCorrectLetter === letter && styles.selectionLetterActive
                      ]}>{letter.toUpperCase()}</Text>
                    </TouchableOpacity>
                    <TextInput
                      placeholder={`Option ${letter.toUpperCase()}`}
                      value={newQOptions[idx]}
                      onChangeText={(txt) => {
                        const newOpts = [...newQOptions];
                        newOpts[idx] = txt;
                        setNewQOptions(newOpts);
                      }}
                      mode="outlined"
                      style={[styles.input, { flex: 1, height: 40, marginBottom: 8 }]}
                      activeOutlineColor="#d97706"
                      dense
                    />
                  </View>
                ))}
              </View>

              <Text style={styles.infoText}>* Tap the letter to mark it as the correct answer</Text>

              <View style={styles.addQButtons}>
                <Button mode="outlined" onPress={() => setShowAddQuestion(false)} textColor="#78716c" style={{ flex: 1, marginRight: 8 }}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleAddQuestionLocal} buttonColor="#d97706" style={{ flex: 1, marginLeft: 8 }}>
                  Add
                </Button>
              </View>
            </Card>
          ) : (
            <TouchableOpacity style={styles.addQButton} onPress={() => setShowAddQuestion(true)}>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#d97706" />
              <Text style={styles.addQButtonText}>Add New Question</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#d97706', '#b45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{isEditing ? 'Reference Changes' : 'Create Quiz'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffbeb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
  },
  premiumHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    marginBottom: 16,
  },
  headerDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  headerTitleText: {
    color: '#ffedd5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 2,
    shadowColor: '#a8a29e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#44403c',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
  },
  questionsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#44403c',
    marginBottom: 12,
    marginLeft: 4,
  },
  questionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  questionIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  qText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1917',
    marginBottom: 2,
  },
  qAnswer: {
    fontSize: 12,
    color: '#d97706',
  },
  addQuestionCard: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  addQHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 12,
  },
  microLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    marginBottom: 8,
  },
  addQButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  addQButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#fed7aa',
    borderStyle: 'dashed',
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 251, 235, 0.5)',
  },
  addQButtonText: {
    marginLeft: 8,
    color: '#d97706',
    fontWeight: '600',
  },
  optionsGrid: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  selectionCircleActive: {
    borderColor: '#d97706',
    backgroundColor: '#fff7ed',
  },
  selectionLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  selectionLetterActive: {
    color: '#d97706',
  },
  infoText: {
    fontSize: 11,
    color: '#78716c',
    fontStyle: 'italic',
    marginBottom: 16,
    marginTop: 4,
  },
  footerSpacing: {
    height: 80,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fffbeb',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(214, 211, 209, 0.3)',
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CreateQuizScreen;
