import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, AppShadows } from '../../constants/theme';
import { aiApi } from '../../services/ai.service';
import Markdown from 'react-native-markdown-display';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface QbitChatWindowProps {
    visible: boolean;
    onClose: () => void;
    lessonId?: string;
    scope?: 'lesson' | 'global';
}

export default function QbitChatWindow({ visible, onClose, lessonId, scope = 'global' }: QbitChatWindowProps) {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        text: "Hi! I'm Qbit. How can I help you learn today?",
        isUser: false,
        timestamp: new Date(),
    }]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: query,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const response = scope === 'lesson' && lessonId
                ? await aiApi.askLesson(userMsg.text, lessonId)
                : await aiApi.askGlobal(userMsg.text);
            const aiResponse = response.data.answer;

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponse,
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "My circuits are a bit jammed. Please try again later.",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible && messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages, visible]);

    const renderItem = useCallback(({ item }: { item: Message }) => (
        <View style={[
            styles.messageBubble,
            item.isUser ? styles.userBubble : styles.aiBubble
        ]}>
            {item.isUser ? (
                <Text style={[styles.messageText, styles.userText]}>
                    {item.text}
                </Text>
            ) : (
                <Markdown
                    style={{
                        body: { ...styles.messageText, ...styles.aiText },
                        heading1: { ...Typography.h3, color: Colors.light.primary, marginVertical: 4 },
                        heading2: { ...Typography.body, fontWeight: '700', marginVertical: 4 },
                        code_block: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
                        fence: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
                    }}
                >
                    {item.text}
                </Markdown>
            )}
            <Text style={[styles.timestamp, { color: item.isUser ? Colors.light.primaryLight : Colors.light.textLight }]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    ), []);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.avatar}>
                            <MaterialCommunityIcons name="robot" size={22} color={Colors.light.white} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Qbit AI</Text>
                            <Text style={styles.headerSubtitle}>{scope === 'lesson' ? 'Lesson Helper' : 'Study Companion'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={24} color={Colors.light.text} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatContent}
                    keyboardShouldPersistTaps="handled"
                    renderItem={renderItem}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask Qbit anything..."
                            value={query}
                            onChangeText={setQuery}
                            multiline
                            placeholderTextColor={Colors.light.textLight}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !query.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={loading || !query.trim()}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.light.white} size="small" />
                            ) : (
                                <MaterialCommunityIcons name="send" size={20} color={Colors.light.white} />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        backgroundColor: Colors.light.surface,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
    },
    headerTitle: {
        ...Typography.h3,
        color: Colors.light.text,
    },
    headerSubtitle: {
        ...Typography.caption,
        color: Colors.light.textSecondary,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        padding: Spacing.s,
    },
    chatContent: {
        padding: Spacing.m,
        gap: Spacing.m,
        paddingBottom: Spacing.xxl,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: Spacing.m,
        borderRadius: BorderRadius.l,
        ...AppShadows.small,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.light.primary,
        borderBottomRightRadius: 2,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.light.surface,
        borderBottomLeftRadius: 2,
    },
    messageText: {
        ...Typography.body,
    },
    userText: {
        color: Colors.light.white,
    },
    aiText: {
        color: Colors.light.text,
    },
    timestamp: {
        ...Typography.caption,
        fontSize: 10,
        marginTop: 4,
        width: '100%',
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.m,
        backgroundColor: Colors.light.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        gap: Spacing.s,
        marginBottom: Platform.OS === 'ios' ? 0 : Spacing.m,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius.l,
        paddingHorizontal: Spacing.m,
        paddingVertical: Spacing.s,
        maxHeight: 100,
        ...Typography.body,
        color: Colors.light.text,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Colors.light.textLight,
    },
});
