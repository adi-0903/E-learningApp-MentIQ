import React from 'react';
import './StatsCard.css';

export function StatsCard({ dashboardData, isLoading }) {
    if (isLoading) {
        return (
            <div className="stats-container slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: '#94a3b8' }}>Loading...</div>
                </div>
            </div>
        );
    }

    const avgScore = dashboardData ? dashboardData.average_quiz_score : 0;
    const completed = dashboardData ? dashboardData.completed_courses : 0;
    const total = dashboardData ? dashboardData.total_enrolled_courses : 0;

    return (
        <div className="stats-container slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="stat-card">
                <div className="stat-value">{avgScore}%</div>
                <div className="stat-label">Avg Quiz Score</div>
                <div className="stat-change" style={{ color: '#94a3b8' }}>
                    {dashboardData?.unique_quizzes_count} {dashboardData?.unique_quizzes_count === 1 ? 'quiz' : 'quizzes'} ({dashboardData?.total_quizzes_taken} attempts)
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-value">{completed}/{total}</div>
                <div className="stat-label">Courses Completed</div>
                <div className="stat-change" style={{ color: '#94a3b8' }}>
                    {dashboardData?.in_progress_courses} in progress
                </div>
            </div>
        </div>
    );
}
