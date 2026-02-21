import React from 'react';
import './Sidebar.css';

export function Sidebar({ onOpenContact, onGoHome, onOpenCourses, onOpenClassroom, onOpenDoubts, onLogout, currentPage }) {
    return (
        <div className="sidebar">
            <div className="logo-container">
                <img src="/Logo.png" alt="MentiQ Logo" className="sidebar-logo-img" />
            </div>

            <div className="nav-links">
                <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={onGoHome} title="Home">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                </div>
                <div className={`nav-item ${currentPage === 'courses' ? 'active' : ''}`} onClick={onOpenCourses} title="My Courses">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <div className={`nav-item ${currentPage === 'classroom' ? 'active' : ''}`} onClick={onOpenClassroom} title="Classroom">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 010 7.75"></path>
                    </svg>
                </div>
                <div className={`nav-item ${currentPage === 'doubts' ? 'active' : ''}`} onClick={onOpenDoubts} title="Doubts">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"></path>
                    </svg>
                </div>
            </div>

            <div className="bottom-actions">
                <div className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`} onClick={onOpenContact} title="Help">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="nav-item" title="Logout" onClick={onLogout}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </div>
            </div>
        </div>
    );
}
