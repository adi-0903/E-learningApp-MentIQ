import React from 'react';
import './CardLayouts.css';
import { StatsCard } from './StatsCard';
import { AIAssistantCard } from './AIAssistantCard';
import { GreetingCard } from './GreetingCard';

export function TeacherDashboard() {
    return (
        <div className="dashboard-grid teacher-grid">
            <GreetingCard />
            <div className="teacher-overview">
                <StatsCard />
            </div>
            <AIAssistantCard />

            {/* Additional specific modules for teacher can be built here subsequently */}
            <div className="card placeholder-card">
                <div className="card-header">
                    <h2>Course Management</h2>
                </div>
                <p>Manage your active courses, assignments, and curriculum from this panel.</p>
            </div>

            <div className="card placeholder-card">
                <div className="card-header">
                    <h2>Student Analytics</h2>
                </div>
                <p>View aggregated progress, quiz performance, and attention metrics for your students.</p>
            </div>
        </div>
    );
}
