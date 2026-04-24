import React, { useState, useEffect } from 'react';
import './CourseCatalogPage.css'; // Use new premium styles
import api from '../api';
import { SuccessModal } from './SuccessModal';

export function CourseCatalogPage({ onBack, onEnrollSuccess, userData }) {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [successModal, setSuccessModal] = useState({ isOpen: false, courseTitle: '' });

    const fetchAllCourses = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('courses/');
            if (res.data && res.data.success) {
                // Filter out non-published courses just in case, though backend handles it
                let fetchedCourses = res.data.data;
                
                // If student, only show courses for their grade level
                if (userData?.role === 'student' && userData?.grade_level) {
                    fetchedCourses = fetchedCourses.filter(c => c.grade_level === userData.grade_level);
                }
                
                setCourses(fetchedCourses);
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
        const course = courses.find(c => c.id === courseId);
        const courseTitle = course ? course.title : "your new mission";

        try {
            const res = await api.post('enrollments/enroll/', { course_id: courseId });
            if (res.data && res.data.success) {
                setSuccessModal({ isOpen: true, courseTitle });
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
        <div className="catalog-container slide-up">
            <div className="catalog-hero">
                <button className="back-btn-minimal" onClick={onBack} style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, position: 'relative', width: 'fit-content', whiteSpace: 'nowrap' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                    BACK TO DASHBOARD
                </button>
                <h1 className="catalog-title">Mission Catalog</h1>
                <p className="catalog-subtitle">Discover advanced learning modules and start your next great adventure in knowledge.</p>
            </div>

            {isLoading ? (
                <div className="course-loading">
                    <div className="loader-ring"></div>
                    <p style={{ color: '#94a3b8' }}>Loading all available missions...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="course-empty-state" style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>No Missions Available</h3>
                    <p>Check back later for new course deployments.</p>
                </div>
            ) : (
                <div className="catalog-grid">
                    {courses.map(course => (
                        <div key={course.id} className="mission-card" onClick={() => !enrollingId && handleEnroll(course.id)}>
                            <div className="mission-banner">
                                <img
                                    src={course.thumbnail || `https://picsum.photos/seed/${course.id}/600/400`}
                                    alt={course.title}
                                />
                                <div className="mission-banner-overlay"></div>
                                <div className="mission-grade-badge">
                                    {course.grade_level 
                                        ? `Grade ${course.grade_level}` 
                                        : `Grade ${9 + ((course.title?.length || 0) % 3)}`}
                                </div>
                            </div>

                            <div className="mission-content">
                                <h3 className="mission-title">{course.title}</h3>

                                <div className="mission-instructor">
                                    <div className="mission-instructor-avatar">
                                        {(course.teacher_name || 'T')[0].toUpperCase()}
                                    </div>
                                    <span>{course.teacher_name || 'Expert Instructor'}</span>
                                </div>

                                <div className="mission-meta-grid">
                                    <div className="mission-meta-box">
                                        <div className="mission-meta-icon">
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </div>
                                        <div className="mission-meta-text">
                                            <span className="mission-meta-label">Pace</span>
                                            <span className="mission-meta-value">{course.duration || 'Self-paced'}</span>
                                        </div>
                                    </div>
                                    <div className="mission-meta-box">
                                        <div className="mission-meta-icon">
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                        </div>
                                        <div className="mission-meta-text">
                                            <span className="mission-meta-label">Content</span>
                                            <span className="mission-meta-value">{course.lesson_count || 0} Lessons</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="mission-action-btn"
                                    onClick={(e) => { e.stopPropagation(); handleEnroll(course.id); }}
                                    disabled={enrollingId === course.id}
                                >
                                    <span>{enrollingId === course.id ? "ENROLLING..." : "ENROLL NOW"}</span>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <SuccessModal 
                isOpen={successModal.isOpen} 
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title="Mission Accepted!"
                message={`You've successfully enrolled in "${successModal.courseTitle}". Your journey to excellence begins now.`}
                buttonText="LET'S GO"
            />
        </div>
    );
}
