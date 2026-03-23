import { useAuthStore } from '@/store/authStore';
import { analyticsApi } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, Animated } from 'react-native';
import { Button, Card, Divider, Switch, Text, TextInput } from 'react-native-paper';
import { Colors, Spacing, AppShadows, BorderRadius, Typography } from '@/constants/theme';

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

function SecurityScreen({ navigation }: any) {
    const { user, changePassword } = useAuthStore();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [biometricLogin, setBiometricLogin] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    // Usage Log State
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);

    const checkBiometricSupport = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsBiometricSupported(compatible);

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (compatible && isEnrolled) {
            const savedPref = await AsyncStorage.getItem('biometric_enabled');
            setBiometricLogin(savedPref === 'true');
        }
    };

    const toggleBiometric = async (value: boolean) => {
        if (value) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm identity to enable Biometric Login',
            });
            if (result.success) {
                setBiometricLogin(true);
                await AsyncStorage.setItem('biometric_enabled', 'true');
                Alert.alert('Success', 'Biometric security activated.');
            } else {
                setBiometricLogin(false);
            }
        } else {
            setBiometricLogin(false);
            await AsyncStorage.setItem('biometric_enabled', 'false');
        }
    };

    useEffect(() => {
        fetchLogs();
        checkBiometricSupport();
    }, []);

    const fetchLogs = async () => {
        try {
            setIsLoadingLogs(true);
            const response = await analyticsApi.getActivityLogs();
            if (response.ok) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Required', 'Please fill in all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Mismatch', 'Confirmation password does not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Weak Password', 'Wait! Password must be at least 6 characters for safety');
            return;
        }

        try {
            setIsChangingPassword(true);
            await changePassword(currentPassword, newPassword, confirmPassword);
            Alert.alert('Completed', 'Your security wall has been updated!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Verification failed. Try again.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const remainingSecs = seconds % 60;
        if (mins < 60) return `${mins}m ${remainingSecs}s`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}h ${remainingMins}m`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isStudent = user?.role === 'student';
    const themeColors = (isStudent
        ? ['#06201f', '#064e3b', '#134e4a']
        : ['#0f172a', '#1e293b', '#334155']) as readonly [string, string, ...string[]];

    const accentColor = isStudent ? '#10b981' : '#3b82f6';
    const primaryBtnColor = isStudent ? '#0f766e' : '#1e293b';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={themeColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumHeader}
            >
                <View style={[StyleSheet.absoluteFill, { opacity: 0.1 }]}>
                    <MaterialCommunityIcons
                        name="security"
                        size={300}
                        color={isStudent ? "#2dd4bf" : "#fff"}
                        style={styles.bgIcon}
                    />
                </View>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Security Vault</Text>
                    <Text style={styles.headerSubtitle}>Proactive Protection & Privacy Control</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Status Dashboard */}
                <View style={styles.dashboardGrid}>
                    <View style={styles.dashboardItem}>
                        <View style={[styles.dashIconBg, { backgroundColor: '#ecfdf5' }]}>
                            <MaterialCommunityIcons name="shield-check" size={24} color="#10b981" />
                        </View>
                        <Text style={styles.dashLabel}>SSL State</Text>
                        <Text style={styles.dashVal}>Encrypted</Text>
                    </View>
                    <View style={styles.dashboardItem}>
                        <View style={[styles.dashIconBg, { backgroundColor: isStudent ? '#f0fdf4' : '#eff6ff' }]}>
                            <MaterialCommunityIcons name="server-security" size={24} color={accentColor} />
                        </View>
                        <Text style={styles.dashLabel}>Session</Text>
                        <Text style={styles.dashVal}>Restricted</Text>
                    </View>
                    <View style={styles.dashboardItem}>
                        <View style={[styles.dashIconBg, { backgroundColor: '#fff7ed' }]}>
                            <MaterialCommunityIcons name="security-network" size={24} color="#f59e0b" />
                        </View>
                        <Text style={styles.dashLabel}>Firewall</Text>
                        <Text style={styles.dashVal}>Active</Text>
                    </View>
                </View>

                {/* Password Management */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <MaterialCommunityIcons name="form-textbox-password" size={20} color="#334155" />
                        <Text style={styles.sectionTitle}>Update Credentials</Text>
                    </View>
                    <Text style={styles.sectionHint}>Last changed: 3 months ago</Text>
                </View>

                <Card style={styles.premiumCard}>
                    <Card.Content>
                        <TextInput
                            label="Current Identity Token"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showPassword}
                            mode="flat"
                            style={styles.glassInput}
                            textColor="#1e293b"
                            placeholderTextColor="#94a3b8"
                            activeUnderlineColor={accentColor}
                            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} color="#64748b" onPress={() => setShowPassword(!showPassword)} />}
                        />
                        <TextInput
                            label="New Secret Code"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showPassword}
                            mode="flat"
                            style={styles.glassInput}
                            textColor="#1e293b"
                            activeUnderlineColor={accentColor}
                        />
                        <TextInput
                            label="Validate New Code"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            mode="flat"
                            style={styles.glassInput}
                            textColor="#1e293b"
                            activeUnderlineColor={accentColor}
                        />
                        <Button
                            mode="contained"
                            onPress={handleChangePassword}
                            loading={isChangingPassword}
                            disabled={isChangingPassword}
                            buttonColor={primaryBtnColor}
                            textColor="#fff"
                            style={styles.actionBtn}
                            contentStyle={styles.actionBtnContent}
                            labelStyle={styles.actionBtnLabel}
                        >
                            Confirm Updates
                        </Button>
                    </Card.Content>
                </Card>

                {/* Intelligent Access */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <MaterialCommunityIcons name="fingerprint" size={20} color="#334155" />
                        <Text style={styles.sectionTitle}>Identity Verification</Text>
                    </View>
                </View>

                <Card style={styles.premiumCard}>
                    <Card.Content>
                        <View style={styles.settingItem}>
                            <View style={styles.settingTextContent}>
                                <Text style={styles.settingMainLabel}>Biometric Unlock</Text>
                                <Text style={styles.settingSubLabel}>
                                    {isBiometricSupported ? 'Hardware acceleration active' : 'Unavailable on this device'}
                                </Text>
                            </View>
                            <Switch
                                value={biometricLogin}
                                onValueChange={toggleBiometric}
                                color="#10b981"
                                disabled={!isBiometricSupported}
                            />
                        </View>
                    </Card.Content>
                </Card>

                {/* Live Activity Feed */}
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <MaterialCommunityIcons name="pulse" size={20} color="#ef4444" />
                        <Text style={styles.sectionTitle}>Live Activity Feed</Text>
                    </View>
                    <TouchableOpacity onPress={fetchLogs} style={styles.refreshBadge}>
                        <MaterialCommunityIcons name="sync" size={14} color="#64748b" />
                        <Text style={styles.refreshText}>Sync Now</Text>
                    </TouchableOpacity>
                </View>

                <Card style={[styles.premiumCard, { paddingBottom: 10 }]}>
                    <Card.Content>
                        {isLoadingLogs ? (
                            <View style={styles.loadingState}>
                                <ActivityIndicator color={accentColor} />
                                <Text style={styles.loadingStateText}>Scanning security logs...</Text>
                            </View>
                        ) : logs.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="magnify-expand" size={40} color="#cbd5e1" />
                                <Text style={styles.emptyStateText}>No anomalies detected</Text>
                            </View>
                        ) : (
                            logs.map((log, index) => (
                                <View key={log.id} style={styles.logItem}>
                                    <View style={[styles.logIconBox, { backgroundColor: index === 0 ? '#10b981' : (isStudent ? '#f1f5f9' : '#eff6ff') }]}>
                                        <MaterialCommunityIcons
                                            name={index === 0 ? "access-point" : "shield-alert-outline"}
                                            size={18}
                                            color={index === 0 ? "#fff" : (isStudent ? "#64748b" : "#4f46e5")}
                                        />
                                    </View>
                                    <View style={styles.logDetail}>
                                        <View style={styles.logMainRow}>
                                            <Text style={styles.logTimestamp}>{formatDate(log.start_time)}</Text>
                                            <View style={[styles.statusTag, index === 0 && styles.liveTag]}>
                                                <Text style={[styles.statusTagText, index === 0 && styles.liveTagText]}>
                                                    {index === 0 ? 'ACTIVE NOW' : 'SECURED'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.logMeta}>
                                            <MaterialCommunityIcons name="laptop" size={12} /> {log.device_info || 'Public Access Point'}
                                        </Text>
                                    </View>
                                    <View style={styles.logDuration}>
                                        <Text style={styles.durationVal}>{formatDuration(log.duration_seconds)}</Text>
                                        <Text style={styles.durationLabel}>Session</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>

                <View style={styles.bottomGap} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    premiumHeader: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        boxShadow: '0 5px 15px rgba(15, 23, 42, 0.2)',
        zIndex: 10,
    },
    bgIcon: {
        position: 'absolute',
        right: -50,
        top: -20,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerContent: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        ...Typography.h2,
        color: '#fff',
        fontWeight: '900',
    },
    headerSubtitle: {
        ...Typography.caption,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    securityScoreWrapper: {
        padding: 4,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    scoreCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    scoreText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    scoreLabel: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    scrollContent: {
        paddingTop: 30,
        paddingHorizontal: 20,
    },
    dashboardGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    dashboardItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 20,
        marginHorizontal: 5,
        alignItems: 'center',
        ...AppShadows.small,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    dashIconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    dashLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    dashVal: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '800',
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 14,
        paddingHorizontal: 4,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e293b',
    },
    sectionHint: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
    },
    premiumCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 4,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        ...AppShadows.medium,
    },
    glassInput: {
        backgroundColor: '#f8fafc',
        marginBottom: 16,
        height: 60,
        fontSize: 14,
        fontWeight: '600',
    },
    actionBtn: {
        marginTop: 8,
        borderRadius: BorderRadius.l,
        boxShadow: '0 3px 9px rgba(0, 0, 0, 0.16)',
    },
    actionBtnContent: {
        height: 54,
    },
    actionBtnLabel: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
        color: '#ffffff',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    settingTextContent: {
        flex: 1,
        marginRight: 16,
    },
    settingMainLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    settingSubLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    refreshBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    refreshText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    logIconBox: {
        width: 44,
        height: 44,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    logDetail: {
        flex: 1,
    },
    logMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logTimestamp: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1e293b',
    },
    statusTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#f1f5f9',
    },
    liveTag: {
        backgroundColor: '#ecfdf5',
    },
    statusTagText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94a3b8',
    },
    liveTagText: {
        color: '#10b981',
    },
    logMeta: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
        fontWeight: '500',
    },
    logDuration: {
        alignItems: 'flex-end',
    },
    durationVal: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1e293b',
    },
    durationLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    loadingState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingStateText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 12,
        fontWeight: '600',
    },
    emptyState: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 12,
        fontWeight: '700',
    },
    bottomGap: {
        height: 60,
    },
});

export default SecurityScreen;
