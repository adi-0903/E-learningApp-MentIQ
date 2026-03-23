import React, { useState, useEffect } from 'react';
import { parentAPI } from '../api';
import './ParentDashboard.css';

export const ParentDashboard = ({ userData }) => {
    const [children, setChildren] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [studentIdInput, setStudentIdInput] = useState('');
    const [linkRequests, setLinkRequests] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [reports, setReports] = useState([]);

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
            alert('Link request sent successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send request');
        }
    };

    const handleViewReports = async (student) => {
        setSelectedChild(student);
        try {
            const reportsData = await parentAPI.getChildReports(student.id);
            setReports(reportsData);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        }
    };

    if (isLoading && !profile) {
        return <div className="parent-loader">Loading Parent Dashboard...</div>;
    }

    return (
        <div className="parent-dashboard">
            <header className="parent-header">
                <div className="welcome-section">
                    <h1>Parent Dashboard</h1>
                    <p>Welcome back, {profile?.user_name || userData?.name}</p>
                </div>
                <div className="header-stats">
                    <div className="h-stat">
                        <span className="stat-num">{children.length}</span>
                        <span className="stat-label">Children Linked</span>
                    </div>
                </div>
            </header>

            <div className="parent-grid">
                <section className="children-list-section">
                    <div className="section-header">
                        <h2>My Children</h2>
                        <button className="refresh-btn" onClick={fetchData}>Refresh</button>
                    </div>

                    <div className="children-grid">
                        {children.length === 0 ? (
                            <div className="empty-children">
                                <i className="icon-empty"></i>
                                <p>No children linked yet.</p>
                            </div>
                        ) : (
                            children.map(child => (
                                <div 
                                    key={child.id} 
                                    className={`child-card ${selectedChild?.id === child.id ? 'active' : ''}`}
                                    onClick={() => handleViewReports(child)}
                                >
                                    <div className="child-main">
                                        <div className="child-avatar">
                                            {child.profile_image ? <img src={child.profile_image} alt={child.name} /> : <span>{child.name[0]}</span>}
                                        </div>
                                        <div className="child-info">
                                            <h3>{child.name}</h3>
                                            <span className="student-id">ID: {child.student_id}</span>
                                        </div>
                                    </div>
                                    {child.latest_stats && (
                                        <div className="child-quick-stats">
                                            <div className="q-stat">
                                                <span className="q-val">{child.latest_stats.average_quiz_score}%</span>
                                                <span className="q-lab">Score</span>
                                            </div>
                                            <div className="q-stat">
                                                <span className="q-val">{child.latest_stats.attendance_rate}%</span>
                                                <span className="q-lab">Atten.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="link-new-section">
                        <h3>Link New Student</h3>
                        <form onSubmit={handleLinkRequest} className="link-form">
                            <input 
                                type="text" 
                                placeholder="Enter 8-digit Student ID" 
                                value={studentIdInput}
                                onChange={(e) => setStudentIdInput(e.target.value)}
                                maxLength={8}
                                required
                            />
                            <button type="submit" disabled={!studentIdInput}>Send Request</button>
                        </form>
                        
                        {linkRequests.length > 0 && (
                            <div className="pending-requests">
                                <h4>Recent Requests</h4>
                                <ul className="request-list">
                                    {linkRequests.slice(0, 3).map(req => (
                                        <li key={req.id} className={`req-item ${req.status.toLowerCase()}`}>
                                            <span className="req-id">{req.student_id}</span>
                                            <span className="req-status">{req.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>

                <section className="reports-detail-section">
                    {selectedChild ? (
                        <div className="reports-container">
                            <div className="detail-header">
                                <h2>{selectedChild.name}'s Progress</h2>
                                <button className="close-detail" onClick={() => setSelectedChild(null)}>&times;</button>
                            </div>

                            {reports.length === 0 ? (
                                <div className="no-reports">
                                    <p>No reports generated yet for {selectedChild.name}.</p>
                                    <small>Reports are generated every Monday morning.</small>
                                </div>
                            ) : (
                                <div className="reports-list">
                                    {reports.map(report => (
                                        <div key={report.id} className="report-card">
                                            <div className="report-card-header">
                                                <span className="report-period">
                                                    {new Date(report.week_start_date).toLocaleDateString()} - {new Date(report.week_end_date).toLocaleDateString()}
                                                </span>
                                                <span className="report-type">Weekly Summary</span>
                                            </div>
                                            <div className="report-ai">
                                                <p>{report.ai_summary}</p>
                                            </div>
                                            <div className="report-stats-grid">
                                                <div className="stat-box">
                                                    <label>Avg Quiz Score</label>
                                                    <div className="progress-bar">
                                                        <div className="progress-fill" style={{ width: `${report.average_quiz_score}%` }}></div>
                                                    </div>
                                                    <span>{report.average_quiz_score}%</span>
                                                </div>
                                                <div className="stat-box">
                                                    <label>Attendance</label>
                                                    <div className="progress-bar">
                                                        <div className="progress-fill" style={{ width: `${report.attendance_rate}%`, backgroundColor: '#10b981' }}></div>
                                                    </div>
                                                    <span>{report.attendance_rate}%</span>
                                                </div>
                                                <div className="stat-boxes-row">
                                                    <div className="mini-box">
                                                        <strong>{report.quizzes_completed}</strong>
                                                        <span>Quizzes</span>
                                                    </div>
                                                    <div className="mini-box">
                                                        <strong>{report.lessons_watched}</strong>
                                                        <span>Lessons</span>
                                                    </div>
                                                    <div className="mini-box">
                                                        <strong>{report.badges_earned}</strong>
                                                        <span>Badges</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="select-child-placeholder">
                            <div className="placeholder-content">
                                <i className="icon-chart"></i>
                                <h3>Select a child to view progress</h3>
                                <p>Weekly reports and detailed metrics will appear here.</p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
