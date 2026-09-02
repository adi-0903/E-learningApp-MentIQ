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

describe('authStore - verifyPhoneOTP', () => {
  const initialUser = {
    id: '10',
    email: 'user@example.com',
    name: 'OTP User',
    role: 'student' as const,
    phoneNumber: '1234567890',
    isPhoneVerified: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isLoggedIn: false,
    });
  });

  it('should verify OTP, update user state and AsyncStorage, and reset isLoading when user is logged in', async () => {
    useAuthStore.setState({
      user: initialUser,
      isLoggedIn: true,
      isLoading: false,
    });

    const apiResponse = {
      data: {
        success: true,
        data: {
          phone_number: '1234567890',
          is_phone_verified: true,
        },
      },
    };

    (authApi.verifyPhoneOTP as jest.Mock).mockResolvedValue(apiResponse);

    const result = await useAuthStore.getState().verifyPhoneOTP('1234');

    expect(authApi.verifyPhoneOTP).toHaveBeenCalledWith('1234', undefined);
    expect(result).toEqual(apiResponse.data);

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.user).toEqual({
      ...initialUser,
      phoneNumber: '1234567890',
      isPhoneVerified: true,
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'currentUser',
      JSON.stringify({
        ...initialUser,
        phoneNumber: '1234567890',
        isPhoneVerified: true,
      })
    );
  });

  it('should pass explicit phoneNumber argument and update user state accordingly', async () => {
    useAuthStore.setState({
      user: initialUser,
      isLoggedIn: true,
      isLoading: false,
    });

    const apiResponse = {
      data: {
        success: true,
        data: {
          phone_number: '+19876543210',
          is_phone_verified: true,
        },
      },
    };

    (authApi.verifyPhoneOTP as jest.Mock).mockResolvedValue(apiResponse);

    const result = await useAuthStore.getState().verifyPhoneOTP('5678', '+19876543210');

    expect(authApi.verifyPhoneOTP).toHaveBeenCalledWith('5678', '+19876543210');
    expect(result).toEqual(apiResponse.data);

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.user?.phoneNumber).toBe('+19876543210');
    expect(state.user?.isPhoneVerified).toBe(true);
  });

  it('should handle OTP verification when no user is logged in (user: null)', async () => {
    useAuthStore.setState({
      user: null,
      isLoggedIn: false,
      isLoading: false,
    });

    const apiResponse = {
      data: {
        success: true,
        message: 'Phone number verified',
      },
    };

    (authApi.verifyPhoneOTP as jest.Mock).mockResolvedValue(apiResponse);

    const result = await useAuthStore.getState().verifyPhoneOTP('1234');

    expect(authApi.verifyPhoneOTP).toHaveBeenCalledWith('1234', undefined);
    expect(result).toEqual(apiResponse.data);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('should rethrow error and reset isLoading to false when authApi.verifyPhoneOTP fails', async () => {
    useAuthStore.setState({
      user: initialUser,
      isLoggedIn: true,
      isLoading: false,
    });

    const error = new Error('Invalid or expired OTP.');
    (authApi.verifyPhoneOTP as jest.Mock).mockRejectedValue(error);

    await expect(useAuthStore.getState().verifyPhoneOTP('9999')).rejects.toThrow(
      'Invalid or expired OTP.'
    );

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.user).toEqual(initialUser);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('should rethrow error and reset isLoading to false when AsyncStorage.setItem throws', async () => {
    useAuthStore.setState({
      user: initialUser,
      isLoggedIn: true,
      isLoading: false,
    });

    const apiResponse = {
      data: {
        success: true,
        data: {
          phone_number: '1234567890',
          is_phone_verified: true,
        },
      },
    };

    (authApi.verifyPhoneOTP as jest.Mock).mockResolvedValue(apiResponse);
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage write error'));

    await expect(useAuthStore.getState().verifyPhoneOTP('1234')).rejects.toThrow(
      'AsyncStorage write error'
    );

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
  });
});
