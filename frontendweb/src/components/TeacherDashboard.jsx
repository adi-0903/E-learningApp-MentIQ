import React from 'react';
import './CardLayouts.css';
import { AIAssistantCard } from './AIAssistantCard';
import { GreetingCard } from './GreetingCard';
import { TeacherAttendanceCard } from './TeacherAttendanceCard';
import { TeacherStatsCard } from './TeacherStatsCard';
import { RecentDoubtsCard } from './RecentDoubtsCard';
import { QuickActionsCard } from './QuickActionsCard';

export function TeacherDashboard({
    userData,
    userRole,
    onMarkAttendance,
    onOpenCourses,
    onOpenClassroom,
    onOpenDoubts
}) {
    return (
        <div className="teacher-dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            <TeacherStatsCard />
            <div className="dashboard-grid teacher-grid">
                <GreetingCard userData={userData} userRole={userRole} />
                <TeacherAttendanceCard onMarkAttendance={onMarkAttendance} />
                <QuickActionsCard
                    onOpenCourses={onOpenCourses}
                    onOpenClassroom={onOpenClassroom}
                    onOpenDoubts={onOpenDoubts}
                />
                <RecentDoubtsCard onOpenDoubts={onOpenDoubts} />
                <AIAssistantCard userRole={userRole} />
            </div>
        </div>
    );
}
