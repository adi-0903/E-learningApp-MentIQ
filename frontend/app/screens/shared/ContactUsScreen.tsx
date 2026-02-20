import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { submitContactForm } from '@/services/emailService';

interface FormData {
    sender_name: string;
    sender_email: string;
    subject: string;
    message: string;
}

const SUBJECTS = [
    'General Inquiry',
    'Technical Support',
    'Course Issues',
    'Billing & Payments',
    'Report a Bug',
    'Feature Request',
    'Other',
];

export default function ContactUsScreen({ navigation }: any) {
    const [form, setForm] = useState<FormData>({
        sender_name: '',
        sender_email: '',
        subject: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [showSubjects, setShowSubjects] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handleSend = async () => {
        if (!form.sender_name.trim()) return Alert.alert('Required', 'Please enter your name.');
        if (!form.sender_email.trim() || !form.sender_email.includes('@'))
            return Alert.alert('Required', 'Please enter a valid email.');
        if (!form.subject.trim()) return Alert.alert('Required', 'Please select a subject.');
        if (!form.message.trim() || form.message.length < 10)
            return Alert.alert('Required', 'Message must be at least 10 characters.');

        // Button press animation
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();

        setLoading(true);
        const result = await submitContactForm(form);
        setLoading(false);

        if (result.success) {
            setSent(true);
        } else {
            Alert.alert('Error', result.message);
        }
    };

    if (sent) {
        return (
            <View style={styles.successContainer}>
                <LinearGradient
                    colors={['#0f172a', '#1e293b', '#0f172a']}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.successCard}>
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        style={styles.successIconBg}
                    >
                        <Ionicons name="checkmark" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.successTitle}>Message Sent! 🎉</Text>
                    <Text style={styles.successText}>
                        We've received your message and will get back to you at{' '}
                        <Text style={styles.successEmailHighlight}>{form.sender_email}</Text>{' '}
                        within 24 hours.
                    </Text>
                    <TouchableOpacity
                        style={styles.successBtn}
                        onPress={() => navigation?.goBack()}
                    >
                        <LinearGradient
                            colors={['#6366f1', '#8b5cf6']}
                            style={styles.successBtnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.successBtnText}>Back to App</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFillObject}
            />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation?.goBack()}
                    >
                        <Ionicons name="chevron-back" size={22} color="#94a3b8" />
                    </TouchableOpacity>

                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6', '#a855f7']}
                        style={styles.headerIconBg}
                    >
                        <Ionicons name="mail" size={28} color="#fff" />
                    </LinearGradient>

                    <Text style={styles.headerTitle}>Contact Support</Text>
                    <Text style={styles.headerSubtitle}>
                        We typically reply within 24 hours
                    </Text>
                </View>
                {/* Contact Cards */}
                <View style={styles.contactCards}>
                    <View style={styles.contactCard}>
                        <Ionicons name="mail-outline" size={18} color="#6366f1" />
                        <Text style={styles.contactCardText}>mentiq.learn@gmail.com</Text>
                    </View>
                    <View style={styles.contactCard}>
                        <Ionicons name="time-outline" size={18} color="#8b5cf6" />
                        <Text style={styles.contactCardText}>Mon–Fri, 9am–6pm IST</Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Name */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <View style={[
                            styles.inputWrap,
                            focusedField === 'name' && styles.inputWrapFocused,
                        ]}>
                            <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? '#6366f1' : '#475569'} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Your full name"
                                placeholderTextColor="#475569"
                                value={form.sender_name}
                                onChangeText={v => setForm(p => ({ ...p, sender_name: v }))}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email Address *</Text>
                        <View style={[
                            styles.inputWrap,
                            focusedField === 'email' && styles.inputWrapFocused,
                        ]}>
                            <Ionicons name="at-outline" size={18} color={focusedField === 'email' ? '#6366f1' : '#475569'} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="your@email.com"
                                placeholderTextColor="#475569"
                                value={form.sender_email}
                                onChangeText={v => setForm(p => ({ ...p, sender_email: v }))}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Subject picker */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Subject *</Text>
                        <TouchableOpacity
                            style={[styles.inputWrap, focusedField === 'subject' && styles.inputWrapFocused]}
                            onPress={() => setShowSubjects(v => !v)}
                        >
                            <Ionicons name="chatbubble-outline" size={18} color={form.subject ? '#6366f1' : '#475569'} style={styles.inputIcon} />
                            <Text style={[styles.input, { paddingTop: 15, color: form.subject ? '#e2e8f0' : '#475569' }]}>
                                {form.subject || 'Select a subject...'}
                            </Text>
                            <Ionicons
                                name={showSubjects ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color="#475569"
                                style={{ alignSelf: 'center', marginRight: 14 }}
                            />
                        </TouchableOpacity>

                        {showSubjects && (
                            <View style={styles.subjectDropdown}>
                                {SUBJECTS.map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.subjectOption, form.subject === s && styles.subjectOptionActive]}
                                        onPress={() => {
                                            setForm(p => ({ ...p, subject: s }));
                                            setShowSubjects(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.subjectOptionText,
                                            form.subject === s && styles.subjectOptionTextActive,
                                        ]}>{s}</Text>
                                        {form.subject === s && (
                                            <Ionicons name="checkmark" size={16} color="#6366f1" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Message */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Message *</Text>
                        <View style={[
                            styles.inputWrap,
                            styles.textAreaWrap,
                            focusedField === 'message' && styles.inputWrapFocused,
                        ]}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe your issue or question in detail..."
                                placeholderTextColor="#475569"
                                value={form.message}
                                onChangeText={v => setForm(p => ({ ...p, message: v }))}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                onFocus={() => setFocusedField('message')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                        <Text style={styles.charCount}>{form.message.length} characters</Text>
                    </View>

                    {/* Send Button */}
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={loading ? ['#374151', '#374151'] : ['#6366f1', '#8b5cf6']}
                                style={styles.sendBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="send" size={18} color="#fff" />
                                        <Text style={styles.sendBtnText}>Send Message</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Disclaimer */}
                    <Text style={styles.disclaimer}>
                        🔒 Your message is encrypted and stored securely. We do not share your information.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scroll: { paddingBottom: 40 },

    // Header
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
    backBtn: {
        position: 'absolute', top: 56, left: 24,
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerIconBg: {
        width: 70, height: 70, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, marginTop: 8,
    },
    headerTitle: {
        fontSize: 26, fontWeight: '700', color: '#f1f5f9', letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14, color: '#64748b', marginTop: 6, textAlign: 'center',
    },

    // Contact cards
    contactCards: {
        flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24,
    },
    contactCard: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12, padding: 12,
    },
    contactCardText: { fontSize: 11, color: '#94a3b8', flex: 1 },

    // Form
    form: { paddingHorizontal: 20, gap: 0 },
    fieldGroup: { marginBottom: 18 },
    label: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 8, letterSpacing: 0.3 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14, overflow: 'hidden',
    },
    inputWrapFocused: {
        borderColor: 'rgba(99,102,241,0.6)',
        backgroundColor: 'rgba(99,102,241,0.06)',
    },
    inputIcon: { marginLeft: 14 },
    input: {
        flex: 1, padding: 14, fontSize: 15,
        color: '#e2e8f0',
    },

    // Textarea
    textAreaWrap: { alignItems: 'flex-start' },
    textArea: { minHeight: 130, paddingTop: 14 },
    charCount: { fontSize: 11, color: '#334155', textAlign: 'right', marginTop: 6 },

    // Subject dropdown
    subjectDropdown: {
        backgroundColor: '#1e293b',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12, marginTop: 6, overflow: 'hidden',
    },
    subjectOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    subjectOptionActive: { backgroundColor: 'rgba(99,102,241,0.12)' },
    subjectOptionText: { fontSize: 14, color: '#94a3b8' },
    subjectOptionTextActive: { color: '#c4b5fd', fontWeight: '600' },

    // Send button
    sendBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, borderRadius: 14, paddingVertical: 16, marginTop: 8,
    },
    sendBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    // Disclaimer
    disclaimer: {
        fontSize: 11, color: '#334155', textAlign: 'center',
        marginTop: 16, lineHeight: 18,
    },

    // Success screen
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successCard: {
        margin: 24, padding: 36, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
    },
    successIconBg: {
        width: 80, height: 80, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    successTitle: {
        fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginBottom: 14,
    },
    successText: {
        fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 24,
    },
    successEmailHighlight: { color: '#c4b5fd', fontWeight: '600' },
    successBtn: { marginTop: 28, width: '100%', borderRadius: 14, overflow: 'hidden' },
    successBtnGradient: {
        paddingVertical: 15, alignItems: 'center', borderRadius: 14,
    },
    successBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
