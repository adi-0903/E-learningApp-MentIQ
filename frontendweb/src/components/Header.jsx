import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import api from '../api';

export function Header({ onGetStarted, userData, isLoggedIn, onOpenProfile, onOpenNotifications, currentPage, userRole }) {
    const isTeacher = userRole === 'teacher';
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    // Dynamic Title logic
    const getPageTitle = () => {
        switch (currentPage) {
            case 'courses': return isTeacher ? 'Assigned Courses' : 'Enrolled Courses';
            case 'profile': return 'My Profile';
            case 'notifications': return 'Announcements';
            case 'contact': return 'Contact Support';
            case 'classroom': return isTeacher ? 'Live Sessions' : 'Virtual Classroom';
            case 'doubts': return isTeacher ? 'Student Doubts' : 'Mentorship';
            case 'dashboard':
            default: return isTeacher ? 'Teacher Portal' : 'Student Workspace';
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchAnnouncements();
        }

        const handleStorageChange = () => {
            fetchAnnouncements(); // Re-calculate read/unread count on storage change
        };

        window.addEventListener('announcementsRead', handleStorageChange);
        return () => window.removeEventListener('announcementsRead', handleStorageChange);
    }, [isLoggedIn]);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('announcements/');
            if (res.data && res.data.success) {
                const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data.results || []);
                setAnnouncements(items);
                calculateUnread(items);
            } else if (res.data && res.data.results) {
                setAnnouncements(res.data.results);
                calculateUnread(res.data.results);
            }
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
        }
    };

    const calculateUnread = (items) => {
        let readIds = [];
        try {
            readIds = JSON.parse(localStorage.getItem('read_announcements')) || [];
        } catch (e) {
            readIds = [];
        }
        const unreadItems = items.filter(a => !readIds.includes(a.id));
        setUnreadCount(unreadItems.length);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
        // We no longer set unread to 0 here; we let the NotificationsPage handle marking read explicitly
    };

    return (
        <header className="header slide-up" style={{ animationDelay: '0.1s' }}>
            <h1>{getPageTitle()}</h1>
            <div className="header-right">
                <div className="search-bar">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" placeholder="Start searching here..." />
                </div>

                {isLoggedIn && (
                    <div className="notification-wrapper" ref={dropdownRef}>
                        <div className="notification-bell" onClick={toggleDropdown}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            {unreadCount > 0 && <div className="badge">{unreadCount > 9 ? '9+' : unreadCount}</div>}
                        </div>

                        {isDropdownOpen && (
                            <div className="notifications-dropdown slide-up-fast">
                                <h3>Notifications</h3>
                                <div className="notifications-list">
                                    {announcements.length === 0 ? (
                                        <div className="no-notifications">You're all caught up!</div>
                                    ) : (
                                        announcements.slice(0, 4).map((ann, idx) => (
                                            <div key={idx} className="notification-item">
                                                <div className="notif-icon-wrapper">
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                                                </div>
                                                <div className="notif-content">
                                                    <h4>{ann.title}</h4>
                                                    <p>{ann.content}</p>
                                                    <span className="notif-time">{new Date(ann.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {announcements.length > 0 && (
                                    <div className="notif-footer" onClick={() => {
                                        setIsDropdownOpen(false);
                                        if (onOpenNotifications) onOpenNotifications();
                                    }}>
                                        View All Announcements
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!isLoggedIn ? (
                    <button className="get-started-btn" onClick={onGetStarted}>
                        Get Started
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                ) : (
                    <div className="header-profile-section container-clickable" onClick={onOpenProfile} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px', cursor: 'pointer' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>
                                {userData?.name || 'User'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
                                {userData?.role || 'Student'}
                            </div>
                        </div>
                        <img
                            src={userData?.profile_avatar || userData?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=6b21a8&color=fff`}
                            alt="Profile"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', backgroundColor: '#6b21a8' }}
                        />
                    </div>
                )}
            </div>
        </header>
    );
}
