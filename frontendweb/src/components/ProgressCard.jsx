import React from 'react';
import './ProgressCard.css';

export function ProgressCard({ dashboardData, isLoading }) {
    if (isLoading) {
        return (
            <div className="card progress-card slide-up" style={{ animationDelay: '0.4s', justifyContent: 'center', alignItems: 'center', height: '140px' }}>
                <div className="spinner-border" style={{ width: '2rem', height: '2rem', color: '#6366f1' }}></div>
            </div>
        );
    }

    const completedLessons = dashboardData ? dashboardData.total_lessons_completed || 0 : 0;
    const totalAttempts = dashboardData ? dashboardData.total_quizzes_taken || 0 : 0;
    const uniqueQuizzes = dashboardData ? dashboardData.unique_quizzes_count || 0 : 0;
    const completedVideos = 0;
    const overallProgress = dashboardData ? dashboardData.overall_progress || 0 : 0;
    const progressDeg = (overallProgress / 100) * 360;

    return (
        <div className="card progress-card premium-progress-compact slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="progress-grid-layout">
                <div className="stats-box">
                    <div className="mini-stat-item">
                        <div className="mini-icon p-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>
                        <div className="mini-details">
                            <span className="v">{completedLessons}</span>
                            <span className="l">Lessons</span>
                        </div>
                    </div>
                    <div className="mini-stat-item">
                        <div className="mini-icon g-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                        <div className="mini-details">
                            <span className="v">{uniqueQuizzes}</span>
                            <span className="l">{uniqueQuizzes === 1 ? 'Quiz' : 'Quizzes'} ({totalAttempts} Attempts)</span>
                        </div>
                    </div>
                    <div className="mini-stat-item">
                        <div className="mini-icon o-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                        <div className="mini-details">
                            <span className="v">{completedVideos}</span>
                            <span className="l">Videos</span>
                        </div>
                    </div>
                </div>

                <div className="circle-box">
                    <div className="compact-circle" style={{ background: `conic-gradient(#6366f1 ${progressDeg}deg, rgba(255,255,255,0.05) 0%)` }}>
                        <div className="compact-circle-inner">{overallProgress}%</div>
                    </div>
                    <span className="circle-label">Course Progress</span>
                </div>
            </div>
        </div>
    );
}
