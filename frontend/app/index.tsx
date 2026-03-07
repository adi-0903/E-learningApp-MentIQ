import MainApp from '@/app/MainApp';
import { LoginScreen } from '@/components/LoginScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import SplashScreen from './screens/auth/SplashScreen';



export default function RootApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);

  // Show splash screen first
  if (showSplash) {
    return (
      <PaperProvider>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </PaperProvider>
    );
  }

  // Show onboarding if not logged in and splash is finished
  if (showOnboarding && !isLoggedIn) {
    return (
      <PaperProvider>
        <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      {isLoggedIn && user ? (
        <MainApp />
      ) : (
        <LoginScreen
          onLoginSuccess={() => { }}
        />
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
