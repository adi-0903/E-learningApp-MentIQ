import React, { useState, useEffect } from 'react';
import { Shield, Mail, Phone, Calendar, BarChart3, Settings, Database, ChevronRight, LogOut, Lock, Bell, Eye, EyeOff, RefreshCw, Monitor, ChevronDown, ChevronUp, Volume2, Vibrate, MailCheck, BookOpen, ClipboardCheck, BrainCircuit, Megaphone, Radio } from 'lucide-react';
import api from '../api';
import './AdminProfile.css';

export function AdminProfile({ userData, onBackToDashboard, onLogout, onUpdateProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(userData?.name || '');
    const [bio, setBio] = useState(userData?.bio || '');
    const [phone, setPhone] = useState(userData?.phone_number || '');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);

    // Security state
    const [showSecurity, setShowSecurity] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifSettings, setNotifSettings] = useState(null);
    const [notifLoading, setNotifLoading] = useState(false);

    useEffect(() => {
        if (userData) {
            setName(userData.name || '');
            setBio(userData.bio || '');
            setPhone(userData.phone_number || '');
        }
    }, [userData]);

    useEffect(() => {
        fetchPlatformStats();
    }, []);

    const fetchPlatformStats = async () => {
        try {
            const res = await api.get('admin/dashboard/');
            if (res.data?.success) setStats(res.data.data);
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.put('auth/profile/', { name, bio, phone_number: phone });
            if (res.data?.success) {
                onUpdateProfile(res.data.data);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to update profile', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Security Functions ──────────────────────────────
    const handleChangePassword = async () => {
        setPasswordMsg({ text: '', type: '' });
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMsg({ text: 'Please fill in all password fields.', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMsg({ text: 'Password must be at least 8 characters.', type: 'error' });
            return;
        }
        setChangingPassword(true);
        try {
            const res = await api.put('auth/change-password/', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to change password.';
            setPasswordMsg({ text: msg, type: 'error' });
        } finally {
            setChangingPassword(false);
        }
    };

    const fetchActivityLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await api.get('analytics/user-activity/');
            if (res.data?.success) {
                setActivityLogs(res.data.data || []);
            } else if (Array.isArray(res.data)) {
                setActivityLogs(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
        } finally {
            setLogsLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '—';
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m ${seconds % 60}s`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    };

    // ── Notification Functions ──────────────────────────
    const fetchNotificationSettings = async () => {
        setNotifLoading(true);
        try {
            const res = await api.get('notifications/settings/');
            if (res.data) {
                setNotifSettings(res.data.data || res.data);
            }
        } catch (err) {
            console.error('Failed to fetch notification settings:', err);
        } finally {
            setNotifLoading(false);
        }
    };

    const toggleNotifSetting = async (key) => {
        const updated = { ...notifSettings, [key]: !notifSettings[key] };
        setNotifSettings(updated);
        try {
            await api.put('notifications/settings/', { [key]: !notifSettings[key] });
        } catch (err) {
            // Revert on failure
            setNotifSettings(notifSettings);
            console.error('Failed to update notification setting:', err);
        }
    };

    // Handle section open
    const handleSecurityOpen = () => {
        const next = !showSecurity;
        setShowSecurity(next);
        if (next && activityLogs.length === 0) fetchActivityLogs();
    };

    const handleNotificationsOpen = () => {
        const next = !showNotifications;
        setShowNotifications(next);
        if (next && !notifSettings) fetchNotificationSettings();
    };

    const joinedDate = userData?.created_at
        ? new Date(userData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';

    const notifSections = [
        {
            title: 'Alert Types',
            items: [
                { key: 'announcements', label: 'Announcements', desc: 'System-wide broadcasts', icon: <Megaphone size={18} /> },
                { key: 'assignments', label: 'Assignments', desc: 'Task & assignment alerts', icon: <ClipboardCheck size={18} /> },
                { key: 'quizzes', label: 'Quizzes', desc: 'Quiz availability alerts', icon: <BrainCircuit size={18} /> },
                { key: 'courses', label: 'Course Updates', desc: 'New content & changes', icon: <BookOpen size={18} /> },
                { key: 'general', label: 'General', desc: 'System notifications', icon: <Radio size={18} /> },
            ]
        },
        {
            title: 'Delivery',
            items: [
                { key: 'sound', label: 'Sound', desc: 'Audio alerts', icon: <Volume2 size={18} /> },
                { key: 'vibration', label: 'Vibration', desc: 'Haptic feedback', icon: <Vibrate size={18} /> },
                { key: 'email_notifications', label: 'Email Alerts', desc: 'Receive via email', icon: <MailCheck size={18} /> },
            ]
        }
    ];

    return (
        <div className="admin-profile-page slide-up">
            <div className="admin-profile-page-header">
                <h2>Admin Profile</h2>
                <p>Manage your account, security, and notifications</p>
            </div>

            <div className="admin-profile-grid">
                {/* ── Left Column ──────────────────────────── */}
                <div className="admin-profile-col-left">
                    {/* Identity Card */}
                    <div className="admin-identity-card">
                        <div className="admin-identity-glow" />
                        <div className="admin-identity-avatar-wrap">
                            <img
                                src={userData?.profile_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'Admin')}&background=7c3aed&color=fff&bold=true&size=200`}
                                alt={userData?.name}
                                className="admin-identity-avatar-img"
                            />
                            <div className="admin-identity-shield"><Shield size={14} /></div>
                        </div>
                        <h3 className="admin-identity-name">{userData?.name || 'Admin'}</h3>
                        <div className="admin-identity-role-tag">
                            <Shield size={12} /> Platform Administrator
                        </div>
                        <div className="admin-identity-details">
                            <div className="admin-identity-detail-row">
                                <Mail size={16} />
                                <span>{userData?.email}</span>
                                {userData?.is_email_verified && <span className="admin-verified-chip">Verified</span>}
                            </div>
                            <div className="admin-identity-detail-row">
                                <Phone size={16} />
                                <span>{userData?.phone_number || 'No phone added'}</span>
                            </div>
                            <div className="admin-identity-detail-row">
                                <Calendar size={16} />
                                <span>Joined {joinedDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Platform Stats */}
                    <div className="admin-platform-stats-card">
                        <h3><BarChart3 size={17} /> Platform Overview</h3>
                        <div className="admin-platform-stats-mini-grid">
                            <div className="admin-platform-stat-mini">
                                <h4>{stats?.total_students || 0}</h4>
                                <span>Students</span>
                            </div>
                            <div className="admin-platform-stat-mini">
                                <h4>{stats?.total_teachers || 0}</h4>
                                <span>Teachers</span>
                            </div>
                            <div className="admin-platform-stat-mini">
                                <h4>{stats?.total_courses || 0}</h4>
                                <span>Courses</span>
                            </div>
                            <div className="admin-platform-stat-mini">
                                <h4>${parseFloat(stats?.total_revenue || 0).toLocaleString()}</h4>
                                <span>Revenue</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Column ─────────────────────────── */}
                <div className="admin-profile-col-right">
                    {/* Personal Info */}
                    <div className="admin-info-card">
                        <div className="admin-info-card-header">
                            <h3>Personal Information</h3>
                            <button className="admin-edit-toggle" onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>
                        {isEditing ? (
                            <div className="admin-edit-form">
                                <div><label>Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
                                <div><label>Phone Number</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add your phone" /></div>
                                <div className="full-span"><label>Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="About yourself..." rows={4} /></div>
                                <button className="admin-save-btn" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        ) : (
                            <div className="admin-bio-display"><h4>About Me</h4><p>{userData?.bio || 'No bio added yet. Click "Edit Profile" to add one.'}</p></div>
                        )}
                    </div>

                    {/* ═══ ACCOUNT SECURITY ═══ */}
                    <div className="admin-system-card">
                        <div className="admin-expandable-header" onClick={handleSecurityOpen}>
                            <h3><Lock size={18} /> Account Security</h3>
                            {showSecurity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>

                        {showSecurity && (
                            <div className="admin-expandable-body">
                                {/* Security Status */}
                                <div className="admin-security-status-grid">
                                    <div className="admin-security-status-item">
                                        <div className="admin-security-icon green"><Shield size={18} /></div>
                                        <div><span className="admin-security-label">SSL</span><span className="admin-security-val">Encrypted</span></div>
                                    </div>
                                    <div className="admin-security-status-item">
                                        <div className="admin-security-icon cyan"><Monitor size={18} /></div>
                                        <div><span className="admin-security-label">Session</span><span className="admin-security-val">Secured</span></div>
                                    </div>
                                    <div className="admin-security-status-item">
                                        <div className="admin-security-icon amber"><Lock size={18} /></div>
                                        <div><span className="admin-security-label">2FA</span><span className="admin-security-val">Active</span></div>
                                    </div>
                                </div>

                                {/* Change Password */}
                                <div className="admin-security-section">
                                    <h4>Change Password</h4>
                                    <div className="admin-security-form">
                                        <div className="admin-password-input-wrap">
                                            <input
                                                type={showPasswords ? 'text' : 'password'}
                                                placeholder="Current Password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                            <button className="admin-eye-btn" onClick={() => setShowPasswords(!showPasswords)}>
                                                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            placeholder="New Password (min 8 chars)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            placeholder="Confirm New Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        {passwordMsg.text && (
                                            <div className={`admin-password-msg ${passwordMsg.type}`}>{passwordMsg.text}</div>
                                        )}
                                        <button className="admin-save-btn" onClick={handleChangePassword} disabled={changingPassword}>
                                            {changingPassword ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </div>
                                </div>

                                {/* Activity Logs */}
                                <div className="admin-security-section">
                                    <div className="admin-section-header-row">
                                        <h4>Activity Feed</h4>
                                        <button className="admin-refresh-btn" onClick={fetchActivityLogs} disabled={logsLoading}>
                                            <RefreshCw size={13} className={logsLoading ? 'spinning' : ''} /> Sync
                                        </button>
                                    </div>
                                    <div className="admin-activity-list">
                                        {logsLoading ? (
                                            <div className="admin-activity-empty">Scanning logs...</div>
                                        ) : activityLogs.length === 0 ? (
                                            <div className="admin-activity-empty">No activity logs found</div>
                                        ) : (
                                            activityLogs.slice(0, 8).map((log, idx) => (
                                                <div key={log.id || idx} className="admin-activity-item">
                                                    <div className={`admin-activity-dot ${idx === 0 ? 'live' : ''}`}>
                                                        <Monitor size={14} />
                                                    </div>
                                                    <div className="admin-activity-info">
                                                        <div className="admin-activity-top">
                                                            <span className="admin-activity-time">
                                                                {new Date(log.start_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className={`admin-activity-tag ${idx === 0 ? 'live' : ''}`}>
                                                                {idx === 0 ? 'ACTIVE' : 'CLOSED'}
                                                            </span>
                                                        </div>
                                                        <span className="admin-activity-device">{log.device_info || 'Web Browser'}</span>
                                                    </div>
                                                    <div className="admin-activity-duration">
                                                        <strong>{formatDuration(log.duration_seconds)}</strong>
                                                        <small>session</small>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ NOTIFICATIONS ═══ */}
                    <div className="admin-system-card">
                        <div className="admin-expandable-header" onClick={handleNotificationsOpen}>
                            <h3><Bell size={18} /> Notification Settings</h3>
                            {showNotifications ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>

                        {showNotifications && (
                            <div className="admin-expandable-body">
                                {notifLoading ? (
                                    <div className="admin-activity-empty">Loading settings...</div>
                                ) : notifSettings ? (
                                    notifSections.map((section, sIdx) => (
                                        <div key={sIdx} className="admin-notif-section">
                                            <div className="admin-notif-section-title">{section.title}</div>
                                            {section.items.map((item) => (
                                                <div key={item.key} className="admin-notif-item">
                                                    <div className="admin-notif-icon">{item.icon}</div>
                                                    <div className="admin-notif-text">
                                                        <span className="admin-notif-label">{item.label}</span>
                                                        <span className="admin-notif-desc">{item.desc}</span>
                                                    </div>
                                                    <label className="admin-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!notifSettings[item.key]}
                                                            onChange={() => toggleNotifSetting(item.key)}
                                                        />
                                                        <span className="admin-toggle-slider" />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <div className="admin-activity-empty">Unable to load settings</div>
                                )}

                                {/* Security tip */}
                                <div className="admin-security-tip">
                                    <Shield size={16} />
                                    <div>
                                        <strong>Infrastructure Secure</strong>
                                        <p>All notifications are encrypted with TLS 1.3 for maximum transfer integrity.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="admin-logout-zone" style={{ paddingTop: 0, borderTop: 'none', marginTop: '-0.5rem' }}>
                        <button className="admin-logout-btn" onClick={onLogout}>
                            <LogOut size={18} /> Secure Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
