import { useAuthStore } from '@/store/authStore';
import { useQuizStore } from '@/store/quizStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useMemo } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
    StatusBar,
    ScrollView
} from 'react-native';
import { ActivityIndicator, Card, Searchbar, Text } from 'react-native-paper';
import { Colors, Spacing, AppShadows, BorderRadius, Typography } from '@/constants/theme';

export default function AllQuizzesScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const { fetchAllQuizzes, fetchAllAttempts, quizzes, quizAttempts, isLoading } = useQuizStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            await Promise.all([
                fetchAllQuizzes(),
                fetchAllAttempts()
            ]);
        } catch (error) {
            console.error('AllQuizzes - load error:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // Logic to determine status of each quiz
    const quizzesWithStatus = useMemo(() => {
        return quizzes.map(quiz => {
            // Find all attempts for this quiz
            const attempts = quizAttempts.filter(a => String(a.quizId) === String(quiz.id));

            // Check if any attempt passed
            const hasPassed = attempts.some(a => a.passed);
            const hasAttempted = attempts.length > 0;

            let status: 'passed' | 'failed' | 'not_started' = 'not_started';
            if (hasPassed) {
                status = 'passed';
            } else if (hasAttempted) {
                status = 'failed';
            }

            return {
                ...quiz,
                status,
                lastScore: hasAttempted ? Math.max(...attempts.map(a => a.score)) : null,
                totalAttempts: attempts.length,
                latestAttempt: attempts.length > 0 ? attempts[0] : null,
                todayAttemptsCount: attempts.filter(a => {
                    const date = new Date(a.attemptedAt || '');
                    const now = new Date();
                    return date.toDateString() === now.toDateString();
                }).length
            };
        });
    }, [quizzes, quizAttempts]);

    const filteredQuizzes = quizzesWithStatus.filter(quiz => {
        const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (quiz.courseTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        if (statusFilter === 'passed') {
            matchesFilter = quiz.status === 'passed';
        } else if (statusFilter === 'failed') {
            matchesFilter = quiz.status === 'failed';
        }

        return matchesSearch && matchesFilter;
    });

    const STATS_CONFIG = {
        all: { label: 'All Quizzes', icon: 'format-list-bulleted', color: Colors.light.primary },
        passed: { label: 'Passed', icon: 'check-decagram', color: '#059669' },
        failed: { label: 'Failed', icon: 'alert-decagram', color: '#dc2626' },
    };

    const renderQuizCard = ({ item }: { item: any }) => {
        const isPassed = item.status === 'passed';
        const isFailed = item.status === 'failed';
        const statusColor = isPassed ? '#059669' : isFailed ? '#dc2626' : Colors.light.textLight;
        const statusIcon = isPassed ? 'check-decagram' : isFailed ? 'alert-decagram' : 'circle-outline';

        return (
            <Card style={[styles.quizCard, AppShadows.light, { marginBottom: 16 }]}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: statusColor + '10' }]}>
                            <MaterialCommunityIcons name="lightning-bolt" size={24} color={statusColor} />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={[styles.courseTitle, { color: statusColor }]} numberOfLines={1}>
                                {item.courseTitle || 'Curriculum Mission'}
                            </Text>
                            <Text style={styles.quizTitle} numberOfLines={1}>{item.title}</Text>
                        </View>
                        <View style={styles.statusInfo}>
                            <MaterialCommunityIcons name={statusIcon} size={20} color={statusColor} />
                            <Text style={[styles.statusLabelText, { color: statusColor }]}>
                                {item.status === 'passed' ? 'Mastered' : item.status === 'failed' ? 'Failed' : 'Open'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.metaColumn}>
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="help-circle-outline" size={16} color={Colors.light.textSecondary} />
                                    <Text style={styles.metaText}>{item.totalQuestions || 0} Qs</Text>
                                </View>
                                <View style={styles.metaDivider} />
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.light.textSecondary} />
                                    <Text style={styles.metaText}>{item.timeLimit || 30}m</Text>
                                </View>
                            </View>
                            {isFailed && (
                                <View style={styles.limitRow}>
                                    <MaterialCommunityIcons name="calendar-clock" size={14} color="#dc2626" />
                                    <Text style={styles.limitText}>
                                        {3 - item.todayAttemptsCount} tries left today (Resets in 24h)
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.spacer} />

                        {isPassed ? (
                            <View style={styles.actionButtonGroup}>
                                <TouchableOpacity
                                    style={[styles.smallActionBtn, { borderColor: '#1e293b', borderWidth: 1 }]}
                                    onPress={() => navigation.navigate('QuizAnalysis', { attempt: item.latestAttempt })}
                                >
                                    <Text style={[styles.smallActionText, { color: '#1e293b' }]}>ANALYZE</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.smallActionBtn, { backgroundColor: '#059669' }]}
                                    onPress={() => navigation.navigate('Quiz', { quizId: item.id, courseId: item.courseId })}
                                >
                                    <Text style={styles.smallActionText}>RETAKE</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.startButton, { backgroundColor: statusColor === Colors.light.textLight ? Colors.light.primary : statusColor }]}
                                onPress={() => navigation.navigate('Quiz', { quizId: item.id, courseId: item.courseId })}
                            >
                                <Text style={styles.startButtonText}>
                                    {item.status === 'not_started' ? 'START MISSION' : 'REATTEMPT'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Curriculum Hub</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.searchWrapper}>
                    <Searchbar
                        placeholder="Search missions..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor="#64748b"
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {(['all', 'passed', 'failed'] as const).map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => setStatusFilter(filter)}
                                style={[
                                    styles.filterChip,
                                    statusFilter === filter && { backgroundColor: STATS_CONFIG[filter].color, borderColor: STATS_CONFIG[filter].color }
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={STATS_CONFIG[filter].icon as any}
                                    size={16}
                                    color={statusFilter === filter ? '#fff' : '#94a3b8'}
                                />
                                <Text style={[styles.filterText, statusFilter === filter && { color: '#fff' }]}>
                                    {STATS_CONFIG[filter].label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </LinearGradient>

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Syncing logs...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredQuizzes}
                    renderItem={renderQuizCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <MaterialCommunityIcons name="clipboard-text-off-outline" size={64} color="#e2e8f0" />
                            </View>
                            <Text style={styles.emptyText}>No missions found in this log.</Text>
                            <Text style={styles.emptySubText}>Try adjusting your filters or search query.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        ...Typography.bodySmall,
        color: '#64748b',
        fontWeight: '600',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: Spacing.l,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...AppShadows.medium,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        ...Typography.h2,
        color: '#fff',
        fontSize: 24,
        letterSpacing: -0.5,
    },
    searchWrapper: {
        marginBottom: 16,
    },
    searchBar: {
        borderRadius: BorderRadius.m,
        height: 50,
        backgroundColor: '#fff',
        elevation: 0,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        fontSize: 15,
        color: '#1e293b',
    },
    filterContainer: {
        marginTop: 4,
    },
    filterScroll: {
        gap: 10,
        paddingBottom: 4,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94a3b8',
    },
    listContent: {
        paddingHorizontal: Spacing.m,
        paddingTop: Spacing.m,
        paddingBottom: 40,
    },
    cardContainer: {
        marginBottom: Spacing.m,
    },
    quizCard: {
        backgroundColor: '#fff',
        borderRadius: BorderRadius.l,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    titleContainer: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    quizTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -0.2,
    },
    statusInfo: {
        alignItems: 'center',
        gap: 2,
    },
    statusLabelText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
        paddingTop: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '700',
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 12,
    },
    spacer: {
        flex: 1,
    },
    startButton: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        ...AppShadows.small,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    metaColumn: {
        gap: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    limitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    limitText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#dc2626',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    actionButtonGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    smallActionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallActionText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    emptyState: {
        marginTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...AppShadows.small,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500',
    },
});
