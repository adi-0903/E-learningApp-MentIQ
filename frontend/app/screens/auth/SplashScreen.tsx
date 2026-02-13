import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View, Image } from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(30)).current;
  const isAppReady = useRef(false);
  const { getCurrentUser } = useAuthStore();

  useEffect(() => {
    // Initialize app while showing splash
    const initializeApp = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        );

        await Promise.race([
          getCurrentUser(),
          timeoutPromise
        ]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        isAppReady.current = true;
      }
    };

    startAnimations();
    initializeApp();

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100 && isAppReady.current) {
          clearInterval(progressInterval);
          setTimeout(() => {
            onFinish();
          }, 600);
          return 100;
        }

        if (prev >= 100) return 100;

        return prev + 2.0;
      });
    }, 40);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(textSlideAnim, {
      toValue: 0,
      duration: 1000,
      delay: 400,
      useNativeDriver: true,
    }).start();
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#010b0a', '#06201f', '#064e3b', '#0f766e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Subtle Modern Geometry background */}
          <View style={styles.educationalBackground}>
            <MaterialCommunityIcons name="molecule" size={400} color="rgba(45, 212, 191, 0.05)" style={styles.bgDecoration} />
          </View>

          {/* Floating particles background */}
          <View style={styles.particlesContainer}>
            {[...Array(20)].map((_, index) => (
              <FloatingParticle key={index} delay={index * 200} />
            ))}
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [
                    { scale: scaleAnim },
                  ]
                }
              ]}
            >
              <View style={styles.logoHalo} />
              <View style={styles.logoBlur} />
              <Image
                source={require('@/assets/images/Logo.png')}
                style={styles.mainLogo}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.textContainer,
                {
                  transform: [{ translateY: textSlideAnim }]
                }
              ]}
            >
              <Text style={styles.appNameText}>MentIQ</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badgeDot} />
                <Text style={styles.taglineText}>INTELLIGENCE HUB</Text>
              </View>
            </Animated.View>
          </View>

          {/* Loading Section */}
          <View style={styles.loadingSection}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                      backgroundColor: '#2dd4bf',
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            </View>

            <Text style={styles.loadingStatusText}>
              {progress < 40 ? 'Securing Environment' :
                progress < 75 ? 'Synchronizing Vault' :
                  'Accessing Identity'}
            </Text>
          </View>

          {/* Bottom branding */}
          <View style={styles.brandingSection}>
            <Text style={styles.brandingMainText}>BLOOM COLLECTIVE</Text>
            <View style={styles.originBadge}>
              <Text style={styles.originLabel}>ENGINEERED IN INDIA</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

// Floating particle component refined
function FloatingParticle({ delay }: { delay: number }) {
  const animValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityValue, {
              toValue: 0.4,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    setTimeout(startAnimation, delay);
  }, [delay]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.8, height * 0.2],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 30, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: Math.random() * width,
          opacity: opacityValue,
          transform: [
            { translateY },
            { translateX },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  educationalBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgDecoration: {
    opacity: 0.1,
    position: 'absolute',
    right: -100,
    top: height * 0.1,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#2dd4bf',
    borderRadius: 1.5,
  },
  logoSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.1)',
  },
  logoBlur: {
    position: 'absolute',
    width: 140,
    height: 140,
    backgroundColor: 'rgba(45, 212, 191, 0.2)',
    borderRadius: 70,
    filter: 'blur(30px)',
  },
  mainLogo: {
    width: 130,
    height: 110,
    resizeMode: 'contain',
    zIndex: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  appNameText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2dd4bf',
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
  },
  loadingSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBackground: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2dd4bf',
    letterSpacing: 1,
  },
  loadingStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  brandingSection: {
    alignItems: 'center',
  },
  brandingMainText: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 4,
    marginBottom: 10,
  },
  originBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  originLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 1,
  },
});

export default SplashScreen;
