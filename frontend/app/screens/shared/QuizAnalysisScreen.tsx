import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function QuizAnalysisScreen({ route, navigation }: any) {
    const { attempt } = route.params;
    if (!attempt || !attempt.questions) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 100 }}>No attempt data found.</Text>
            </View>
        );
    }
    const { questions, answers = {} } = attempt;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Detailed Analysis</Text>
                        <Text style={styles.headerSub}>{attempt.quiz_title || 'Quiz Review'}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.summaryInfo}>
                    <Text style={styles.summaryText}>
                        Review your performance below. Correct answers are marked in green, while your mistakes are highlighted in red.
                    </Text>
                </View>

                {questions.map((question: any, index: number) => {
                    const studentAnswer = answers[String(question.id)] || 'No answer';
                    const isCorrect = studentAnswer.toLowerCase() === question.correct_answer.toLowerCase();
                    const options = [
                        { key: 'a', text: question.option_a },
                        { key: 'b', text: question.option_b },
                        { key: 'c', text: question.option_c },
                        { key: 'd', text: question.option_d },
                    ];

                    return (
                        <Card key={question.id} style={styles.questionCard}>
                            <Card.Content>
                                <View style={styles.questionHeader}>
                                    <View style={[styles.indexBadge, { backgroundColor: isCorrect ? '#dcfce7' : '#fee2e2' }]}>
                                        <Text style={[styles.indexText, { color: isCorrect ? '#166534' : '#991b1b' }]}>{index + 1}</Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name={isCorrect ? 'check-circle' : 'close-circle'}
                                        size={24}
                                        color={isCorrect ? '#16a34a' : '#dc2626'}
                                    />
                                </View>

                                <Text style={styles.questionText}>{question.question_text}</Text>

                                <View style={styles.optionsList}>
                                    {options.map((opt) => {
                                        if (!opt.text) return null;
                                        const isStudentChoice = studentAnswer.toLowerCase() === opt.key;
                                        const isCorrectChoice = question.correct_answer.toLowerCase() === opt.key;

                                        let borderColor = '#e2e8f0';
                                        let bgColor = '#fff';
                                        if (isStudentChoice) {
                                            borderColor = isCorrect ? '#22c55e' : '#ef4444';
                                            bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';
                                        } else if (isCorrectChoice) {
                                            borderColor = '#22c55e';
                                            bgColor = '#f0fdf4';
                                        }

                                        return (
                                            <View
                                                key={opt.key}
                                                style={[
                                                    styles.optionItem,
                                                    { borderColor, backgroundColor: bgColor },
                                                    (isStudentChoice || isCorrectChoice) && styles.highlightedOption
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.optionKey,
                                                    (isStudentChoice || isCorrectChoice) && { color: isCorrectChoice ? '#166534' : '#991b1b' }
                                                ]}>
                                                    {opt.key.toUpperCase()}
                                                </Text>
                                                <Text style={[
                                                    styles.optionText,
                                                    (isStudentChoice || isCorrectChoice) && { fontWeight: '700' }
                                                ]}>
                                                    {opt.text}
                                                </Text>
                                                {isCorrectChoice && (
                                                    <MaterialCommunityIcons name="check-bold" size={18} color="#166534" />
                                                )}
                                                {!isCorrect && isStudentChoice && (
                                                    <MaterialCommunityIcons name="close-thick" size={18} color="#991b1b" />
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>

                                {question.explanation && (
                                    <View style={styles.explanationBox}>
                                        <Text style={styles.explanationTitle}>Explanation:</Text>
                                        <Text style={styles.explanationText}>{question.explanation}</Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    );
                })}
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
        paddingBottom: 25,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    summaryInfo: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    summaryText: {
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20,
        fontWeight: '500',
    },
    questionCard: {
        marginBottom: 20,
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12000000000000001)',
        backgroundColor: '#fff',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    indexBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indexText: {
        fontSize: 14,
        fontWeight: '800',
    },
    questionText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 20,
        lineHeight: 24,
    },
    optionsList: {
        gap: 10,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 12,
    },
    highlightedOption: {
        borderWidth: 2,
    },
    optionKey: {
        fontSize: 14,
        fontWeight: '800',
        color: '#94a3b8',
        width: 20,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        color: '#334155',
    },
    explanationBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    explanationTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 5,
    },
    explanationText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 22,
    },
});

export default QuizAnalysisScreen;
