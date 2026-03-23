import React from 'react';
import './LastLessonCard.css';

export function LastLessonCard({ dashboardData, isLoading, onSeeAllCourses, onContinueCourse }) {
    if (isLoading) {
        return (
            <div className="card last-lesson-card slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="card-header">
                    <h2 className="card-title">Recent Courses</h2>
                </div>
                <div className="lessons-list" style={{ justifyContent: 'center', color: '#94a3b8' }}>
                    Loading recent courses...
                </div>
            </div>
        );
    }

    const recentCourses = dashboardData?.recent_courses || [];

    return (
        <div className="card last-lesson-card slide-up" style={{ animationDelay: '0.5s', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="card-title">Recent Courses</h2>
                <div
                    className="see-all-text"
                    onClick={onSeeAllCourses}
                    style={{
                        fontSize: '0.8rem',
                        color: '#6366f1',
                        cursor: 'pointer',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                >
                    See all
                </div>
            </div>
            <div className="lessons-list">
                {recentCourses.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', margin: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <span>No recent courses found. Enroll in a course to get started!</span>
                        <button
                            className="continue-btn"
                            style={{ width: 'auto', padding: '8px 20px' }}
                            onClick={onSeeAllCourses}
                        >
                            BROWSE MISSIONS
                        </button>
                    </div>
                ) : (
                    recentCourses.map((course) => (
                        <div className="lesson-item" key={course.id}>
                            <div className="lesson-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {course.title}
                            </div>
                            <div className="lesson-meta">
                                <span>Instructor: {course.teacher_name}</span>
                            </div>
                            <div className="lesson-footer">
                                <span className="lesson-time">{course.level}</span>
                                <button className="continue-btn" onClick={() => onContinueCourse(course.id)}>Continue</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
