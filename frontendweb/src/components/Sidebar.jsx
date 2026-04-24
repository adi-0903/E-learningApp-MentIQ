import React, { useState } from 'react';
import { Crown, ChevronLeft, ChevronRight, Bell, User, Settings } from 'lucide-react';
import './Sidebar.css';

export function Sidebar({ onOpenContact, onGoHome, onOpenCourses, onOpenClassroom, onOpenDoubts, onLogout, currentPage, userRole, onOpenAdminTeachers, onOpenAdminStudents, onOpenAdminCourses, onOpenAdminAnnouncements, onOpenAdminPremium, onOpenAdminAttendance, onOpenAdminParents, onOpenBadges, onOpenLeaderboard, onOpenParents, userData }) {
    const isTeacher = userRole === 'teacher';
    const isAdmin = userRole === 'admin';
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showTooltip, setShowTooltip] = useState(null);

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const navItems = isAdmin ? [
        { id: 'dashboard', icon: 'home', label: 'Home', onClick: onGoHome },
        { divider: true },
        { id: 'admin_teachers', icon: 'users', label: 'Teachers', onClick: onOpenAdminTeachers },
        { id: 'admin_students', icon: 'graduation-cap', label: 'Students', onClick: onOpenAdminStudents },
        { id: 'admin_parents', icon: 'users-round', label: 'Parents', onClick: onOpenAdminParents },
        { divider: true },
        { id: 'admin_courses', icon: 'book', label: 'Courses', onClick: onOpenAdminCourses },
        { id: 'admin_attendance', icon: 'clipboard-check', label: 'Attendance', onClick: onOpenAdminAttendance },
        { id: 'admin_announcements', icon: 'megaphone', label: 'Alerts', onClick: onOpenAdminAnnouncements, badge: 3 },
        { divider: true },
        { id: 'admin_premium', icon: 'crown', label: 'Premium', onClick: onOpenAdminPremium, premium: true },
    ] : [
        { id: 'dashboard', icon: 'home', label: 'Home', onClick: onGoHome },
        { id: 'courses', icon: 'book', label: 'My Courses', onClick: onOpenCourses },
        { id: 'classroom', icon: 'monitor', label: 'Classroom', onClick: onOpenClassroom },
        { id: 'doubts', icon: 'message-circle', label: 'Doubts', onClick: onOpenDoubts },
        ...(isTeacher ? [{ id: 'parents', icon: 'users-round', label: 'Parents', onClick: onOpenParents }] : []),
        ...(userRole === 'student' ? [
            { divider: true },
            { id: 'badges', icon: 'award', label: 'Badges', onClick: onOpenBadges },
            { id: 'leaderboard', icon: 'trophy', label: 'Leaderboard', onClick: onOpenLeaderboard },
        ] : []),
    ];

    const getIcon = (iconName) => {
        const icons = {
            home: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>,
            users: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87"></path><path d="M16 3.13a4 4 0 010 7.75"></path></svg>,
            'graduation-cap': <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"></path></svg>,
            'users-round': <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-3-3.87M9 21v-2a4 4 0 014-4M12 7a4 4 0 110-8 4 4 0 010 8zM12 11a6 6 0 00-6 6v4h12v-4a6 6 0 00-6-6z" /></svg>,
            book: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>,
            'clipboard-check': <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="1"></rect><path d="M9 14l2 2 4-4"></path></svg>,
            megaphone: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>,
            crown: <Crown size={20} strokeWidth={2.5} />,
            monitor: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87"></path><path d="M16 3.13a4 4 0 010 7.75"></path></svg>,
            'message-circle': <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"></path></svg>,
            award: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
            trophy: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 000-5H18"></path><path d="M4 22h16"></path><path d="M10 14V6a2 2 0 012-2h0a2 2 0 012 2v8"></path><path d="M4 22V10a2 2 0 012-2h0a2 2 0 012 2v12"></path><path d="M14 22V14a2 2 0 012-2h0a2 2 0 012 2v8"></path></svg>,
        };
        return icons[iconName] || icons.home;
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header with Logo and Collapse Toggle */}
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src="/Logo.png" alt="MentiQ Logo" className="sidebar-logo-img" />
                    {!isCollapsed && <span className="logo-text">MentiQ</span>}
                </div>
                <button className="collapse-toggle" onClick={toggleCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation Links */}
            <div className="nav-links">
                {navItems.map((item, index) => {
                    if (item.divider) {
                        return <div key={`divider-${index}`} className="nav-divider" />;
                    }
                    return (
                        <div
                            key={item.id}
                            className={`nav-item ${currentPage === item.id ? 'active' : ''} ${item.premium ? 'premium' : ''}`}
                            onClick={item.onClick}
                            onMouseEnter={() => isCollapsed && setShowTooltip(item.id)}
                            onMouseLeave={() => setShowTooltip(null)}
                            title={!isCollapsed ? item.label : ''}
                        >
                            <div className="nav-icon">{item.premium ? <Crown size={20} strokeWidth={2.5} /> : getIcon(item.icon)}</div>
                            {!isCollapsed && (
                                <>
                                    <span className="nav-label">{item.label}</span>
                                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                                </>
                            )}
                            {isCollapsed && showTooltip === item.id && (
                                <div className="tooltip">{item.label}</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* User Profile Section */}
            {!isCollapsed && (
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            <User size={20} />
                        </div>
                        <div className="user-info">
                            <span className="user-name">{userData?.name || 'User'}</span>
                            <span className="user-role">{userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'Student'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Actions */}
            <div className="bottom-actions">
                <div className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`} onClick={onOpenContact} title="Help">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {!isCollapsed && <span className="nav-label">Help</span>}
                </div>
                <div className="nav-item" title="Logout" onClick={onLogout}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    {!isCollapsed && <span className="nav-label">Logout</span>}
                </div>
            </div>
        </div>
    );

}
