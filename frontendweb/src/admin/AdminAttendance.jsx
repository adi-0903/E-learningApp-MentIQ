import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Search, AlertTriangle, ChevronDown, ChevronUp, Bell, X, Send, Eye } from 'lucide-react';
import api from '../api';
import './AdminUsers.css';
import './AdminAttendance.css';

export function AdminAttendance({ onBack }) {
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('students');
    const [expandedStudent, setExpandedStudent] = useState(null);

    // Alert modal state
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertTarget, setAlertTarget] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [sendingAlert, setSendingAlert] = useState(false);
    const [alertSuccess, setAlertSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, [search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, sessionsRes] = await Promise.all([
                api.get(`admin/attendance/students/?search=${search}`),
                api.get(`admin/attendance/?search=${search}`)
            ]);

            if (studentsRes.data?.success) {
                setStudents(studentsRes.data.data || []);
            }
            if (sessionsRes.data?.success) {
                const sessData = sessionsRes.data.data;
                setSessions(Array.isArray(sessData) ? sessData : sessData?.results || []);
            }
        } catch (err) {
            console.error('Failed to load attendance data:', err);
        } finally {
            setLoading(false);
        }
    };

    const openAlertModal = (student) => {
        setAlertTarget(student);
        setAlertMessage(`Dear ${student.name}, your attendance is currently at ${student.overall_percentage}%. Please ensure regular attendance to maintain academic standing.`);
        setAlertSuccess('');
        setShowAlertModal(true);
    };

    const handleSendAlert = async () => {
        if (!alertTarget) return;
        setSendingAlert(true);
        try {
            const res = await api.post('admin/attendance/alert/', {
                student_id: alertTarget.student_id,
                message: alertMessage
            });
            if (res.data?.success) {
                setAlertSuccess(res.data.message);
                setTimeout(() => {
                    setShowAlertModal(false);
                    setAlertSuccess('');
                }, 2000);
            }
        } catch (err) {
            alert('Failed to send alert.');
        } finally {
            setSendingAlert(false);
        }
    };

    const getPercentageColor = (pct) => {
        if (pct >= 85) return '#10b981';
        if (pct >= 70) return '#f59e0b';
        if (pct >= 50) return '#f97316';
        return '#ef4444';
    };

    const getStatusLabel = (pct) => {
        if (pct >= 85) return 'Excellent';
        if (pct >= 70) return 'Good';
        if (pct >= 50) return 'At Risk';
        return 'Critical';
    };

    const totalSessions = sessions.length;
    const lowAttendanceCount = students.filter(s => s.overall_percentage < 70 && s.total_records > 0).length;

    return (
        <div className="admin-attendance-page">
            {/* Top Bar */}
            <div className="admin-topbar">
                <div className="admin-topbar-left">
                    <button className="admin-back-btn" onClick={onBack}>
                        <ArrowLeft />
                    </button>
                    <h1>Attendance Monitor</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="admin-search-bar">
                        <Search />
                        <input
                            type="text"
                            placeholder="Search by name, email, ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="att-stats-row">
                <div className="att-stat-card">
                    <div className="att-stat-icon" style={{ background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa' }}>
                        <Eye size={22} />
                    </div>
                    <div className="att-stat-info">
                        <span className="att-stat-value">{totalSessions}</span>
                        <span className="att-stat-label">Total Sessions</span>
                    </div>
                </div>
                <div className="att-stat-card">
                    <div className="att-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        <Search size={22} />
                    </div>
                    <div className="att-stat-info">
                        <span className="att-stat-value">{students.length}</span>
                        <span className="att-stat-label">Students Tracked</span>
                    </div>
                </div>
                <div className="att-stat-card">
                    <div className="att-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                        <AlertTriangle size={22} />
                    </div>
                    <div className="att-stat-info">
                        <span className="att-stat-value">{lowAttendanceCount}</span>
                        <span className="att-stat-label">Low Attendance</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="att-tabs">
                <button className={`att-tab ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                    👤 Student Attendance
                </button>
                <button className={`att-tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                    📅 Session Log
                </button>
            </div>

            {/* Student Attendance Table */}
            {activeTab === 'students' && (
                <div className="admin-table-wrapper">
                    <table className="admin-table att-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>UID</th>
                                <th>Attendance</th>
                                <th>Present / Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="6"><div className="admin-skeleton" style={{ height: 20, width: '100%' }} /></td>
                                    </tr>
                                ))
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No attendance data found.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => (
                                    <React.Fragment key={s.student_id}>
                                        <tr className={`att-student-row ${expandedStudent === s.student_id ? 'expanded' : ''}`}>
                                            <td>
                                                <div className="admin-table-user">
                                                    <img
                                                        src={s.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=7c3aed&color=fff&bold=true`}
                                                        alt={s.name}
                                                    />
                                                    <div>
                                                        <div className="admin-table-user-name">{s.name}</div>
                                                        <div className="admin-table-user-email">{s.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="admin-uid-chip">{s.student_uid}</span></td>
                                            <td>
                                                <div className="att-progress-cell">
                                                    <div className="att-progress-bar-bg">
                                                        <div
                                                            className="att-progress-bar-fill"
                                                            style={{
                                                                width: `${s.overall_percentage}%`,
                                                                background: getPercentageColor(s.overall_percentage)
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="att-progress-text" style={{ color: getPercentageColor(s.overall_percentage) }}>
                                                        {s.overall_percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="att-fraction">
                                                    <strong>{s.total_present}</strong> / {s.total_records}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`att-status-badge att-status-${getStatusLabel(s.overall_percentage).toLowerCase().replace(' ', '-')}`}>
                                                    {getStatusLabel(s.overall_percentage)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-table-actions">
                                                    <button
                                                        className="admin-table-action-btn"
                                                        title="View Details"
                                                        onClick={() => setExpandedStudent(expandedStudent === s.student_id ? null : s.student_id)}
                                                    >
                                                        {expandedStudent === s.student_id ? <ChevronUp /> : <ChevronDown />}
                                                    </button>
                                                    {s.overall_percentage < 75 && s.total_records > 0 && (
                                                        <button
                                                            className="att-alert-btn"
                                                            title="Send Alert"
                                                            onClick={() => openAlertModal(s)}
                                                        >
                                                            <Bell size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Course Details */}
                                        {expandedStudent === s.student_id && s.courses && (
                                            <tr className="att-detail-row">
                                                <td colSpan="6">
                                                    <div className="att-detail-content">
                                                        <h4>Course-wise Breakdown</h4>
                                                        {s.courses.length === 0 ? (
                                                            <p className="att-no-courses">No course enrollments found.</p>
                                                        ) : (
                                                            <div className="att-course-grid">
                                                                {s.courses.map((c) => (
                                                                    <div key={c.course_id} className="att-course-card">
                                                                        <div className="att-course-card-header">
                                                                            <span className="att-course-title">{c.course_title}</span>
                                                                            <span
                                                                                className="att-course-pct"
                                                                                style={{ color: getPercentageColor(c.percentage) }}
                                                                            >
                                                                                {c.percentage}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="att-course-bar-bg">
                                                                            <div
                                                                                className="att-course-bar-fill"
                                                                                style={{
                                                                                    width: `${c.percentage}%`,
                                                                                    background: getPercentageColor(c.percentage)
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="att-course-stats">
                                                                            <span>✅ Present: {c.present}</span>
                                                                            <span>❌ Absent: {c.absent}</span>
                                                                            <span>📋 Sessions: {c.total_sessions}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Session Log Table */}
            {activeTab === 'sessions' && (
                <div className="admin-table-wrapper">
                    <table className="admin-table att-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Teacher</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Total</th>
                                <th>Present</th>
                                <th>Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="7"><div className="admin-skeleton" style={{ height: 20, width: '100%' }} /></td>
                                    </tr>
                                ))
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No sessions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => {
                                    const rate = session.total_records > 0
                                        ? Math.round((session.present_count / session.total_records) * 100)
                                        : 0;
                                    return (
                                        <tr key={session.id}>
                                            <td><strong>{session.course_title}</strong></td>
                                            <td>{session.teacher_name}</td>
                                            <td>{new Date(session.date).toLocaleDateString()}</td>
                                            <td>{session.start_time}</td>
                                            <td>{session.total_records}</td>
                                            <td>{session.present_count}</td>
                                            <td>
                                                <span style={{ color: getPercentageColor(rate), fontWeight: 600 }}>
                                                    {rate}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Alert Modal */}
            {showAlertModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowAlertModal(false)}>
                    <div className="admin-modal att-alert-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>
                                <AlertTriangle size={20} style={{ color: '#f59e0b', marginRight: 8 }} />
                                Send Attendance Alert
                            </h2>
                            <button className="admin-modal-close" onClick={() => setShowAlertModal(false)}>
                                <X />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            {alertTarget && (
                                <div className="att-alert-target-info">
                                    <img
                                        src={alertTarget.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(alertTarget.name)}&background=7c3aed&color=fff&bold=true`}
                                        alt={alertTarget.name}
                                    />
                                    <div>
                                        <strong>{alertTarget.name}</strong>
                                        <span className="att-alert-pct" style={{ color: getPercentageColor(alertTarget.overall_percentage) }}>
                                            Attendance: {alertTarget.overall_percentage}%
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="admin-form-group">
                                <label>Alert Message</label>
                                <textarea
                                    value={alertMessage}
                                    onChange={(e) => setAlertMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Type your alert message..."
                                />
                            </div>
                            {alertSuccess && <div className="admin-form-success">{alertSuccess}</div>}
                            <button
                                className="admin-form-submit att-send-alert-btn"
                                onClick={handleSendAlert}
                                disabled={sendingAlert || !alertMessage.trim()}
                            >
                                <Send size={16} />
                                {sendingAlert ? 'Sending...' : 'Send Alert'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
