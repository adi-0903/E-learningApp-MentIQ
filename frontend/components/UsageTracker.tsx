import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { analyticsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export const UsageTracker: React.FC = () => {
    const { isLoggedIn, user } = useAuthStore();
    const sessionLogId = useRef<string | null>(null);
    const startTime = useRef<number>(Date.now());
    const intervalRef = useRef<any>(null);

    const startSession = async () => {
        if (!isLoggedIn || !user) return;

        // Ensure tokens are available before starting
        const { getTokens } = await import('@/services/api');
        const tokens = await getTokens();
        if (!tokens?.access) return;

        try {
            const deviceInfo = `${Platform.OS} ${Platform.Version}`;
            const response = await analyticsApi.recordActivity(undefined, 0, false, deviceInfo);
            if (response.ok && response.data.data?.id) {
                sessionLogId.current = response.data.data.id;
                console.log('Activity session started:', sessionLogId.current);
            }
        } catch (error: any) {
            if (__DEV__) console.warn('Failed to start activity session:', error.message);
        }
    };

    const updateSession = async (isEnding = false) => {
        if (!sessionLogId.current || !isLoggedIn) return;

        // Double check tokens exist before making the call
        const { getTokens } = await import('@/services/api');
        const tokens = await getTokens();
        if (!tokens?.access) return;

        const durationSeconds = Math.floor((Date.now() - startTime.current) / 1000);
        try {
            await analyticsApi.recordActivity(
                sessionLogId.current,
                durationSeconds,
                isEnding
            );
            if (isEnding) {
                console.log('Activity session ended:', sessionLogId.current);
                sessionLogId.current = null;
            }
        } catch (error: any) {
            // Silently fail for background updates to avoid disturbing the user
            // Unless it's a real network error we want to know about in dev
            if (__DEV__ && !error.message?.includes('Authentication')) {
                console.warn('Failed to update activity session:', error.message);
            }
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            startSession();

            // Heartbeat every 30 seconds to ensure data is "live" even if app crashes
            intervalRef.current = setInterval(() => {
                updateSession(false);
            }, 30000);
        }

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // App came to foreground
                startTime.current = Date.now();
                if (!sessionLogId.current) {
                    startSession();
                }
            } else if (nextAppState.match(/inactive|background/)) {
                // App went to background
                updateSession(true);
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (sessionLogId.current) {
                updateSession(true);
            }
        };
    }, [isLoggedIn]);

    return null; // Invisible component
};
