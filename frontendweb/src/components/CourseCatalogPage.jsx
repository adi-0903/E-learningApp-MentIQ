import React, { useState, useEffect } from 'react';
import './MyCoursesPage.css'; // Reuse core course grid styles
import api from '../api';

export function CourseCatalogPage({ onBack, onEnrollSuccess }) {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);

    const fetchAllCourses = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('courses/');
            if (res.data && res.data.success) {
                // Filter out non-published courses just in case, though backend handles it
                setCourses(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching course catalog:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCourses();
    }, []);

    const handleEnroll = async (courseId) => {
        setEnrollingId(courseId);
        try {
            const res = await api.post('enrollments/enroll/', { course_id: courseId });
            if (res.data && res.data.success) {
                alert("Successfully enrolled! Welcome to your new mission.");
                if (onEnrollSuccess) onEnrollSuccess(courseId);
            }
        } catch (err) {
            console.error("Enrollment error:", err);
            const msg = err.response?.data?.error?.message || "Failed to enroll. Please try again.";
            alert(msg);
        } finally {
            setEnrollingId(null);
        }
    };

    return (
        <div className="courses-dashboard slide-up">
            <div className="courses-header">
                <button className="back-btn-minimal" onClick={onBack} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                    BACK TO DASHBOARD
                </button>
                <h1 className="courses-title">Mission Catalog</h1>
                <p className="courses-subtitle">Discover advanced learning modules and start your next great adventure.</p>
            </div>

            {isLoading ? (
                <div className="course-loading">
                    <div className="loader-ring"></div>
                    <p style={{ color: '#94a3b8' }}>Loading all available missions...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="course-empty-state">
                    <h3>No Missions Available</h3>
                    <p>Check back later for new course deployments.</p>
                </div>
            ) : (
                <div className="courses-grid">
                    {courses.map(course => (
                        <div key={course.id} className="course-premium-card">
                            <div className="course-banner">
                                <img
                                    src={course.thumbnail || `https://picsum.photos/seed/${course.id}/600/400`}
                                    alt={course.title}
                                    className="course-banner-img"
                                />
                                <div className="course-banner-overlay"></div>
                                <div className="course-level-badge">{course.level || 'All Levels'}</div>
                            </div>

                            <div className="course-content">
                                <h3 className="course-title">{course.title}</h3>

                                <div className="course-instructor">
                                    <div className="instructor-avatar">
                                        {(course.teacher_name || 'T')[0].toUpperCase()}
                                    </div>
                                    <span>{course.teacher_name || 'Expert Instructor'}</span>
                                </div>

                                <div className="course-meta">
                                    <div className="meta-item">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <span>{course.duration || 'Self-paced'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                        <span>{course.lesson_count || 0} Lessons</span>
                                    </div>
                                </div>

                                <div className="course-action">
                                    <button
                                        className="btn-continue"
                                        onClick={() => handleEnroll(course.id)}
                                        disabled={enrollingId === course.id}
                                    >
                                        <span>{enrollingId === course.id ? "ENROLLING..." : "ENROLL NOW"}</span>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
