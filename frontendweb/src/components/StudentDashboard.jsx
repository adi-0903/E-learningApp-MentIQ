import React, { useState, useEffect } from 'react';
import './CardLayouts.css';
import { StatsCard } from './StatsCard';
import { ProgressCard } from './ProgressCard';
import { LastLessonCard } from './LastLessonCard';
import { GreetingCard } from './GreetingCard';
import { AIAssistantCard } from './AIAssistantCard';
import { AttendanceCard } from './AttendanceCard';
import api from '../api';

export function StudentDashboard({ userData, userRole, onSeeAllCourses, onContinueCourse }) {
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('students/dashboard/');
                if (res.data && res.data.success) {
                    setDashboardData(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="dashboard-grid">
            <StatsCard dashboardData={dashboardData} isLoading={isLoading} />
            <ProgressCard dashboardData={dashboardData} isLoading={isLoading} />
            <GreetingCard userData={userData} userRole={userRole} />
            <AttendanceCard dashboardData={dashboardData} isLoading={isLoading} />
            <LastLessonCard
                dashboardData={dashboardData}
                isLoading={isLoading}
                onSeeAllCourses={onSeeAllCourses}
                onContinueCourse={onContinueCourse}
            />
            <AIAssistantCard userRole={userRole} />
        </div>
    );
}
