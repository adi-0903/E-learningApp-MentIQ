import React, { useState } from 'react';
import './ProfilePage.css';
import '../components/CardLayouts.css';
import api from '../api';

const AVATARS = [
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor1',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor2',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor3',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor4',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor5',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor6',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor7',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor8',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor9',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor10',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor11',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor12',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor13',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor14',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor15',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor16',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor17',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor18',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor19',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor20',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor21',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor22',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor23',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor24',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor25',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor26',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor27',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor28',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor29',
    'https://api.dicebear.com/7.x/notionists-neutral/png?seed=Mentor30',
];

export function ProfilePage({ userData, onBackToDashboard, onLogout, onUpdateProfile }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(userData?.name || '');
    const [bio, setBio] = useState(userData?.bio || '');
    const [phone, setPhone] = useState(userData?.phone_number || '');
    const [loading, setLoading] = useState(false);
    const [profileAvatar, setProfileAvatar] = useState(userData?.profile_avatar || '');
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [stats, setStats] = useState({ courses: 0, completed: 0, avg_score: 0 });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('students/dashboard/');
                if (res.data && res.data.success) {
                    const data = res.data.data;
                    setStats({
                        courses: data.total_enrolled_courses || 0,
                        completed: data.completed_courses || 0,
                        avg_score: data.average_quiz_score || 0
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile stats", err);
            }
        };
        if (userData?.role === 'student' || !userData?.role) {
            fetchStats();
        }
    }, [userData]);

    React.useEffect(() => {
        if (userData) {
            setName(userData.name || '');
            setBio(userData.bio || '');
            setPhone(userData.phone_number || '');
            setProfileAvatar(userData.profile_avatar || '');
        }
    }, [userData]);

    const handleAvatarSelect = async (avatarUrl) => {
        setUploadingImage(true);
        try {
            const res = await api.put('auth/profile/', {
                profile_avatar: avatarUrl
            });

            if (res.data && res.data.success) {
                setProfileAvatar(avatarUrl);
                onUpdateProfile(res.data.data);
                setAvatarModalVisible(false);
            }
        } catch (error) {
            console.error('Failed to update avatar', error);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                name,
                bio,
                phone_number: phone
            };
            if (profileAvatar) payload.profile_avatar = profileAvatar;

            const res = await api.put('auth/profile/', payload);

            if (res.data && res.data.success) {
                onUpdateProfile(res.data.data);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to update profile', error);
        } finally {
            setLoading(false);
        }
    };

    const isStudent = userData?.role === 'student' || !userData?.role;

    // Deterministic Avatar Hash like GreetingCard
    const firstName = userData?.name ? userData.name.split(' ')[0] : 'Student';
    const isFemale = firstName.length % 2 !== 0;
    const defaultAvatarUrl = isFemale ? "/premium_student_portrait_female.png" : "/premium_student_portrait.png";
    const currentAvatar = profileAvatar || defaultAvatarUrl;

    return (
        <div className="profile-dashboard slide-up">
            <div className="profile-header-actions">

                <div className="profile-title">
                    <h2>Account Settings</h2>
                    <p>Manage your details, security, and preferences.</p>
                </div>
            </div>

            <div className="profile-grid">
                {/* Left Column: Identity & Stats */}
                <div className="profile-column-left">
                    {/* Identity Card */}
                    <div className="card identity-card">
                        <div className="identity-glow"></div>
                        <div className="avatar-container" onClick={() => setAvatarModalVisible(true)} style={{ cursor: 'pointer' }}>
                            <img src={currentAvatar} className={`identity-avatar premium-character-mask ${uploadingImage ? 'loading' : ''}`} alt="Profile" />
                            <div className="avatar-edit-badge">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </div>
                            <div className="status-badge" title="Online"></div>
                        </div>
                        <h3 className="identity-name">{userData?.name || 'Unknown User'}</h3>
                        <p className="identity-role">{isStudent ? 'Enrolled Student' : 'Instructor'}</p>

                        <div className="identity-details">
                            <div className="detail-item">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                <span>{userData?.email}</span>
                                {userData?.is_email_verified && <span className="status-badge-inline verified">Verified</span>}
                            </div>
                            <div className="detail-item">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                <span>{userData?.phone_number || 'No phone'}</span>
                                {userData?.phone_number && (
                                    <span className={`status-badge-inline ${userData?.is_phone_verified ? 'verified' : 'unverified'}`}>
                                        {userData?.is_phone_verified ? 'Verified' : 'Unverified'}
                                    </span>
                                )}
                            </div>
                            {((isStudent && userData?.student_id) || (!isStudent && userData?.teacher_id)) && (
                                <div className="detail-item uid-item">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                                    <span className="uid-text">{isStudent ? userData.student_id : userData.teacher_id}</span>
                                    <span className="status-badge-inline active">Active</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="card quick-stats-card">
                        <div className="stat-box">
                            <h4>{stats.courses}</h4>
                            <span>Courses</span>
                        </div>
                        <div className="stat-box">
                            <h4>{stats.completed}</h4>
                            <span>Completed</span>
                        </div>
                        <div className="stat-box">
                            <h4>{stats.avg_score}%</h4>
                            <span>Avg %</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Editing & Settings */}
                <div className="profile-column-right">

                    {/* Information Edit Card */}
                    <div className="card edit-info-card">
                        <div className="card-header-flex">
                            <h3>Personal Information</h3>
                            <button className="edit-toggle-btn" onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? 'Cancel' : 'Edit Mode'}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="edit-form-smooth">
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                                </div>
                                <div className="input-group">
                                    <label>Phone Number</label>
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add your phone" />
                                </div>
                                <div className="input-group full-width">
                                    <label>About Me / Bio</label>
                                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us your story..." rows="4"></textarea>
                                </div>

                                <button className="save-btn-glowing" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving securely...' : 'Save Changes'}
                                </button>
                            </div>
                        ) : (
                            <div className="read-only-bio">
                                <h4>About Me</h4>
                                <p>{userData?.bio || "No description set yet. Click Edit Mode to tell us your story!"}</p>
                            </div>
                        )}
                    </div>

                    {/* App Settings Card */}
                    <div className="card app-settings-card">
                        <h3>Preferences & Security</h3>
                        <div className="settings-list">
                            <div className="setting-tile">
                                <div className="setting-icon bg-purple"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div>
                                <div className="setting-text">
                                    <h4>Notifications</h4>
                                    <p>Emails & Push alerts</p>
                                </div>
                                <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                            <div className="setting-tile">
                                <div className="setting-icon bg-green"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
                                <div className="setting-text">
                                    <h4>Account Security</h4>
                                    <p>Passwords & 2FA</p>
                                </div>
                                <svg className="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>

                        <div className="danger-zone">
                            <button className="logout-button-modern" onClick={onLogout}>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                Secure Sign Out
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Avatar Modal */}
            {avatarModalVisible && (
                <div className="avatar-modal-overlay popup-overlay active">
                    <div className="avatar-modal popup-content active">
                        <div className="modal-header">
                            <h3>Choose Avatar</h3>
                            <button className="close-btn" onClick={() => setAvatarModalVisible(false)}>
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <p className="modal-subtitle">Select a character that represents you</p>

                        <div className="avatar-grid-scroll">
                            <div className="avatar-grid">
                                {AVATARS.map((url, index) => (
                                    <div
                                        key={index}
                                        className={`avatar-slot ${profileAvatar === url ? 'selected' : ''}`}
                                        onClick={() => handleAvatarSelect(url)}
                                    >
                                        <img src={url} alt={`Avatar ${index}`} className="avatar-choice" />
                                        {profileAvatar === url && (
                                            <div className="avatar-check">
                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
