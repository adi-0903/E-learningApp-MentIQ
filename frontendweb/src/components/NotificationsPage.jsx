import React, { useState, useEffect } from 'react';
import './NotificationsPage.css';
import api from '../api';

export function NotificationsPage({ onBack }) {
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [readIds, setReadIds] = useState([]);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    useEffect(() => {
        fetchAnnouncements();
        try {
            const ids = JSON.parse(localStorage.getItem('read_announcements')) || [];
            setReadIds(ids);
        } catch (e) { }
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('announcements/');
            if (res.data && res.data.success) {
                const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data.results || []);
                setAnnouncements(items);
            } else if (res.data && res.data.results) {
                const items = res.data.results;
                setAnnouncements(items);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = (ann, currentItems = announcements) => {
        setSelectedNotification(ann);

        let newReadIds = [...readIds];
        if (!newReadIds.includes(ann.id)) {
            newReadIds.push(ann.id);
            setReadIds(newReadIds);
            localStorage.setItem('read_announcements', JSON.stringify(newReadIds));
            // Tell header to recalculate unread badge
            window.dispatchEvent(new Event('announcementsRead'));
        }
    };

    const isImage = (url) => {
        return url && url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    };

    return (
        <div className="premium-notif-wrapper slide-up">
            <div className="nav-blur-bar">

                <div className="nav-title">
                    <h2>Updates Hub</h2>
                    <div className="unread-counter">
                        {announcements.filter(a => !readIds.includes(a.id)).length} Unread
                    </div>
                </div>
            </div>

            <div className="premium-notif-layout">
                {/* LEFT SIDEBAR: LIST OF ANNOUNCEMENTS */}
                <div className="notif-sidebar">
                    {isLoading ? (
                        <div className="notif-loading">
                            <div className="pulse-loader"></div>
                            <span>Syncing network...</span>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="notif-empty-sidebar">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                            <p>Inbox is entirely clear.</p>
                        </div>
                    ) : (
                        <div className="notif-list">
                            {announcements.map((ann, idx) => {
                                const isRead = readIds.includes(ann.id);
                                const isSelected = selectedNotification?.id === ann.id;
                                return (
                                    <div
                                        key={ann.id || idx}
                                        className={`notif-list-item ${isRead ? 'read' : 'unread'} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleNotificationClick(ann)}
                                    >
                                        {!isRead && <div className="unread-dot"></div>}
                                        <div className="item-meta">
                                            <span className="item-author">{ann.teacher_name || 'Instructor'}</span>
                                            <span className="item-date">{new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <h4 className="item-title">{ann.title}</h4>
                                        <p className="item-preview">{ann.content}</p>
                                        <div className="item-tags">
                                            {ann.course && <span className="tag course-tag">{ann.course_title?.substring(0, 15) || 'Course'}...</span>}
                                            {ann.attachment && <span className="tag attachment-tag">📎 Attachment</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT PANE: DETAIL VIEWER */}
                <div className="notif-viewer">
                    {selectedNotification ? (
                        <div className="viewer-content expand-scale-up">
                            <div className="viewer-header">
                                <div className="viewer-badges">
                                    {selectedNotification.course && (
                                        <div className="viewer-course-badge">
                                            <span className="circle"></span>
                                            {selectedNotification.course_title || 'Enrolled Course'}
                                        </div>
                                    )}
                                </div>
                                <h1 className="viewer-title">{selectedNotification.title}</h1>
                                <div className="viewer-meta">
                                    <div className="viewer-author-block">
                                        <div className="author-avatar">
                                            {selectedNotification.teacher_name ? selectedNotification.teacher_name.charAt(0).toUpperCase() : 'I'}
                                        </div>
                                        <div className="author-details">
                                            <strong>{selectedNotification.teacher_name || 'Instructor'}</strong>
                                            <span>{new Date(selectedNotification.created_at).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="viewer-body custom-scrollbar">
                                <div className="viewer-text">
                                    {selectedNotification.content.split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>

                                {selectedNotification.attachment && (
                                    <div className="viewer-attachment-box">
                                        <div className="attachment-header">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                            <h3>Attached Resources</h3>
                                        </div>
                                        <div className="attachment-content">
                                            {isImage(selectedNotification.attachment) ? (
                                                <div className="premium-download-btn" onClick={() => setFullscreenImage(selectedNotification.attachment)} style={{ cursor: 'pointer' }}>
                                                    <div className="file-icon" style={{ padding: 0, overflow: 'hidden' }}>
                                                        <img src={selectedNotification.attachment} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div className="file-info">
                                                        <span className="file-name">Image Attachment</span>
                                                        <span className="file-action">Click to view full screen ⤢</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <a href={selectedNotification.attachment} target="_blank" rel="noopener noreferrer" className="premium-download-btn">
                                                    <div className="file-icon">
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                                    </div>
                                                    <div className="file-info">
                                                        <span className="file-name">External Document</span>
                                                        <span className="file-action">Click to view/download →</span>
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="viewer-empty-state">
                            <div className="hologram-orb"></div>
                            <h3>Select an Update</h3>
                            <p>Choose an announcement from the sidebar to view its full details prominently.</p>
                        </div>
                    )}
                </div>
            </div>

            {fullscreenImage && (
                <div className="fullscreen-image-modal" onClick={() => setFullscreenImage(null)}>
                    <div className="notif-modal-backdrop"></div>
                    <img src={fullscreenImage} alt="Fullscreen Attachment" className="fullscreen-img-content expand-scale-up" onClick={(e) => e.stopPropagation()} />
                    <button className="close-fullscreen-btn" onClick={() => setFullscreenImage(null)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            )}
        </div>
    );
}
