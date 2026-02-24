import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Mail, Phone, Calendar, BookOpen, GraduationCap, ClipboardCheck, KeyRound, UserX, Edit, Shield, X } from 'lucide-react';
import api from '../api';
import './AdminUserDetail.css';
import './AdminUsers.css';

export function AdminUserDetail({ userId, userType, onBack }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [editData, setEditData] = useState({ name: '', bio: '', phone_number: '', is_active: true });
    const [actionMsg, setActionMsg] = useState({ text: '', type: '' });
    const [submitting, setSubmitting] = useState(false);

    const endpoint = userType === 'teacher' ? 'teachers' : 'students';

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const res = await api.get(`admin/${endpoint}/${userId}/`);
            if (res.data?.success) {
                setUser(res.data.data);
                setEditData({
                    name: res.data.data.name || '',
                    bio: res.data.data.bio || '',
                    phone_number: res.data.data.phone_number || '',
                    is_active: res.data.data.is_active,
                });
            }
        } catch (err) {
            console.error('Failed to load user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post(`admin/${endpoint}/${userId}/reset-password/`, { new_password: newPassword });
            if (res.data?.success) {
                setActionMsg({ text: 'Password reset successfully!', type: 'success' });
                setNewPassword('');
                setTimeout(() => { setShowResetModal(false); setActionMsg({ text: '', type: '' }); }, 1500);
            }
        } catch (err) {
            const messages = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to reset password.';
            setActionMsg({ text: messages, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.patch(`admin/${endpoint}/${userId}/update/`, editData);
            if (res.data?.success) {
                setUser(res.data.data);
                setActionMsg({ text: 'Profile updated successfully!', type: 'success' });
                setTimeout(() => { setShowEditModal(false); setActionMsg({ text: '', type: '' }); }, 1200);
            }
        } catch (err) {
            setActionMsg({ text: 'Failed to update profile.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async () => {
        try {
            const res = await api.post(`admin/${endpoint}/${userId}/deactivate/`);
            if (res.data?.success) {
                fetchUser();
            }
        } catch (err) {
            console.error('Failed to toggle status:', err);
        }
    };

    if (loading) {
        return (
            <div className="admin-user-detail-page">
                <div className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button className="admin-back-btn" onClick={onBack}><ArrowLeft /></button>
                        <h1>Loading...</h1>
                    </div>
                </div>
                <div className="admin-skeleton" style={{ height: 280, borderRadius: 24, marginBottom: 24 }} />
                <div className="admin-detail-grid">
                    <div className="admin-skeleton" style={{ height: 200, borderRadius: 24 }} />
                    <div className="admin-skeleton" style={{ height: 200, borderRadius: 24 }} />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="admin-user-detail-page">
                <div className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button className="admin-back-btn" onClick={onBack}><ArrowLeft /></button>
                        <h1>User not found</h1>
                    </div>
                </div>
            </div>
        );
    }

    const isTeacher = user.role === 'teacher';

    return (
        <div className="admin-user-detail-page">
            {/* Top Bar */}
            <div className="admin-topbar" style={{ marginBottom: '1.5rem' }}>
                <div className="admin-topbar-left">
                    <button className="admin-back-btn" onClick={onBack}><ArrowLeft /></button>
                    <h1>{isTeacher ? 'Teacher' : 'Student'} Profile</h1>
                </div>
            </div>

            {/* Profile Card */}
            <div className="admin-profile-card">
                <div className="admin-profile-banner" />
                <div className="admin-profile-content">
                    <div className="admin-profile-avatar-wrapper">
                        <img
                            src={user.profile_image_url || user.profile_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${isTeacher ? '0891b2' : '7c3aed'}&color=fff&bold=true&size=200`}
                            alt={user.name}
                            className="admin-profile-avatar"
                        />
                    </div>
                    <div className="admin-profile-info">
                        <h1>{user.name}</h1>
                        <span className={`admin-profile-role ${user.role}`}>
                            {isTeacher ? <Shield size={12} /> : <GraduationCap size={12} />}
                            {user.role}
                        </span>
                        <div className="admin-profile-meta">
                            <div className="admin-profile-meta-item">
                                <label>Email</label>
                                <span>{user.email}</span>
                            </div>
                            <div className="admin-profile-meta-item">
                                <label>{isTeacher ? 'Teacher ID' : 'Student ID'}</label>
                                <span className="mono">{isTeacher ? user.teacher_id || '—' : user.student_id || '—'}</span>
                            </div>
                            <div className="admin-profile-meta-item">
                                <label>Phone</label>
                                <span>{user.phone_number || '—'}</span>
                            </div>
                            <div className="admin-profile-meta-item">
                                <label>Status</label>
                                <span className={`admin-status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                    <span className="admin-status-dot" />
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="admin-profile-meta-item">
                                <label>Joined</label>
                                <span>{new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <div className="admin-profile-actions">
                        <button className="admin-profile-action-btn" onClick={() => setShowEditModal(true)}>
                            <Edit /> Edit
                        </button>
                        <button className="admin-profile-action-btn" onClick={() => setShowResetModal(true)}>
                            <KeyRound /> Reset Password
                        </button>
                        <button className="admin-profile-action-btn danger" onClick={handleDeactivate}>
                            <UserX /> {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Panels */}
            <div className="admin-detail-grid">
                {/* Bio & Info */}
                <div className="admin-detail-panel">
                    <div className="admin-detail-panel-header">
                        <h3><Mail size={17} /> Account Details</h3>
                    </div>
                    <div className="admin-detail-panel-body">
                        <div className="admin-detail-item">
                            <label>Bio</label>
                            <span>{user.bio || 'No bio added'}</span>
                        </div>
                        <div className="admin-detail-item">
                            <label>Email Verified</label>
                            <span style={{ color: user.is_email_verified ? '#34d399' : '#f87171' }}>
                                {user.is_email_verified ? '✓ Verified' : '✗ Not verified'}
                            </span>
                        </div>
                        <div className="admin-detail-item">
                            <label>Phone Verified</label>
                            <span style={{ color: user.is_phone_verified ? '#34d399' : '#f87171' }}>
                                {user.is_phone_verified ? '✓ Verified' : '✗ Not verified'}
                            </span>
                        </div>
                        <div className="admin-detail-item">
                            <label>Last Login</label>
                            <span>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
                        </div>
                    </div>
                </div>

                {/* Courses / Enrollments */}
                <div className="admin-detail-panel">
                    <div className="admin-detail-panel-header">
                        <h3><BookOpen size={17} /> {isTeacher ? 'Courses Teaching' : 'Enrolled Courses'}</h3>
                    </div>
                    <div className="admin-detail-panel-body">
                        {isTeacher ? (
                            user.courses?.length > 0 ? (
                                user.courses.map((c, idx) => (
                                    <div key={idx} className="admin-detail-list-item">
                                        <div className="admin-detail-list-icon admin-stat-icon amber">
                                            <BookOpen />
                                        </div>
                                        <div className="admin-detail-list-info">
                                            <h4>{c.title}</h4>
                                            <p>{c.category} • {c.is_published ? 'Published' : 'Draft'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : <div className="admin-detail-empty">No courses yet</div>
                        ) : (
                            user.enrollments?.length > 0 ? (
                                user.enrollments.map((e, idx) => (
                                    <div key={idx} className="admin-detail-list-item">
                                        <div className="admin-detail-list-icon admin-stat-icon purple">
                                            <GraduationCap />
                                        </div>
                                        <div className="admin-detail-list-info">
                                            <h4>{e.course_title}</h4>
                                            <p>Enrolled {new Date(e.enrolled_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : <div className="admin-detail-empty">No enrollments yet</div>
                        )}
                    </div>
                </div>

                {/* Attendance Stats (Students only) */}
                {!isTeacher && user.attendance_stats && (
                    <div className="admin-detail-panel">
                        <div className="admin-detail-panel-header">
                            <h3><ClipboardCheck size={17} /> Attendance</h3>
                        </div>
                        <div className="admin-detail-panel-body">
                            <div className="admin-detail-item">
                                <label>Total Sessions</label>
                                <span>{user.attendance_stats.total_sessions}</span>
                            </div>
                            <div className="admin-detail-item">
                                <label>Present</label>
                                <span style={{ color: '#34d399' }}>{user.attendance_stats.present}</span>
                            </div>
                            <div className="admin-detail-item">
                                <label>Absent</label>
                                <span style={{ color: '#f87171' }}>{user.attendance_stats.absent}</span>
                            </div>
                            <div style={{ padding: '0.5rem 0' }}>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Attendance Rate
                                </label>
                                <div className="admin-attendance-bar">
                                    <div className="admin-attendance-bar-track">
                                        <div className="admin-attendance-bar-fill" style={{ width: `${user.attendance_stats.percentage}%` }} />
                                    </div>
                                    <span>{user.attendance_stats.percentage}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quiz Stats (Students only) */}
                {!isTeacher && (
                    <div className="admin-detail-panel">
                        <div className="admin-detail-panel-header">
                            <h3><ClipboardCheck size={17} /> Quiz Performance</h3>
                        </div>
                        <div className="admin-detail-panel-body">
                            <div className="admin-detail-item">
                                <label>Total Attempts</label>
                                <span>{user.quiz_attempts_count || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reset Password Modal */}
            {showResetModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowResetModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Reset Password</h2>
                            <button className="admin-modal-close" onClick={() => setShowResetModal(false)}><X /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                Set a new password for <strong style={{ color: 'white' }}>{user.name}</strong>
                            </p>
                            <form onSubmit={handleResetPassword}>
                                <div className="admin-form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                {actionMsg.text && (
                                    <div className={actionMsg.type === 'success' ? 'admin-form-success' : 'admin-form-error'}>
                                        {actionMsg.text}
                                    </div>
                                )}
                                <button className="admin-form-submit" type="submit" disabled={submitting}>
                                    {submitting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Profile Modal */}
            {showEditModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Edit Profile</h2>
                            <button className="admin-modal-close" onClick={() => setShowEditModal(false)}><X /></button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleEdit}>
                                <div className="admin-form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        value={editData.phone_number}
                                        onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Bio</label>
                                    <textarea
                                        rows={3}
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                    />
                                </div>
                                {actionMsg.text && (
                                    <div className={actionMsg.type === 'success' ? 'admin-form-success' : 'admin-form-error'}>
                                        {actionMsg.text}
                                    </div>
                                )}
                                <button className="admin-form-submit" type="submit" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
