import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, AppShadows, Spacing, BorderRadius } from '../../constants/theme';
import QbitChatWindow from './QbitChatWindow';

interface QbitFloatingButtonProps {
    lessonId?: string;
    scope?: 'lesson' | 'global';
    showLabel?: boolean;
}

export default function QbitFloatingButton({ lessonId, scope = 'global', showLabel = false }: QbitFloatingButtonProps) {
    const [chatVisible, setChatVisible] = useState(false);

    return (
        <>
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setChatVisible(true)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="robot" size={26} color={Colors.light.white} />
                {showLabel && <Text style={styles.label}>Ask Qbit</Text>}
            </TouchableOpacity>

            <QbitChatWindow
                visible={chatVisible}
                onClose={() => setChatVisible(false)}
                lessonId={lessonId}
                scope={scope}
            />
        </>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: Spacing.xl,
        right: Spacing.m,
        backgroundColor: Colors.light.primary,
        borderRadius: BorderRadius.circle,
        paddingVertical: Spacing.m,
        paddingHorizontal: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.s,
        ...AppShadows.medium,
        zIndex: 9999,
    },
    label: {
        color: Colors.light.white,
        fontWeight: '600',
        fontSize: 16,
    },
});
