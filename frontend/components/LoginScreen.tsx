import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { Colors, Typography, AppShadows, BorderRadius, Spacing } from '@/constants/theme';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToParentLogin?: () => void;
}

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToParentLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [forgotStep, setForgotStep] = useState<'identifier' | 'otp' | null>(null);
  const [forgotId, setForgotId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { login, isLoading } = useAuthStore();
  const { authApi } = require('@/services/api');

  const studentBreathingAnim = useRef(new Animated.Value(1)).current;
  const teacherBreathingAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const checkBiometricSettings = async () => {
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      if (enabled === 'true') {
        setIsBiometricEnabled(true);
        // Optionally auto-trigger on mount for better UX
        // handleBiometricLogin(); 
      }
    };
    checkBiometricSettings();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const savedEmail = await AsyncStorage.getItem('last_user_email');
        const savedPass = await AsyncStorage.getItem('last_user_pass');
        const savedRole = (await AsyncStorage.getItem('last_user_role')) as 'teacher' | 'student';

        if (savedEmail && savedPass) {
          setEmail(savedEmail);
          setPassword(savedPass);
          setRole(savedRole || 'student');

          await login(savedEmail, savedPass, savedRole || 'student');
          onLoginSuccess();
        } else {
          Alert.alert('Setup Required', 'Please login with your password once to link biometrics.');
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
    }
  };

  useEffect(() => {
    const startBreathingAnimation = (animValue: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.05,
            duration: 950,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 950,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    const stopAnimation = (animValue: Animated.Value) => {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 0,
        useNativeDriver: false,
      }).start();
    };

    if (role === 'student') {
      startBreathingAnimation(studentBreathingAnim);
      stopAnimation(teacherBreathingAnim);
    } else {
      startBreathingAnimation(teacherBreathingAnim);
      stopAnimation(studentBreathingAnim);
    }
  }, [role]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }


    try {
      await login(email, password, role);
      // If login successful, save credentials if biometrics is intended to be used
      await Promise.all([
        AsyncStorage.setItem('last_user_email', email),
        AsyncStorage.setItem('last_user_pass', password),
        AsyncStorage.setItem('last_user_role', role),
      ]);

      onLoginSuccess();
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    }
  };

  const handleForgotRequest = async () => {
    if (!forgotId) {
      Alert.alert('Error', 'Please enter your email, phone or ID');
      return;
    }
    setIsResetLoading(true);
    try {
      const res = await authApi.forgotPasswordRequest(forgotId);
      Alert.alert('OTP Sent', res.data.message);
      setForgotStep('otp');
    } catch (error) {
      Alert.alert('Error', (error as any).message || 'Failed to send OTP');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleForgotVerify = async () => {
    if (!otpCode || !newPass) {
      Alert.alert('Error', 'Please enter both OTP and your new password');
      return;
    }
    setIsResetLoading(true);
    try {
      const res = await authApi.forgotPasswordVerify({
        identifier: forgotId,
        otp_code: otpCode,
        new_password: newPass,
      });
      Alert.alert('Success', res.data.message);
      setForgotStep(null);
      setEmail(forgotId);
    } catch (error) {
      Alert.alert('Verification Failed', (error as any).message || 'Invalid code');
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          role === 'student'
            ? [Colors.light.primaryDark, Colors.light.primary, Colors.light.secondaryLight]
            : ['#1e1b4b', '#4338ca', '#818cf8']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Logo and Header */}
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/Logo.png')}
                style={styles.logoImage}
              />
              <Text style={styles.subtitle}>Where Mentorship Meets Intelligence</Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              {!forgotStep ? (
                <>
                  {/* Role Selection */}
                  <View style={styles.roleSection}>
                    <Text style={styles.roleLabel}>Role: </Text>
                    <View style={styles.roleButtons}>
                      <Animated.View style={{ flex: 1, transform: [{ scale: studentBreathingAnim }] }}>
                        <TouchableOpacity
                          style={[styles.roleButton, role === 'student' && styles.roleButtonActiveStudent]}
                          onPress={() => setRole('student')}
                          disabled={isLoading}
                        >
                          <MaterialCommunityIcons
                            name="account-school"
                            size={24}
                            color={role === 'student' ? Colors.light.primary : Colors.light.textLight}
                          />
                          <Text style={[styles.roleButtonText, role === 'student' && styles.roleButtonTextActiveStudent]}>
                            Student
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={{ flex: 1, transform: [{ scale: teacherBreathingAnim }] }}>
                        <TouchableOpacity
                          style={[styles.roleButton, role === 'teacher' && styles.roleButtonActiveTeacher]}
                          onPress={() => setRole('teacher')}
                          disabled={isLoading}
                        >
                          <MaterialCommunityIcons
                            name="account-tie"
                            size={20}
                            color={role === 'teacher' ? '#4338ca' : Colors.light.textLight}
                          />
                          <Text style={[styles.roleButtonText, { fontSize: 11 }, role === 'teacher' && styles.roleButtonTextActiveTeacher]}>
                            Teacher
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                    <TextInput
                      placeholder={
                        role === 'teacher'
                          ? "Email Address or 5-digit ID"
                          : "Email Address or 8-digit ID"
                      }
                      value={email}
                      onChangeText={setEmail}
                      mode="flat"
                      keyboardType={email.match(/^\d+$/) ? "number-pad" : "email-address"}
                      autoCapitalize="none"
                      style={styles.input}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      textColor={Colors.light.text}
                      selectionColor={Colors.light.primary}
                      cursorColor={Colors.light.primary}
                      placeholderTextColor={Colors.light.textLight}
                      editable={!isLoading}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      mode="flat"
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      textColor={Colors.light.text}
                      selectionColor={Colors.light.primary}
                      cursorColor={Colors.light.primary}
                      placeholderTextColor={Colors.light.textLight}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                          color={Colors.light.textLight}
                        />
                      }
                      editable={!isLoading}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => setForgotStep('identifier')}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* Login Actions */}
                  <View style={styles.loginActions}>
                    <TouchableOpacity
                      style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                      <LinearGradient
                        colors={
                          role === 'student'
                            ? [Colors.light.primary, Colors.light.primaryDark]
                            : ['#4338ca', '#1e1b4b']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.loginButtonGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={Colors.light.white} />
                        ) : (
                          <>
                            <Text style={styles.loginButtonText}>Sign In</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.light.white} />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {isBiometricEnabled && (
                      <TouchableOpacity
                        style={styles.biometricBtn}
                        onPress={handleBiometricLogin}
                        disabled={isLoading}
                      >
                        <MaterialCommunityIcons
                          name="fingerprint"
                          size={36}
                          color={role === 'student' ? Colors.light.primary : '#4338ca'}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {onNavigateToParentLogin && (
                    <TouchableOpacity
                      style={{ alignItems: 'center', marginTop: Spacing.xl }}
                      onPress={onNavigateToParentLogin}
                      disabled={isLoading}
                    >
                      <Text style={{ ...Typography.bodySmall, color: Colors.light.textSecondary }}>
                        Are you a parent? <Text style={{ color: Colors.light.primary, fontWeight: 'bold' }}>Sign in as parent</Text>
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : forgotStep === 'identifier' ? (
                <>
                  <Text style={styles.forgotHeader}>Reset Password</Text>
                  <Text style={styles.forgotSub}>Enter your registered email, phone number, or ID to get a 4-digit code.</Text>

                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="account-search-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Email, Phone or ID"
                      value={forgotId}
                      onChangeText={setForgotId}
                      mode="flat"
                      style={styles.input}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.loginButton, isResetLoading && styles.loginButtonDisabled]}
                    onPress={handleForgotRequest}
                    disabled={isResetLoading}
                  >
                    <LinearGradient
                      colors={[Colors.light.primary, Colors.light.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginButtonGradient}
                    >
                      {isResetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Send Code</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.backBtn} onPress={() => setForgotStep(null)}>
                    <Text style={styles.backText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.forgotHeader}>Verify Code</Text>
                  <Text style={styles.forgotSub}>Enter the 4-digit code and your new password.</Text>

                  <View style={[styles.inputContainer, { marginBottom: Spacing.s }]}>
                    <MaterialCommunityIcons name="numeric" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                    <TextInput
                      placeholder="4-digit Code"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      maxLength={4}
                      keyboardType="number-pad"
                      mode="flat"
                      style={styles.input}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock-plus-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                    <TextInput
                      placeholder="New Password"
                      value={newPass}
                      onChangeText={setNewPass}
                      secureTextEntry
                      mode="flat"
                      style={styles.input}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.loginButton, isResetLoading && styles.loginButtonDisabled]}
                    onPress={handleForgotVerify}
                    disabled={isResetLoading}
                  >
                    <LinearGradient
                      colors={[Colors.light.primary, Colors.light.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginButtonGradient}
                    >
                      {isResetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Reset Password</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.backBtn} onPress={() => setForgotStep('identifier')}>
                    <Text style={styles.backText}>Resend Code</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Bottom Decoration */}
            <View style={styles.bottomDecoration}>
              <Text style={styles.decorationText}>Secure • Fast • Reliable</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.l,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoImage: {
    width: 160,
    height: 120,
    resizeMode: 'contain',
    marginBottom: Spacing.s,
    alignSelf: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 42,
    color: Colors.light.white,
    marginBottom: Spacing.s,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.l,
    ...AppShadows.medium,
  },
  roleSection: {
    marginBottom: Spacing.l,
  },
  roleLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.m,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.m,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  roleButtonActiveStudent: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  roleButtonActiveTeacher: {
    borderColor: '#4338ca',
    backgroundColor: '#eef2ff',
  },
  roleButtonText: {
    ...Typography.bodySmall,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textLight,
  },
  roleButtonTextActiveStudent: {
    color: Colors.light.primary,
  },
  roleButtonTextActiveTeacher: {
    color: '#4338ca',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    paddingHorizontal: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputIcon: {
    marginRight: Spacing.s,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 15,
  },
  loginActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  loginButton: {
    flex: 1,
    marginTop: Spacing.s,
    borderRadius: BorderRadius.m,
    overflow: 'hidden',
    ...AppShadows.light,
  },
  biometricBtn: {
    marginTop: Spacing.s,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.m,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.l,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
  },
  signupLink: {
    ...Typography.bodySmall,
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.m,
    marginTop: -Spacing.s,
  },
  forgotText: {
    ...Typography.bodySmall,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: Spacing.m,
  },
  backText: {
    ...Typography.bodySmall,
    color: Colors.light.textLight,
    fontWeight: '600',
  },
  forgotHeader: {
    ...Typography.h2,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.s,
  },
  forgotSub: {
    ...Typography.bodySmall,
    color: Colors.light.textLight,
    textAlign: 'center',
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.m,
  },
  bottomDecoration: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  decorationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
});
