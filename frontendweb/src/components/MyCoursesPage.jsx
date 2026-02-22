import React, { useState, useEffect } from 'react';
import './MyCoursesPage.css';
import api from '../api';

export function MyCoursesPage({ onBack, onSelectCourse, userRole, onBrowseCourses }) {
    const isTeacher = userRole === 'teacher';
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create Course Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'technology',
        level: 'beginner',
        price: '0',
        is_free: true,
        duration: '10 hours',
        is_published: true
    });

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const endpoint = isTeacher ? 'teachers/courses/' : 'students/courses/';
            const res = await api.get(endpoint);
            if (res.data && res.data.success) {
                setCourses(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching courses:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [isTeacher]);

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await api.post('courses/', formData);
            if (res.data && res.data.success) {
                setIsCreateModalOpen(false);
                setFormData({
                    title: '',
                    description: '',
                    category: 'Development',
                    level: 'Intermediate',
                    price: '0',
                    is_free: true,
                    duration: '10 hours',
                    is_published: true
                });
                fetchCourses();
            }
        } catch (err) {
            console.error("Error creating course:", err);
            alert("Failed to create course. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="courses-dashboard slide-up">
            <div className="courses-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="courses-title">{isTeacher ? "My Assigned Courses" : "My Enrolled Courses"}</h1>
                    <p className="courses-subtitle">{isTeacher ? "Manage your curriculum and track student progress across your active courses." : "Manage and continue your learning journey to perfection."}</p>
                </div>
                {isTeacher && (
                    <button className="premium-add-course-btn" onClick={() => setIsCreateModalOpen(true)}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                        <span>NEW COURSE</span>
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="course-loading">
                    <div className="loader-ring"></div>
                    <p style={{ color: '#94a3b8' }}>Synthesizing your knowledge base...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="course-empty-state">
                    <div className="empty-icon-wrapper">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <h3>{isTeacher ? "No Assigned Courses" : "No Courses Yet"}</h3>
                    <p>{isTeacher ? "It looks like you haven't been assigned to any courses yet." : "It looks like you haven't enrolled in any courses yet. Explore our catalog to find your next great lesson!"}</p>
                    {isTeacher ? (
                        <button className="btn-continue" style={{ width: 'auto', marginTop: '20px', padding: '12px 30px' }} onClick={() => setIsCreateModalOpen(true)}>
                            CREATE FIRST COURSE
                        </button>
                    ) : (
                        <button className="btn-continue" style={{ width: 'auto', marginTop: '20px', padding: '12px 30px' }} onClick={onBrowseCourses}>
                            BROWSE MISSION CATALOG
                        </button>
                    )}
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
                                        onClick={() => onSelectCourse(course.id)}
                                    >
                                        <span>{isTeacher ? "MANAGE CURRICULUM" : "RESUME LEARNING"}</span>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Course Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content-premium course-creation-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Course</h2>
                            <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleCreateCourse} className="modal-form">
                            <div className="premium-input-group">
                                <label className="input-label">Course Title</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="e.g. Master React & Next.js"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="premium-input-grid">
                                <div className="premium-input-group">
                                    <label className="input-label">Category</label>
                                    <select
                                        className="premium-input"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="technology">Technology</option>
                                        <option value="computer_science">Computer Science</option>
                                        <option value="business">Business</option>
                                        <option value="mathematics">Mathematics</option>
                                        <option value="science">Science</option>
                                        <option value="art">Art</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="premium-input-group">
                                    <label className="input-label">Difficulty Level</label>
                                    <select
                                        className="premium-input"
                                        value={formData.level}
                                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="all_levels">All Levels</option>
                                    </select>
                                </div>
                            </div>

                            <div className="premium-input-group">
                                <label className="input-label">Course Description</label>
                                <textarea
                                    className="premium-input"
                                    placeholder="What will students learn in this course?"
                                    rows="4"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="premium-input-group">
                                <label className="input-label">Course Duration</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="e.g. 15 hours (Self-paced)"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="premium-cancel-btn" onClick={() => setIsCreateModalOpen(false)}>CANCEL</button>
                                <button type="submit" className="premium-submit-btn" disabled={isCreating}>
                                    {isCreating ? "CREATING..." : "PUBLISH COURSE"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
