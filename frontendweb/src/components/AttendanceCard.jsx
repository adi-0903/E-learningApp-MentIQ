import React from 'react';
import './AttendanceCard.css';

export function AttendanceCard({ dashboardData, isLoading }) {
    if (isLoading) {
        return (
            <div className="attendance-card-wrapper slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="premium-attendance-card loading">
                    <div className="shimmer-line"></div>
                </div>
            </div>
        );
    }

    const courseAttendance = dashboardData?.course_attendance || [];

    return (
        <div className="attendance-card-wrapper slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="premium-attendance-card">
                <div className="attendance-header">
                    <div className="header-info">
                        <span className="tiny-label">LIVE SESSIONS</span>
                        <h3>Course Attendance</h3>
                    </div>
                </div>

                <div className="attendance-scroll-list">
                    {courseAttendance.length > 0 ? (
                        courseAttendance.map((course) => {
                            const percentage = course.percentage || 0;
                            const statusClass = percentage >= 75 ? 'status-excellent' : (percentage >= 50 ? 'status-good' : 'status-warning');

                            return (
                                <div key={course.id} className={`course-attendance-item ${statusClass}`}>
                                    <div className="course-info-row">
                                        <span className="course-name-mini" title={course.title}>{course.title}</span>
                                        <span className="course-pct">{percentage}%</span>
                                    </div>
                                    <div className="mini-progress-track">
                                        <div
                                            className="mini-progress-fill"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="mini-stats-row">
                                        <span>Present: <strong>{course.present}</strong>/{course.total}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-attendance">
                            <p>No live attendance records found for your modules.</p>
                        </div>
                    )}
                </div>

                <div className="attendance-footer-mini">
                    <p>Presence tracking across enrolled modules</p>
                </div>
            </div>
        </div>
    );
}
