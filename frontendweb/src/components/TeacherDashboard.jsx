import React from 'react';
import './CardLayouts.css';
import { AIAssistantCard } from './AIAssistantCard';
import { GreetingCard } from './GreetingCard';
import { TeacherAttendanceCard } from './TeacherAttendanceCard';

export function TeacherDashboard({ userData, userRole, onMarkAttendance }) {
    return (
        <div className="dashboard-grid teacher-grid">
            <TeacherAttendanceCard onMarkAttendance={onMarkAttendance} />
            <GreetingCard userData={userData} userRole={userRole} />
            <AIAssistantCard userRole={userRole} />
        </div>
    );
}
