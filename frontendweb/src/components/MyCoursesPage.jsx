import React, { useState, useEffect } from 'react';
import './NotificationsPage.css'; // Reusing premium page styles for consistency
import './ProfilePage.css';
import api from '../api';

export function MyCoursesPage({ onBack, onSelectCourse }) {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('students/courses/');
                if (res.data && res.data.success) {
                    setCourses(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching courses:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourses();
    }, []);

    return (
        <div className="premium-page-wrapper slide-up">
            <div className="page-header">
                <div className="header-info">
                    <h1 className="premium-title">My Enrolled Courses</h1>
                    <p className="premium-subtitle">Manage and continue your learning journey.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <div className="premium-spinner"></div>
                    <p>Loading your courses...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No Courses Found</h3>
                    <p>You haven't enrolled in any courses yet. Browse our catalog to start learning!</p>
                </div>
            ) : (
                <div className="premium-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                    {courses.map(course => (
                        <div key={course.id} className="card premium-course-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>{course.title}</h3>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#94a3b8' }}>{course.level}</span>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Instructor: {course.teacher_name}</p>
                            </div>
                            <div className="course-card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="cyber-submit-btn"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => onSelectCourse(course.id)}
                                >
                                    CONTINUE LEARNING
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
