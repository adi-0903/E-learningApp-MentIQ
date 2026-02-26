import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Animated, Easing, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppShadows } from '@/constants/theme';
import { useQuizStore } from '@/store/quizStore';

function QuizResultScreen({ route, navigation }: any) {
    const { score, correctAnswers, totalQuestions, courseId, quizId, passingScore = 70, attempt } = route.params;
    const isPassed = score >= passingScore;
    const { fetchStudentAttempts, quizAttempts } = useQuizStore();

    // --- Attempt Logic ---
    const [attemptsToday, setAttemptsToday] = useState(0);
    const [canReattempt, setCanReattempt] = useState(false);
    const [timeLeftToRenew, setTimeLeftToRenew] = useState<string | null>(null);

    useEffect(() => {
        if (quizId) {
            fetchStudentAttempts('', quizId);
        }
    }, [quizId]);

    useEffect(() => {
        if (!quizAttempts) return;

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentAttempts = quizAttempts.filter(a => {
            const dateStr = a.attemptedAt || (a as any).completed_at;
            if (!dateStr) return false;
            const attemptDate = new Date(dateStr);
            return attemptDate > oneDayAgo;
        });

        setAttemptsToday(recentAttempts.length);

        const limitReached = recentAttempts.length >= 3;
        const reattemptPossible = !isPassed && !limitReached;
        setCanReattempt(reattemptPossible);

        if (limitReached && !isPassed) {
            const timestamps = recentAttempts.map(a => new Date(a.attemptedAt || (a as any).completed_at).getTime());
            const oldestRecent = new Date(Math.min(...timestamps));
            const renewalDate = new Date(oldestRecent.getTime() + 24 * 60 * 60 * 1000);

            const timer = setInterval(() => {
                const diff = renewalDate.getTime() - new Date().getTime();
                if (diff <= 0) {
                    setTimeLeftToRenew(null);
                    setCanReattempt(!isPassed);
                    clearInterval(timer);
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeLeftToRenew(`${hours}h ${minutes}m`);
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [quizAttempts, isPassed]);

    // --- Cinematic Animation Set ---
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-100)).current;
    const trophyScale = useRef(new Animated.Value(0)).current;
    const trophyRotate = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(30)).current;
    const scoreCount = useRef(new Animated.Value(0)).current;
    const raysRotate = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(1)).current;

    // Staggered Stat Items
    const stat1Slide = useRef(new Animated.Value(20)).current;
    const stat2Slide = useRef(new Animated.Value(20)).current;
    const stat3Slide = useRef(new Animated.Value(20)).current;
    const statOpacity = useRef(new Animated.Value(0)).current;

    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        // 1. Initial Sequence: Header -> Trophy -> Content
        Animated.sequence([
            // Slide header in
            Animated.timing(headerSlide, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            // Pop trophy with spring
            Animated.spring(trophyScale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }),
            // Slide content and fade in stats
            Animated.parallel([
                Animated.timing(contentSlide, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            // Staggered Stats Entrance
            Animated.stagger(150, [
                Animated.parallel([
                    Animated.timing(statOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(stat1Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
                ]),
                Animated.timing(stat2Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(stat3Slide, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
        ]).start();

        // 2. Continuous Background Rays Rotation
        Animated.loop(
            Animated.timing(raysRotate, {
                toValue: 1,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 3. Score Counting Effect
        scoreCount.addListener(({ value }) => {
            setDisplayScore(Math.round(value));
        });
        Animated.timing(scoreCount, {
            toValue: score,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false, // Listener needs JS thread
        }).start();

        // 4. Floating & Glow Pulse
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(glowPulse, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
                    Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(trophyRotate, { toValue: -0.05, duration: 1500, useNativeDriver: true }),
                    Animated.timing(trophyRotate, { toValue: 0.05, duration: 1500, useNativeDriver: true }),
                ])
            ])
        ).start();
    }, []);

    const rotationValue = raysRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const trophyTilt = trophyRotate.interpolate({
        inputRange: [-0.1, 0.1],
        outputRange: ['-5deg', '5deg'],
    });

    const handleReattempt = () => {
        if (canReattempt) {
            navigation.replace('Quiz', { quizId, courseId });
        } else if (!isPassed && attemptsToday >= 3) {
            Alert.alert('Limit Reached', `You've used all 3 attempts for today. Next attempt available in ${timeLeftToRenew}.`);
        }
    };

    const handleSeeAnalysis = () => {
        navigation.navigate('QuizAnalysis', { attempt });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Premium Header - Animated Entrance */}
            <Animated.View style={{ transform: [{ translateY: headerSlide }], zIndex: 10 }}>
                <LinearGradient
                    colors={isPassed ? ['#065f46', '#059669', '#10b981'] : ['#991b1b', '#dc2626', '#ef4444']}
                    style={styles.header}
                >
                    <View style={styles.headerDecoration} />
                    <Text style={styles.headerSub}>Assessment Outcome</Text>
                    <Text style={styles.headerTitle}>Quiz Results</Text>
                </LinearGradient>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Trophy Section with Rays & Glow */}
                <View style={styles.trophyWrapper}>
                    {isPassed && (
                        <Animated.View style={[styles.raysContainer, { transform: [{ rotate: rotationValue }] }]}>
                            <MaterialCommunityIcons name="brightness-7" size={240} color="rgba(16, 185, 129, 0.1)" />
                        </Animated.View>
                    )}

                    <Animated.View style={[
                        styles.glowLayer,
                        { transform: [{ scale: glowPulse }], opacity: isPassed ? 0.3 : 0.1, backgroundColor: isPassed ? '#10b981' : '#ef4444' }
                    ]} />

                    <Animated.View style={[
                        isPassed ? styles.successIconContainer : styles.errorIconContainer,
                        {
                            transform: [
                                { scale: trophyScale },
                                { rotate: trophyTilt }
                            ]
                        }
                    ]}>
                        <MaterialCommunityIcons
                            name={isPassed ? 'trophy' : 'alert-octagon'}
                            size={70}
                            color={isPassed ? '#16a34a' : '#dc2626'}
                        />
                    </Animated.View>
                </View>

                {/* Content Section */}
                <Animated.View style={{
                    width: '100%',
                    alignItems: 'center',
                    opacity: fadeAnim,
                    transform: [{ translateY: contentSlide }]
                }}>
                    <Text style={[styles.statusText, { color: isPassed ? '#065f46' : '#991b1b' }]}>
                        {isPassed ? 'Mastery Achieved!' : 'Growth Opportunity'}
                    </Text>
                    <Text style={styles.statusSub}>
                        {isPassed
                            ? "Exemplary performance! You've successfully conquered this assessment with flying colors."
                            : `A few more practice sessions will get you there. You have ${3 - attemptsToday} attempts left for today.`}
                    </Text>

                    {/* Animated Score Card */}
                    <Card style={[styles.scoreCard, { overflow: 'hidden' }]}>
                        <LinearGradient colors={['#ffffff', '#f8fafc']} style={{ padding: 16 }}>
                            <View style={styles.scoreRow}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.scoreLabel}>Final Grade</Text>
                                    <View style={styles.scoreNumberRow}>
                                        <Text style={[styles.scoreValue, { color: isPassed ? '#059669' : '#dc2626' }]}>
                                            {displayScore}
                                        </Text>
                                        <Text style={[styles.percentSign, { color: isPassed ? '#059669' : '#dc2626' }]}>%</Text>
                                    </View>
                                </View>
                                <View style={styles.verticalDivider} />
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.scoreLabel}>Passing Threshold</Text>
                                    <Text style={styles.scoreValueSecondary}>{passingScore}%</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* Staggered Stats Grid */}
                            <Animated.View style={[styles.statsGrid, { opacity: statOpacity }]}>
                                <Animated.View style={[styles.statItem, { transform: [{ translateY: stat1Slide }] }]}>
                                    <View style={[styles.statBadge, { backgroundColor: '#f0fdf4' }]}>
                                        <MaterialCommunityIcons name="check-bold" size={14} color="#16a34a" />
                                    </View>
                                    <Text style={styles.statLabel}>CORRECT</Text>
                                    <Text style={styles.statValue}>{correctAnswers}</Text>
                                </Animated.View>

                                <Animated.View style={[styles.statItem, { transform: [{ translateY: stat2Slide }] }]}>
                                    <View style={[styles.statBadge, { backgroundColor: '#eff6ff' }]}>
                                        <MaterialCommunityIcons name="format-list-numbered" size={14} color="#2563eb" />
                                    </View>
                                    <Text style={styles.statLabel}>QUESTIONS</Text>
                                    <Text style={styles.statValue}>{totalQuestions}</Text>
                                </Animated.View>

                                <Animated.View style={[styles.statItem, { transform: [{ translateY: stat3Slide }] }]}>
                                    <View style={[styles.statBadge, { backgroundColor: '#fff7ed' }]}>
                                        <MaterialCommunityIcons name="bullseye-arrow" size={14} color="#d97706" />
                                    </View>
                                    <Text style={styles.statLabel}>ACCURACY</Text>
                                    <Text style={styles.statValue}>{Math.round((correctAnswers / totalQuestions) * 100)}%</Text>
                                </Animated.View>
                            </Animated.View>
                        </LinearGradient>
                    </Card>

                    <View style={styles.actionContainer}>
                        {!isPassed && (
                            <TouchableOpacity
                                style={[styles.primaryButton, (!canReattempt && attemptsToday >= 3) && { opacity: 0.6 }]}
                                onPress={handleReattempt}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#d97706', '#b45309']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonGradient}
                                >
                                    <MaterialCommunityIcons name="refresh" size={22} color="#fff" />
                                    <Text style={styles.buttonText}>
                                        {attemptsToday >= 3 ? `Unlock in ${timeLeftToRenew || 'some time'}` : 'Retake Quiz'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.analysisButton}
                            onPress={handleSeeAnalysis}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="file-search-outline" size={20} color="#1e293b" />
                            <Text style={styles.analysisButtonText}>Review Answers & Analysis</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerSmall} />

                        <TouchableOpacity
                            style={styles.secondaryButtonCircle}
                            onPress={() => navigation.navigate('CourseDetail', { courseId })}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
                            <Text style={styles.secondaryButtonText}>Back to Course</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.tertiaryButton}
                            onPress={() => navigation.navigate('StudentHome')}
                        >
                            <Text style={styles.tertiaryButtonText}>Return to Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: 'center',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)',
    },
    headerDecoration: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    content: {
        padding: 24,
        alignItems: 'center',
        paddingBottom: 40,
    },
    trophyWrapper: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
        position: 'relative',
    },
    raysContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowLayer: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        opacity: 0.2,
    },
    successIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
    },
    errorIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)',
    },
    statusText: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    statusSub: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        paddingHorizontal: 15,
        marginBottom: 35,
        lineHeight: 24,
    },
    scoreCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 30,
        borderWidth: 0,
        ...AppShadows.medium,
        marginBottom: 35,
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
    },
    verticalDivider: {
        width: 1,
        height: 50,
        backgroundColor: '#f1f5f9',
    },
    scoreLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    scoreNumberRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: '900',
        lineHeight: 52,
    },
    percentSign: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 6,
        marginLeft: 2,
    },
    scoreValueSecondary: {
        fontSize: 48,
        fontWeight: '900',
        color: '#1e293b',
        lineHeight: 52,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 25,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        marginBottom: 4,
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
    },
    actionContainer: {
        width: '100%',
        gap: 16,
        alignItems: 'center',
    },
    primaryButton: {
        width: '100%',
        height: 64,
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 15px rgba(15, 23, 42, 0.3)',
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    secondaryButtonCircle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        gap: 8,
    },
    secondaryButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '700',
    },
    analysisButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 5,
    },
    analysisButtonText: {
        color: '#1e293b',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerSmall: {
        width: 40,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
    },
    tertiaryButton: {
        paddingVertical: 10,
    },
    tertiaryButtonText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default QuizResultScreen;
