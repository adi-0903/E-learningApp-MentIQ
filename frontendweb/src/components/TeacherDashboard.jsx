import React from 'react';
import './CardLayouts.css';
import { StatsCard } from './StatsCard';
import { AIAssistantCard } from './AIAssistantCard';
import { GreetingCard } from './GreetingCard';

export function TeacherDashboard({ userData, userRole }) {
    return (
        <div className="dashboard-grid teacher-grid">
            <GreetingCard userData={userData} userRole={userRole} />
            <AIAssistantCard userRole={userRole} />
        </div>
    );
}
