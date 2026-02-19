import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AICenterScreen from '@/app/screens/student/ai-center/index';

const Stack = createNativeStackNavigator();

export default function StudentAIStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AICenterMain" component={AICenterScreen} />
        </Stack.Navigator>
    );
}
