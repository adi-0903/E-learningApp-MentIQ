import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { Colors, Typography, AppShadows, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, isLoading } = useAuthStore();

  const studentBreathingAnim = useRef(new Animated.Value(1)).current;
  const teacherBreathingAnim = useRef(new Animated.Value(1)).current;

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

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await signup(email, password, name, role);
      Alert.alert('Success', 'Account created successfully! Please log in with your credentials.');
      onNavigateToLogin();
    } catch (error) {
      Alert.alert('Signup Failed', (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          role === 'student'
            ? [Colors.light.primaryDark, Colors.light.primary, Colors.light.secondaryLight]
            : ['#1e1b4b', '#4338ca', '#818cf8'] // Deep Indigo gradient for Teacher
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our learning community today</Text>
            </View>

            {/* Signup Card */}
            <View style={styles.card}>
              {/* Role Selection */}
              <View style={styles.roleSection}>
                <Text style={styles.roleLabel}>Role:</Text>
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
                        size={24}
                        color={role === 'teacher' ? '#4338ca' : Colors.light.textLight}
                      />
                      <Text style={[styles.roleButtonText, role === 'teacher' && styles.roleButtonTextActiveTeacher]}>
                        Teacher
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  mode="flat"
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

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  mode="flat"
                  keyboardType="email-address"
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

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="flat"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  textColor={Colors.light.text}
                  selectionColor={Colors.light.primary}
                  cursorColor={Colors.light.primary}
                  placeholderTextColor={Colors.light.textLight}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      color={Colors.light.textLight}
                    />
                  }
                  editable={!isLoading}
                />
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={role === 'student' ? [Colors.light.primary, Colors.light.primaryDark] : ['#4338ca', '#1e1b4b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signupButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.light.white} />
                  ) : (
                    <>
                      <Text style={styles.signupButtonText}>Create Account</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.light.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Decoration */}
            <View style={styles.bottomDecoration}>
              <Text style={styles.decorationText}>Start Your Learning Journey</Text>
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
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    fontSize: 38,
    color: Colors.light.white,
    marginBottom: Spacing.m,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 15,
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
    marginBottom: Spacing.m,
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
    marginBottom: 14,
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
  signupButton: {
    marginTop: Spacing.s,
    borderRadius: BorderRadius.m,
    overflow: 'hidden',
    ...AppShadows.light,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  signupButtonText: {
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
  loginLink: {
    ...Typography.bodySmall,
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  bottomDecoration: {
    alignItems: 'center',
    marginTop: Spacing.l,
  },
  decorationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
});
