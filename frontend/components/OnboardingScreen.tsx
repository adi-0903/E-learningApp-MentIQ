import React, { useRef, useState } from 'react';
import {
    StyleSheet,
  useWindowDimensions,
    View,
    FlatList,
    TouchableOpacity,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ImageBackground,
    Animated,
    Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface OnboardingScreenProps {
    onFinish: () => void;
}

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to MentIQ',
        description: 'Experience a revolutionary way to learn and grow. Your personalized journey to excellence starts here.',
        icon: 'school-outline',
        colors: ['#020617', '#0f766e', '#5eead4'], // Obsidian -> Teal -> Mint Glow
    },
    {
        id: '2',
        title: 'Expert Mentorship',
        description: 'Connect with world-class educators and mentors who are dedicated to your success and growth.',
        icon: 'account-group-outline',
        colors: ['#020617', '#3730a3', '#a5b4fc'], // Obsidian -> Indigo -> Lavender Glow
    },
    {
        id: '3',
        title: 'AI-Powered Learning',
        description: 'Harness the power of state-of-the-art AI to personalize your study path and accelerate your potential.',
        icon: 'robot-outline',
        colors: ['#020617', '#6b21a8', '#d8b4fe'], // Obsidian -> Violet -> Orchid Glow
    },
    {
        id: '4',
        title: 'Achieve Your Goals',
        description: 'Track your progress, earn certificates, and bloom into the best version of yourself with MentIQ.',
        icon: 'trophy-variant-outline',
        colors: ['#020617', '#9f1239', '#fda4af'], // Obsidian -> Crimson -> Peach Glow
    },
];

interface PaginationProps {
    slides: typeof SLIDES;
    scrollX: Animated.Value;
    currentIndex: number;
    width: number;
    onNext: () => void;
    onSkip: () => void;
    onFinish: () => void;
}

function Pagination({ slides, scrollX, currentIndex, width, onNext, onSkip, onFinish }: PaginationProps) {
    return (
        <View style={styles.paginationContainer}>
            <View style={styles.dotsContainer}>
                {slides.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [10, 20, 10],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.5, 1, 0.5],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={`dot-${index}`}
                            style={[
                                styles.dot,
                                { width: dotWidth, opacity },
                                currentIndex === index && styles.activeDot,
                            ]}
                        />
                    );
                })}
            </View>

            <View style={styles.buttonContainer}>
                {currentIndex < slides.length - 1 ? (
                    <View style={styles.navigationButtons}>
                        <TouchableOpacity onPress={onSkip}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onNext} style={styles.nextButton}>
                            <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={onFinish} style={styles.startButton}>
                        <Text style={styles.startButtonText}>Get Started</Text>
                        <MaterialCommunityIcons name="rocket-launch-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const { width, height } = useWindowDimensions();

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            onFinish();
        }
    };

    const handleSkip = () => {
        onFinish();
    };

    const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
        return (
            <View style={[styles.slide, { width, height }]}>
                <LinearGradient
                    colors={item.colors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.slideGradient}
                >
                    <View style={styles.iconContainer}>
                        {index === 0 ? (
                            <Image
                                source={require('@/assets/images/Logo.png')}
                                style={styles.centralLogo}
                            />
                        ) : (
                            <MaterialCommunityIcons name={item.icon as any} size={120} color="#fff" />
                        )}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}
                bounces={false}
            />
            <Pagination
                slides={SLIDES}
                scrollX={scrollX}
                currentIndex={currentIndex}
                width={width}
                onNext={handleNext}
                onSkip={handleSkip}
                onFinish={onFinish}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    slide: {    },
    slideGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    iconContainer: {
        marginBottom: 60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: Spacing.m,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: Spacing.l,
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 40,
        gap: 8,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    activeDot: {
        backgroundColor: '#fff',
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: Spacing.xl,
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    skipText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    nextButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    startButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    centralLogo: {
        width: 150,
        height: 170,
        resizeMode: 'contain',
    },
});
