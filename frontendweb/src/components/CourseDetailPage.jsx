import React, { useState, useEffect } from 'react';
import './NotificationsPage.css'; // Reusing premium layouts
import api from '../api';

export function CourseDetailPage({ courseId, onBack, onTakeQuiz }) {
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [courseRes, lessonsRes, quizzesRes] = await Promise.all([
                    api.get(`courses/${courseId}/`),
                    api.get(`lessons/?course=${courseId}`),
                    api.get(`quizzes/?course=${courseId}`)
                ]);

                if (courseRes.data && courseRes.data.success) {
                    setCourse(courseRes.data.data);
                }

                // Handling potential differences in internal data structure
                const lessonList = lessonsRes.data?.data?.results || lessonsRes.data?.data || lessonsRes.data?.results || [];
                setLessons(lessonList);

                const quizList = quizzesRes.data?.data?.results || quizzesRes.data?.data || quizzesRes.data?.results || [];
                setQuizzes(quizList);

            } catch (err) {
                console.error("Error fetching course details:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (courseId) fetchDetails();
    }, [courseId]);

    if (isLoading) {
        return (
            <div className="premium-page-wrapper slide-up">
                <div className="loading-state" style={{ height: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="premium-spinner"></div>
                    <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Syncing learning materials...</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="premium-page-wrapper slide-up">
                <div className="empty-state">
                    <h3>Course not found</h3>
                    <button className="cyber-submit-btn" onClick={onBack}>RETURN TO DASHBOARD</button>
                </div>
            </div>
        );
    }

    return (
        <div className="premium-page-wrapper slide-up">
            <div className="course-detail-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <span style={{ color: '#6366f1', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}>{course.category || 'Course Overview'}</span>
                </div>
                <h1 className="premium-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{course.title}</h1>
                <div style={{ display: 'flex', gap: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        {course.teacher_name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {course.level}
                    </span>
                </div>
            </div>

            <div className="course-grid-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="course-main-info">
                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Description</h3>
                        <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '1rem' }}>{course.description || 'No description provided.'}</p>
                    </div>

                    <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Curriculum</h3>
                    <div className="lessons-container">
                        {lessons.length === 0 ? (
                            <div className="empty-state">No lessons uploaded yet.</div>
                        ) : (
                            lessons.map((lesson, idx) => (
                                <div key={lesson.id} className="lesson-row" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1.2rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px',
                                    marginBottom: '1rem',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 'bold' }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        <h4 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>{lesson.title}</h4>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{lesson.file_type || 'Lecture'}</span>
                                    </div>
                                    <button style={{
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'white',
                                        color: '#0f172a',
                                        fontWeight: '600',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}>
                                        START
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="course-sidebar-info">
                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Quizzes</h3>
                        {quizzes.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No quizzes available yet.</p>
                        ) : (
                            quizzes.map(quiz => (
                                <div key={quiz.id} style={{
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '12px',
                                    marginBottom: '1rem'
                                }}>
                                    <h4 style={{ color: 'white', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{quiz.title}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{quiz.question_count || 0} Questions</span>
                                        <button
                                            onClick={() => onTakeQuiz(quiz.id)}
                                            style={{ background: '#6366f1', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            TAKE QUIZ
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ color: 'white', marginBottom: '1rem' }}>Instructor</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src={`https://ui-avatars.com/api/?name=${course.teacher_name}&background=6366f1&color=fff`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="Tutor" />
                            <div>
                                <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{course.teacher_name}</div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Academic Expert</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
