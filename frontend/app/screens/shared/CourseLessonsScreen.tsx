import { Colors, Spacing, AppShadows, BorderRadius, Typography } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
    StatusBar,
} from 'react-native';
import { ActivityIndicator, Card, Searchbar, Text } from 'react-native-paper';

export default function CourseLessonsScreen({ route, navigation }: any) {
    const { courseId, courseTitle } = route.params;
    const { user } = useAuthStore();
    const { fetchLessons, lessons, isLoading } = useCourseStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLessons();
    }, [courseId]);

    const loadLessons = async () => {
        await fetchLessons(courseId);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLessons();
        setRefreshing(false);
    };

    const filteredLessons = lessons.filter(lesson =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lesson.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderLessonItem = ({ item, index }: { item: any, index: number }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('LessonDetail', { lessonId: item.id, courseId })}
            style={styles.cardContainer}
        >
            <Card style={[styles.lessonCard, AppShadows.light]}>
                <Card.Content style={styles.cardContent}>
                    <View style={styles.lessonIndex}>
                        <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.lessonDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>
                        <View style={styles.metaRow}>
                            {item.duration && (
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="clock-outline" size={14} color="#64748b" />
                                    <Text style={styles.metaText}>{item.duration}m</Text>
                                </View>
                            )}
                            {item.videoUrl && (
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="play-circle-outline" size={14} color="#64748b" />
                                    <Text style={styles.metaText}>Video</Text>
                                </View>
                            )}
                            {item.fileUrl && (
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="file-document-outline" size={14} color="#64748b" />
                                    <Text style={styles.metaText}>Resource</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.titleWrapper}>
                        <Text style={styles.headerTitle}>Curriculum</Text>
                        <Text style={styles.headerSub} numberOfLines={1}>{courseTitle || 'Course Lessons'}</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <Searchbar
                    placeholder="Search lessons..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    iconColor="#64748b"
                    placeholderTextColor="#94a3b8"
                />
            </LinearGradient>

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.loadingText}>Loading curriculum...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredLessons}
                    renderItem={renderLessonItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="book-open-blank-variant" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyText}>No lessons found.</Text>
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
        color: '#64748b',
        fontWeight: '600',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    headerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
    },
    searchBar: {
        borderRadius: 12,
        height: 48,
        backgroundColor: '#fff',
        boxShadow: 'none',
    },
    searchInput: {
        fontSize: 15,
        minHeight: 0,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    cardContainer: {
        marginBottom: 16,
    },
    lessonCard: {
        borderRadius: 16,
        backgroundColor: '#fff',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    lessonIndex: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    indexText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#64748b',
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    lessonDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '600',
    },
});
