import { teacherApi } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    StatusBar,
    Dimensions,
} from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Card,
    ProgressBar,
    Text,
    Divider,
} from 'react-native-paper';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface StudentDetailData {
    student: {
        id: string;
        name: string;
        email: string;
    };
    courses: Array<{
        id: string;
        title: string;
        progress_percentage: number;
        enrolled_at: string;
        lessons: Array<{
            id: string;
            title: string;
            is_completed: boolean;
            time_spent: number;
            last_accessed: string | null;
        }>;
        quizzes: Array<{
            id: string;
            quiz_id: string;
            quiz_title: string;
            score: number;
            passed: boolean;
            attempted_at: string;
        }>;
    }>;
}

function StudentDetailScreen({ route, navigation }: any) {
    const { studentId, courseId } = route.params;
    const [data, setData] = useState<StudentDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes'>('lessons');
    const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);

    useEffect(() => {
        loadStudentDetail();
    }, [studentId, courseId]);

    const loadStudentDetail = async () => {
        try {
            setIsLoading(true);
            const response = await teacherApi.getStudentDetail(studentId, courseId);
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching student detail:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds === 0) return '0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4338ca" />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.centerContainer}>
                <Text>Student data not found</Text>
            </View>
        );
    }

    const currentCourse = data.courses[selectedCourseIdx];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Premium Header */}
            <LinearGradient
                colors={['#1e1b4b', '#312e81', '#4338ca']}
                style={styles.header}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.profileSection}>
                    <Avatar.Text
                        size={80}
                        label={data.student.name.charAt(0)}
                        style={styles.avatar}
                        labelStyle={styles.avatarLabel}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.studentName}>{data.student.name}</Text>
                        <Text style={styles.studentEmail}>{data.student.email}</Text>
                        <View style={styles.badgeRow}>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>STUDENT</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Course Selector if multiple courses */}
            {data.courses.length > 1 && (
                <View style={styles.courseSelector}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseScroll}>
                        {data.courses.map((c, idx) => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.coursePill, selectedCourseIdx === idx && styles.coursePillActive]}
                                onPress={() => setSelectedCourseIdx(idx)}
                            >
                                <Text style={[styles.coursePillText, selectedCourseIdx === idx && styles.coursePillTextActive]}>
                                    {c.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Main Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {currentCourse ? (
                    <>
                        {/* Progress Card */}
                        <Card style={styles.progressCard}>
                            <Card.Content>
                                <View style={styles.moduleHeader}>
                                    <Text style={styles.moduleTitle}>{currentCourse.title}</Text>
                                    <Text style={styles.percentageText}>{Math.round(currentCourse.progress_percentage)}%</Text>
                                </View>
                                <ProgressBar
                                    progress={currentCourse.progress_percentage / 100}
                                    color="#4338ca"
                                    style={styles.progressBar}
                                />
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{currentCourse.lessons.filter(l => l.is_completed).length}</Text>
                                        <Text style={styles.statLabel}>Lessons Done</Text>
                                    </View>
                                    <Divider style={styles.divider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{currentCourse.quizzes.length}</Text>
                                        <Text style={styles.statLabel}>Quizzes Taken</Text>
                                    </View>
                                    <Divider style={styles.divider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {formatTime(currentCourse.lessons.reduce((acc, l) => acc + l.time_spent, 0))}
                                        </Text>
                                        <Text style={styles.statLabel}>Total Time</Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>

                        {/* Content Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
                                onPress={() => setActiveTab('lessons')}
                            >
                                <MaterialCommunityIcons
                                    name="book-open-variant"
                                    size={20}
                                    color={activeTab === 'lessons' ? '#4338ca' : '#64748b'}
                                />
                                <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>Lessons</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]}
                                onPress={() => setActiveTab('quizzes')}
                            >
                                <MaterialCommunityIcons
                                    name="clipboard-check"
                                    size={20}
                                    color={activeTab === 'quizzes' ? '#4338ca' : '#64748b'}
                                />
                                <Text style={[styles.tabText, activeTab === 'quizzes' && styles.activeTabText]}>Quizzes</Text>
                            </TouchableOpacity>
                        </View>

                        {/* List Content */}
                        <View style={styles.listSection}>
                            {activeTab === 'lessons' ? (
                                currentCourse.lessons.length > 0 ? (
                                    currentCourse.lessons.map((lesson) => (
                                        <View key={lesson.id} style={styles.itemRow}>
                                            <View style={[styles.statusIndicator, { backgroundColor: lesson.is_completed ? '#10b981' : '#e2e8f0' }]}>
                                                <MaterialCommunityIcons
                                                    name={lesson.is_completed ? "check" : "clock-outline"}
                                                    size={16}
                                                    color={lesson.is_completed ? "#fff" : "#94a3b8"}
                                                />
                                            </View>
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemTitle}>{lesson.title}</Text>
                                                <Text style={styles.itemMeta}>
                                                    {lesson.is_completed ? 'Completed' : 'Not started'} • {formatTime(lesson.time_spent)} spent
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No lessons found</Text>
                                )
                            ) : (
                                currentCourse.quizzes.length > 0 ? (
                                    currentCourse.quizzes.map((quiz) => (
                                        <View key={quiz.id} style={styles.itemRow}>
                                            <View style={[styles.statusIndicator, { backgroundColor: quiz.passed ? '#10b981' : '#ef4444' }]}>
                                                <MaterialCommunityIcons
                                                    name={quiz.passed ? "trophy" : "alert-circle"}
                                                    size={16}
                                                    color="#fff"
                                                />
                                            </View>
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemTitle}>{quiz.quiz_title}</Text>
                                                <Text style={styles.itemMeta}>
                                                    Score: {quiz.score}% • {quiz.passed ? 'Passed' : 'Failed'} • {formatDate(quiz.attempted_at)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No quizzes attempted yet</Text>
                                )
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No course data available</Text>
                    </View>
                )}
            </ScrollView>
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
    header: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    avatar: {
        backgroundColor: '#fff',
        elevation: 4,
    },
    avatarLabel: {
        color: '#312e81',
        fontWeight: '800',
    },
    profileInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    studentEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    roleText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    courseSelector: {
        marginTop: -20,
        zIndex: 10,
    },
    courseScroll: {
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    coursePill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginRight: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    coursePillActive: {
        backgroundColor: '#4338ca',
    },
    coursePillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    coursePillTextActive: {
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    progressCard: {
        borderRadius: 24,
        backgroundColor: '#fff',
        elevation: 2,
        marginTop: 10,
        marginBottom: 20,
    },
    moduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    moduleTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        flex: 1,
        marginRight: 10,
    },
    percentageText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#4338ca',
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#f1f5f9',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#e2e8f0',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        padding: 6,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 8,
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#fff',
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    activeTabText: {
        color: '#4338ca',
    },
    listSection: {
        paddingBottom: 40,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statusIndicator: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    itemMeta: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 20,
        fontSize: 14,
    },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
    }
});

export default StudentDetailScreen;
