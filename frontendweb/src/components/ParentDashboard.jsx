import React, { useState, useEffect } from 'react';
import { parentAPI } from '../api';
import './ParentDashboard.css';
import { AIAssistantCard } from './AIAssistantCard';
import { KnowledgeGraphCard } from './KnowledgeGraphCard';

export const ParentDashboard = ({ userData }) => {
    const [children, setChildren] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [studentIdInput, setStudentIdInput] = useState('');
    const [linkRequests, setLinkRequests] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [reports, setReports] = useState([]);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [profileData, childrenData, requestsData] = await Promise.all([
                parentAPI.getProfile(),
                parentAPI.getChildren(),
                parentAPI.getLinkRequests()
            ]);
            setProfile(profileData);
            setChildren(childrenData);
            setLinkRequests(requestsData);
            
            // Auto-select first child if available
            if (childrenData.length > 0 && !selectedChild) {
                handleViewReports(childrenData[0]);
            }
        } catch (err) {
            console.error('Failed to fetch parent data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLinkRequest = async (e) => {
        e.preventDefault();
        try {
            await parentAPI.requestLink(studentIdInput);
            setStudentIdInput('');
            const requests = await parentAPI.getLinkRequests();
            setLinkRequests(requests);
            alert('Guardian Link request sent successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send link request');
        }
    };

    const handleViewReports = async (student) => {
        setSelectedChild(student);
        try {
            const [reportsData, coursesData] = await Promise.all([
                parentAPI.getChildReports(student.id),
                parentAPI.getChildCourses(student.id)
            ]);
            setReports(reportsData);
            setCourses(coursesData.data || []);
        } catch (err) {
            console.error('Failed to fetch child data:', err);
        }
    };

    if (isLoading && !profile) {
        return (
            <div className="premium-loader-container">
                <div className="loader-pulsar"></div>
                <p>Synchronizing Guardian Portal...</p>
            </div>
        );
    }

    return (
        <div className="parent-portal-container">
            {/* --- TOP GREETING --- */}
            <div className="portal-hero">
                <div className="hero-content">
                    <span className="hero-badge">Guardian Portal</span>
                    <h1>Pranam, {profile?.user_name || userData?.name}</h1>
                    <p>Overseeing the educational journey of your loved ones.</p>
                </div>
                <div className="hero-actions">
                    <div className="stat-pill">
                        <span className="pill-val">{children.length}</span>
                        <span className="pill-lab">Children Linked</span>
                    </div>
                </div>
            </div>

            <div className="portal-main-grid">
                {/* --- SIDEBAR: CHILDREN & LINKING --- */}
                <aside className="portal-sidebar">
                    <div className="sidebar-card child-selector-card">
                        <div className="card-header">
                            <h3>My Children</h3>
                            <button className="icon-btn-small" onClick={fetchData}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path></svg>
                            </button>
                        </div>
                        <div className="child-list">
                            {children.length === 0 ? (
                                <div className="empty-state">
                                    <p>No children linked yet.</p>
                                </div>
                            ) : (
                                children.map(child => (
                                    <div 
                                        key={child.id} 
                                        className={`child-selector-item ${selectedChild?.id === child.id ? 'active' : ''}`}
                                        onClick={() => handleViewReports(child)}
                                    >
                                        <div className="child-mini-avatar">
                                            {child.profile_image ? <img src={child.profile_image} alt={child.name} /> : <span>{child.name[0]}</span>}
                                        </div>
                                        <div className="child-mini-info">
                                            <span className="c-name">{child.name}</span>
                                            <span className="c-id">#{child.student_id}</span>
                                        </div>
                                        <div className="active-indicator"></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="sidebar-card link-guardian-card">
                        <h3>Link New ward</h3>
                        <form onSubmit={handleLinkRequest} className="premium-link-form">
                            <input 
                                type="text" 
                                placeholder="Student ID (e.g. ST123456)" 
                                value={studentIdInput}
                                onChange={(e) => setStudentIdInput(e.target.value)}
                                required
                            />
                            <button type="submit">LINK STUDENT</button>
                        </form>
                        {linkRequests.length > 0 && (
                            <div className="requests-preview">
                                {linkRequests.slice(0, 2).map(req => (
                                    <div key={req.id} className="req-pill">
                                        <span>{req.student_id}</span>
                                        <span className={`status-dot ${req.status.toLowerCase()}`}></span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* --- MAIN CONTENT: INSIGHTS & REPORTS --- */}
                <main className="portal-content">
                    {selectedChild ? (
                        <div className="child-insights-view animate-in">
                            <div className="insight-header">
                                <div className="student-profile-strip">
                                    <div className="strip-avatar">
                                        {selectedChild.profile_image ? <img src={selectedChild.profile_image} alt={selectedChild.name} /> : <span>{selectedChild.name[0]}</span>}
                                    </div>
                                    <div className="strip-info">
                                        <h2>{selectedChild.name}'s Academic Horizon</h2>
                                        <div className="strip-meta">
                                            <span>Current Grade: {selectedChild.grade_level || 'Not Assigned'}</span>
                                            <span className="separator">•</span>
                                            <span>Attendance: {selectedChild.latest_stats?.attendance_rate || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="insights-grid">
                                <div className="insight-card stats-overview">
                                    <div className="i-stat-box">
                                        <label>Avg. Score</label>
                                        <div className="i-val">{selectedChild.latest_stats?.average_quiz_score || 0}%</div>
                                        <div className="i-trend positive">+2.4%</div>
                                    </div>
                                    <div className="i-stat-box">
                                        <label>Quizzes</label>
                                        <div className="i-val">{selectedChild.latest_stats?.quizzes_completed || 0}</div>
                                        <div className="i-sub">Completed</div>
                                    </div>
                                    <div className="i-stat-box">
                                        <label>Lessons</label>
                                        <div className="i-val">{selectedChild.latest_stats?.lessons_watched || 0}</div>
                                        <div className="i-sub">Watched</div>
                                    </div>
                                </div>

                                <div className="insight-card report-section">
                                    <div className="card-header">
                                        <h3>Weekly Progress Summary</h3>
                                        <span className="report-date">Latest: Week of {new Date().toLocaleDateString()}</span>
                                    </div>
                                    
                                    {reports.length === 0 ? (
                                        <div className="no-reports-view">
                                            <p>Our system is analyzing {selectedChild.name}'s progress. The first weekly summary will be available soon.</p>
                                        </div>
                                    ) : (
                                        <div className="active-report">
                                            <div className="summary-bubble">
                                                <div className="summary-badge">PROGRESS INSIGHT</div>
                                                <p>{reports[0].ai_summary}</p>
                                            </div>
                                            <div className="report-metrics-row">
                                                <div className="metric">
                                                    <span>Focus Level</span>
                                                    <div className="metric-bar"><div className="fill" style={{width: '85%'}}></div></div>
                                                </div>
                                                <div className="metric">
                                                    <span>Retention</span>
                                                    <div className="metric-bar"><div className="fill" style={{width: '72%', background: 'var(--accent-gold)'}}></div></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="insight-card courses-section">
                                    <div className="card-header">
                                        <h3>Registered Courses</h3>
                                    </div>
                                    <div className="course-mini-list">
                                        {courses.length === 0 ? (
                                            <p className="no-courses">No active course enrollments found.</p>
                                        ) : (
                                            courses.map(course => (
                                                <div key={course.id} className="course-mini-card">
                                                    <div className="c-icon">📚</div>
                                                    <div className="c-details">
                                                        <span className="c-title">{course.title}</span>
                                                        <span className="c-teacher">By {course.teacher_name || 'Expert'}</span>
                                                    </div>
                                                    <div className="c-progress-pills">
                                                        {course.progress_percentage}%
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="insight-card graph-card">
                                    <KnowledgeGraphCard 
                                        studentId={selectedChild.id} 
                                        userRole="parent" 
                                        isLoading={isLoading} 
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-portal-placeholder">
                            <div className="placeholder-visual">
                                <div className="orb-glow"></div>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"></path></svg>
                            </div>
                            <h3>Select a ward to view progress</h3>
                            <p>Select a child from the sidebar to view their deep academic insights and AI-generated progress reports.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
