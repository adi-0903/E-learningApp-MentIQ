import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
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

interface ParentLoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const ParentLoginScreen: React.FC<ParentLoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password, 'parent');
      onLoginSuccess();
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#334155', '#64748b']}
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
              <Text style={styles.subtitle}>Parent Portal</Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <View style={styles.roleHeaderContainer}>
                 <MaterialCommunityIcons name="account-child-circle" size={32} color="#0f172a" />
                 <Text style={styles.roleHeaderText}>Parent Sign In</Text>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color={Colors.light.textLight} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email Address or 6-digit ID"
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

              <View style={styles.forgotBtnContainer}>
                 <TouchableOpacity style={styles.forgotBtn} disabled={isLoading}>
                   <Text style={[styles.forgotText, { color: '#0f172a' }]}>Forgot password?</Text>
                 </TouchableOpacity>
              </View>

              {/* Login Actions */}
              <View style={styles.loginActions}>
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#334155', '#0f172a']}
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
              </View>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={onNavigateToLogin}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.light.white} />
              <Text style={styles.backButtonText}>Back to Student/Teacher Login</Text>
            </TouchableOpacity>

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
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 140,
    height: 100,
    resizeMode: 'contain',
    marginBottom: Spacing.xs,
    alignSelf: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.l,
    ...AppShadows.medium,
  },
  roleHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.s,
  },
  roleHeaderText: {
    ...Typography.h2,
    color: '#0f172a',
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
  forgotBtnContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.m,
    marginTop: -Spacing.xs,
  },
  forgotBtn: {
    paddingVertical: 4,
  },
  forgotText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  loginActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    flex: 1,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.m,
    overflow: 'hidden',
    ...AppShadows.light,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.m,
    gap: Spacing.s,
  },
  backButtonText: {
    color: Colors.light.white,
    ...Typography.body,
    fontWeight: '600',
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
