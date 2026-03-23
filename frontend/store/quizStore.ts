import { create } from 'zustand';
import { quizApi } from '@/services/api';

export interface Quiz {
  id: string;
  courseId?: string | number;
  course?: number | string;
  title: string;
  description?: string;
  totalQuestions: number;
  passingScore: number;
  timeLimit?: number;
  courseTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizQuestion {
  id: string;
  quizId?: string | number;
  quiz?: number | string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correctAnswer: string;
  sequenceNumber: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizAttempt {
  id: string;
  studentId?: string;
  quizId?: string | number;
  quiz?: number | string;
  quiz_title?: string;
  score: number;
  totalQuestions: number;
  correctAnswers?: number;
  percentage?: number;
  passed?: boolean;
  attemptedAt?: string;
  timeSpent?: number;
  answers?: Record<string, string>;
  questions?: any[];
}

function normalizeQuiz(raw: any): Quiz {
  return {
    id: String(raw.id),
    courseId: raw.course_id || raw.courseId || (raw.course ? String(raw.course) : undefined),
    title: raw.title,
    description: raw.description || '',
    totalQuestions: raw.total_questions || raw.totalQuestions || raw.question_count || 0,
    passingScore: raw.passing_score || raw.passingScore || 0,
    timeLimit: raw.duration || raw.time_limit || raw.timeLimit,
    courseTitle: raw.course_title || raw.courseTitle || (raw.course_name),
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

function normalizeQuestion(raw: any): QuizQuestion {
  return {
    id: String(raw.id),
    quizId: raw.quiz_id || raw.quizId || (raw.quiz ? String(raw.quiz) : undefined),
    questionText: raw.question_text || raw.questionText,
    questionType: raw.question_type || raw.questionType || 'multiple_choice',
    options: raw.options || '',
    option_a: raw.option_a,
    option_b: raw.option_b,
    option_c: raw.option_c,
    option_d: raw.option_d,
    correctAnswer: raw.correct_answer || raw.correctAnswer || '',
    sequenceNumber: raw.sequence_number || raw.sequenceNumber || 0,
    createdAt: raw.created_at || raw.createdAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

function normalizeAttempt(raw: any): QuizAttempt {
  return {
    id: String(raw.id),
    studentId: raw.student_id || raw.studentId || (raw.student ? String(raw.student) : undefined),
    quizId: raw.quiz_id || raw.quizId || (raw.quiz ? String(raw.quiz) : String(raw.quiz_id)),
    quiz_title: raw.quiz_title,
    score: raw.score || 0,
    totalQuestions: raw.total_questions || raw.totalQuestions || 0,
    correctAnswers: raw.score,
    percentage: raw.percentage,
    passed: raw.passed,
    attemptedAt: raw.completed_at || raw.attempted_at || raw.attemptedAt,
    timeSpent: raw.time_taken || raw.timeSpent,
    answers: raw.answers,
    questions: raw.questions,
  };
}

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  quizQuestions: QuizQuestion[];
  quizAttempts: QuizAttempt[];
  isLoading: boolean;

  fetchAllQuizzes: () => Promise<void>;
  fetchCourseQuizzes: (courseId: string | number) => Promise<void>;
  getQuizById: (quizId: string | number) => Promise<Quiz | null>;
  createQuiz: (quiz: {
    course: string | number;
    title: string;
    description?: string;
    total_questions: number;
    passing_score: number;
    time_limit?: number;
  }) => Promise<any>;
  updateQuiz: (quizId: string | number, updates: Partial<Quiz>) => Promise<void>;
  deleteQuiz: (quizId: string | number) => Promise<void>;

  fetchQuizQuestions: (quizId: string | number) => Promise<void>;
  addQuestion: (quizId: string | number, question: {
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string;
    correct_answer: string;
    sequence_number: number;
  }) => Promise<void>;
  updateQuestion: (questionId: string | number, updates: Partial<QuizQuestion>) => Promise<void>;
  deleteQuestion: (questionId: string | number) => Promise<void>;

  fetchStudentAttempts: (studentId: string, quizId: string | number) => Promise<void>;
  fetchAllAttempts: () => Promise<void>;
  submitQuizAttempt: (quizId: string | number, answers: Record<string, string>) => Promise<QuizAttempt>;
}

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: [],
  currentQuiz: null,
  quizQuestions: [],
  quizAttempts: [],
  isLoading: false,

  fetchAllQuizzes: async () => {
    set({ isLoading: true });
    try {
      const { data } = await quizApi.list();
      const results = data.data || data.results || data;
      set({ quizzes: (Array.isArray(results) ? results : []).map(normalizeQuiz) });
    } catch (error) {
      console.error('Error fetching all quizzes:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCourseQuizzes: async (courseId) => {
    set({ isLoading: true });
    try {
      const { data } = await quizApi.list(courseId);
      // Backend StandardPagination puts the array in data.data
      const results = data.data || data.results || data;
      set({ quizzes: (Array.isArray(results) ? results : []).map(normalizeQuiz) });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  getQuizById: async (quizId) => {
    try {
      const { data } = await quizApi.get(quizId);
      return normalizeQuiz(data.data || data);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  },

  createQuiz: async (quiz) => {
    try {
      const { data } = await quizApi.create(quiz);
      return data.data || data;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  updateQuiz: async (quizId, updates) => {
    try {
      await quizApi.update(quizId, {
        title: updates.title,
        description: updates.description,
        total_questions: updates.totalQuestions,
        passing_score: updates.passingScore,
        time_limit: updates.timeLimit,
      });
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  deleteQuiz: async (quizId) => {
    try {
      await quizApi.delete(quizId);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  fetchQuizQuestions: async (quizId) => {
    set({ isLoading: true });
    try {
      // Questions are fetched as part of the quiz detail
      const { data } = await quizApi.get(quizId);
      const quizData = data.data || data;
      const questions = quizData.questions || [];
      set({ quizQuestions: questions.map(normalizeQuestion) });
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addQuestion: async (quizId, question) => {
    try {
      await quizApi.addQuestion(quizId, question);
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  },

  updateQuestion: async (_questionId, _updates) => {
    // Questions are managed via quiz endpoint
    console.log('Question update: use quiz questions endpoint');
  },

  deleteQuestion: async (_questionId) => {
    // Questions are managed via quiz endpoint
    console.log('Question delete: use quiz questions endpoint');
  },

  fetchStudentAttempts: async (_studentId, quizId) => {
    try {
      const { data } = await quizApi.getAttempts(quizId);
      const results = data.data || data.results || data;
      set({ quizAttempts: (Array.isArray(results) ? results : []).map(normalizeAttempt) });
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
    }
  },

  fetchAllAttempts: async () => {
    try {
      const { data } = await quizApi.listAllAttempts();
      const results = data.data || data.results || data;
      set({ quizAttempts: (Array.isArray(results) ? results : []).map(normalizeAttempt) });
    } catch (error) {
      console.error('Error fetching all quiz attempts:', error);
    }
  },

  submitQuizAttempt: async (quizId, answers) => {
    try {
      const { data } = await quizApi.submit(quizId, { answers });
      return normalizeAttempt(data.data);
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      throw error;
    }
  },
}));
