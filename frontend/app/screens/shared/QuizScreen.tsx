import { useAuthStore } from '@/store/authStore';
import { Quiz, useQuizStore } from '@/store/quizStore';
import { useEffect, useState, useRef } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { ActivityIndicator, Button, Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, AppShadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

function QuizScreen({ route, navigation }: any) {
  const { quizId, courseId } = route?.params || {};
  const { user } = useAuthStore();
  const { getQuizById, fetchQuizQuestions, quizQuestions, submitQuizAttempt } = useQuizStore();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const quizData = await getQuizById(quizId);
      setQuiz(quizData);
      await fetchQuizQuestions(quizId);

      // Initialize timer (default to 30 mins if not specified)
      const durationMins = quizData?.timeLimit || 30;
      setTimeLeft(durationMins * 60);
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as NodeJS.Timeout;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft > 0, isSubmitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleAutoSubmit = () => {
    Alert.alert(
      'Time Up!',
      'Your time has expired. Your quiz will be submitted automatically.',
      [{ text: 'OK', onPress: () => performSubmit(true) }]
    );
    // Submit immediately in the background
    performSubmit(true);
  };

  const performSubmit = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitQuizAttempt(quizId, answers);

      // result.score is the count of correct answers from backend
      const totalQuestions = result.totalQuestions || quizQuestions.length;
      const score = totalQuestions > 0 ? (result.score / totalQuestions) * 100 : 0;

      navigation.replace('QuizResult', {
        quizId,
        courseId,
        score,
        correctAnswers: result.score,
        totalQuestions: totalQuestions,
        passingScore: quiz?.passingScore || 70,
        attempt: result, // Pass the full result for analysis
      });
    } catch (error) {
      if (!isAuto) {
        // Fallback local calculation if API fails but we want to show something (rare)
        let correctCount = 0;
        quizQuestions.forEach(q => {
          const studentAns = (answers[q.id] || '').toLowerCase();
          const correctAns = (q.correctAnswer || '').toLowerCase();
          if (studentAns === correctAns) correctCount++;
        });

        const score = quizQuestions.length > 0 ? (correctCount / quizQuestions.length) * 100 : 0;

        navigation.replace('QuizResult', {
          quizId,
          courseId,
          score,
          correctAnswers: correctCount,
          totalQuestions: quizQuestions.length,
          passingScore: quiz?.passingScore || 70,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    const unansweredCount = quizQuestions.length - Object.keys(answers).length;
    let message = 'Are you sure you want to submit?';
    if (unansweredCount > 0) {
      message = `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`;
    }

    Alert.alert('Submit Quiz', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: () => performSubmit(false) },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d97706" />
        <Text style={{ marginTop: 12, color: '#78716c' }}>Preparing Assessment...</Text>
      </View>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / quizQuestions.length;

  if (!currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <Text>Assessments were not found for this quiz.</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  // Prepare options array
  let options: { label: string, value: string }[] = [];
  if (currentQuestion.questionType === 'multiple_choice') {
    if (currentQuestion.option_a) options.push({ label: currentQuestion.option_a, value: 'a' });
    if (currentQuestion.option_b) options.push({ label: currentQuestion.option_b, value: 'b' });
    if (currentQuestion.option_c) options.push({ label: currentQuestion.option_c, value: 'c' });
    if (currentQuestion.option_d) options.push({ label: currentQuestion.option_d, value: 'd' });
  } else {
    options = [{ label: 'True', value: 'a' }, { label: 'False', value: 'b' }];
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Premium Header */}
      <LinearGradient
        colors={['#78350f', '#b45309']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.timerBadge}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#fff" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.quizTitle} numberOfLines={1}>{quiz?.title}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Question {currentQuestionIndex + 1} of {quizQuestions.length}</Text>
            <Text style={styles.percentageLabel}>{Math.round(progress * 100)}% Complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
        </View>

        {/* Question Card */}
        <Card style={styles.questionCard}>
          <Card.Content>
            <Text style={styles.questionText}>
              {currentQuestion?.questionText}
            </Text>
          </Card.Content>
        </Card>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {options.map((option, idx) => {
            const isSelected = answers[currentQuestion.id] === option.value;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: option.value }))}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected
                ]}
              >
                <View style={[styles.letterBadge, isSelected && styles.letterBadgeSelected]}>
                  <Text style={[styles.letterText, isSelected && styles.letterTextSelected]}>
                    {option.value.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={22} color="#d97706" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <Button
          mode="text"
          onPress={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          textColor="#78716c"
          style={styles.footerBtn}
        >
          Previous
        </Button>

        {currentQuestionIndex === quizQuestions.length - 1 ? (
          <TouchableOpacity
            onPress={handleManualSubmit}
            disabled={isSubmitting}
            style={styles.submitBtn}
          >
            <LinearGradient
              colors={['#d97706', '#b45309']}
              style={styles.submitGradient}
            >
              <MaterialCommunityIcons name="check-all" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Button
            mode="contained"
            onPress={() => setCurrentQuestionIndex(prev => Math.min(quizQuestions.length - 1, prev + 1))}
            style={[styles.footerBtn, { backgroundColor: '#d97706' }]}
            buttonColor="#d97706"
            labelStyle={{ fontWeight: '700', color: '#fff' }}
          >
            Next
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#78350f',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  quizTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#44403c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d97706',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e7e5e4',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 28,
    ...AppShadows.medium,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1917',
    lineHeight: 28,
  },
  optionsGrid: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e7e5e4',
    ...AppShadows.small,
  },
  optionCardSelected: {
    borderColor: '#d97706',
    backgroundColor: '#fff7ed',
    transform: [{ scale: 1.02 }],
  },
  letterBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f5f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  letterBadgeSelected: {
    backgroundColor: '#d97706',
  },
  letterText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#78716c',
  },
  letterTextSelected: {
    color: '#fff',
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#44403c',
  },
  optionLabelSelected: {
    color: '#d97706',
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    ...AppShadows.small,
  },
  footerBtn: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    borderRadius: 12,
  },
  submitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    ...AppShadows.small,
  },
  submitGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default QuizScreen;
