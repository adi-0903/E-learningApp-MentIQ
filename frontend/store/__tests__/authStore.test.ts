import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../authStore';
import { authApi, getTokens, clearTokens } from '@/services/api';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    updateFCMToken: jest.fn(),
    requestPhoneOTP: jest.fn(),
    verifyPhoneOTP: jest.fn(),
  },
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
  getTokens: jest.fn(),
  setOnAuthFailure: jest.fn(),
}));

describe('authStore - getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isLoggedIn: false,
    });
  });

  describe('Missing token edge cases', () => {
    it('should clear tokens, remove cached user, reset state, and return null when getTokens returns null', async () => {
      // Setup initial state with a non-null user or loading state
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'student' },
        isLoggedIn: true,
        isLoading: false,
      });

      (getTokens as jest.Mock).mockResolvedValue(null);

      const result = await useAuthStore.getState().getCurrentUser();

      expect(getTokens).toHaveBeenCalledTimes(1);
      expect(clearTokens).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(result).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoggedIn).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should clear tokens, remove cached user, reset state, and return null when tokens object lacks access token', async () => {
      useAuthStore.setState({
        user: null,
        isLoggedIn: true,
        isLoading: false,
      });

      // Token object present, but access token is undefined / falsy
      (getTokens as jest.Mock).mockResolvedValue({ refresh: 'some-refresh-token' });

      const result = await useAuthStore.getState().getCurrentUser();

      expect(getTokens).toHaveBeenCalledTimes(1);
      expect(clearTokens).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(result).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoggedIn).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should clear tokens, remove cached user, reset state, and return null when access token is empty string', async () => {
      (getTokens as jest.Mock).mockResolvedValue({ access: '', refresh: 'some-refresh-token' });

      const result = await useAuthStore.getState().getCurrentUser();

      expect(clearTokens).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(result).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoggedIn).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Valid token scenarios', () => {
    it('should fetch fresh user profile and update state when valid tokens exist', async () => {
      const mockTokens = { access: 'valid-access-token', refresh: 'valid-refresh-token' };
      const mockBackendUser = {
        id: 42,
        email: 'student@example.com',
        name: 'Jane Student',
        role: 'student' as const,
        bio: 'Learning React Native',
        phone_number: '1234567890',
        is_email_verified: true,
        is_phone_verified: false,
        profile_image_url: 'https://example.com/avatar.jpg',
        profile_avatar: 'avatar1',
        student_id: 'STU123',
        grade_level: 'Grade 10',
      };

      (getTokens as jest.Mock).mockResolvedValue(mockTokens);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (authApi.getProfile as jest.Mock).mockResolvedValue({ data: mockBackendUser });

      const result = await useAuthStore.getState().getCurrentUser();

      expect(getTokens).toHaveBeenCalledTimes(1);
      expect(authApi.getProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: '42',
        email: 'student@example.com',
        name: 'Jane Student',
        role: 'student',
        bio: 'Learning React Native',
        phoneNumber: '1234567890',
        isEmailVerified: true,
        isPhoneVerified: false,
        profileImage: 'https://example.com/avatar.jpg',
        profileAvatar: 'avatar1',
        teacherId: '',
        studentId: 'STU123',
        parentId: '',
        gradeLevel: 'Grade 10',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(result);
      expect(state.isLoggedIn).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(result));
    });

    it('should clear tokens and reset state when profile request fails (expired session)', async () => {
      (getTokens as jest.Mock).mockResolvedValue({ access: 'expired-token' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (authApi.getProfile as jest.Mock).mockRejectedValue(new Error('401 Unauthorized'));

      const result = await useAuthStore.getState().getCurrentUser();

      expect(clearTokens).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(result).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoggedIn).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should catch top-level errors and reset state to unauthenticated', async () => {
      (getTokens as jest.Mock).mockRejectedValue(new Error('AsyncStorage read error'));

      const result = await useAuthStore.getState().getCurrentUser();

      expect(result).toBeNull();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoggedIn).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
