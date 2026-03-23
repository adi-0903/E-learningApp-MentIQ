import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Bell, X, Megaphone, ChevronRight, Shield, Mail } from 'lucide-react';
import api from '../api';
import './AnnouncementPopup.css';

/**
 * AnnouncementPopup — Priority-based popup for student & teacher dashboards.
 *
 * Rules:
 *   HIGH priority   → Show popup TWICE (first visit + next revisit), then mark as fully seen.
 *   URGENT priority → Show popup EVERY time they visit the dashboard.
 *   PERSONAL (target_student set) → Always show, like urgent.
 *   Target audience filtering: 'all' | 'students' | 'teachers'
 */
export function AnnouncementPopup({ userRole }) {
    const [popupQueue, setPopupQueue] = useState([]);      // announcements to show
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const fetchAndFilter = useCallback(async () => {
        try {
            const res = await api.get('announcements/');
            const data = res.data?.results || res.data?.data || res.data || [];
            if (!Array.isArray(data) || data.length === 0) return;

            const role = (userRole || '').toLowerCase();

            // Filter: high/urgent OR personal announcements
            const relevant = data.filter(a => {
                const p = (a.priority || '').toLowerCase();
                const isPersonal = !!a.target_student;

                // Personal announcements always pass through (backend already filtered by user)
                if (isPersonal) return true;

                if (p !== 'high' && p !== 'urgent') return false;

                const audience = (a.target_audience || 'all').toLowerCase();
                if (audience === 'all') return true;
                if (audience === 'students' && role === 'student') return true;
                if (audience === 'teachers' && role === 'teacher') return true;
                return false;
            });

            if (relevant.length === 0) return;

            // Decide which to show based on localStorage tracking
            const toShow = relevant.filter(a => {
                const key = `ann_popup_${a.id}`;
                const record = localStorage.getItem(key);
                const p = (a.priority || '').toLowerCase();
                const isPersonal = !!a.target_student;

                // Personal and urgent: always show
                if (isPersonal || p === 'urgent') {
                    return true;
                }

                if (p === 'high') {
                    if (!record) {
                        // Never seen → show (first time)
                        return true;
                    }
                    const count = parseInt(record, 10);
                    // Show if seen fewer than 2 times
                    return count < 2;
                }

                return false;
            });

            if (toShow.length > 0) {
                setPopupQueue(toShow);
                setCurrentIndex(0);
                setIsVisible(true);
            }
        } catch (err) {
            console.error('AnnouncementPopup: failed to fetch', err);
        }
    }, [userRole]);

    useEffect(() => {
        // Small delay so the dashboard has time to render first
        const timer = setTimeout(() => fetchAndFilter(), 800);
        return () => clearTimeout(timer);
    }, [fetchAndFilter]);

    const handleDismiss = () => {
        setIsAnimatingOut(true);

        const current = popupQueue[currentIndex];
        if (current) {
            const key = `ann_popup_${current.id}`;
            const p = (current.priority || '').toLowerCase();
            const currentIsPersonal = !!current.target_student;

            if (p === 'high' && !currentIsPersonal) {
                const prev = parseInt(localStorage.getItem(key) || '0', 10);
                localStorage.setItem(key, String(prev + 1));
            }
            // Urgent and personal: don't store — always shows
        }

        setTimeout(() => {
            setIsAnimatingOut(false);
            if (currentIndex < popupQueue.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setIsVisible(false);
            }
        }, 350);
    };

    if (!isVisible || popupQueue.length === 0) return null;

    const current = popupQueue[currentIndex];
    if (!current) return null;

    const priority = (current.priority || 'normal').toLowerCase();
    const isUrgent = priority === 'urgent';
    const isPersonal = !!current.target_student;

    const priorityConfig = {
        high: {
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            iconBg: '#fef3c7',
            iconColor: '#d97706',
            label: 'HIGH PRIORITY',
            borderColor: '#fbbf24',
            glowColor: 'rgba(245, 158, 11, 0.25)',
        },
        urgent: {
            gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            iconBg: '#fee2e2',
            iconColor: '#dc2626',
            label: '⚡ URGENT',
            borderColor: '#f87171',
            glowColor: 'rgba(239, 68, 68, 0.3)',
        },
        personal: {
            gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            iconBg: '#e0e7ff',
            iconColor: '#4f46e5',
            label: '📩 PERSONAL MESSAGE',
            borderColor: '#818cf8',
            glowColor: 'rgba(99, 102, 241, 0.3)',
        },
    };

    const cfg = isPersonal ? priorityConfig.personal : (priorityConfig[priority] || priorityConfig.high);

    return ReactDOM.createPortal(
        <div className={`ann-popup-overlay ${isAnimatingOut ? 'ann-popup-overlay--out' : ''}`} onClick={handleDismiss}>
            <div
                className={`ann-popup-card ${isAnimatingOut ? 'ann-popup-card--out' : ''} ${isUrgent ? 'ann-popup-card--urgent' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    '--popup-glow': cfg.glowColor,
                    '--popup-border': cfg.borderColor,
                }}
            >
                {/* Header stripe */}
                <div className="ann-popup-stripe" style={{ background: cfg.gradient }}>
                    <div className="ann-popup-stripe-content">
                        <div className="ann-popup-stripe-left">
                            <div className="ann-popup-icon" style={{ background: cfg.iconBg }}>
                                {isPersonal
                                    ? <Mail size={22} color={cfg.iconColor} />
                                    : isUrgent
                                        ? <AlertTriangle size={22} color={cfg.iconColor} />
                                        : <Bell size={22} color={cfg.iconColor} />
                                }
                            </div>
                            <span className="ann-popup-priority-label">{cfg.label}</span>
                        </div>
                        <button className="ann-popup-close" onClick={handleDismiss}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="ann-popup-body">
                    {isPersonal && (
                        <div className="ann-popup-personal-badge">
                            <Mail size={12} />
                            <span>Message for you</span>
                        </div>
                    )}

                    {current.created_by_admin && !isPersonal && (
                        <div className="ann-popup-admin-badge">
                            <Shield size={12} />
                            <span>Admin Announcement</span>
                        </div>
                    )}

                    <h3 className="ann-popup-title">{current.title}</h3>
                    <p className="ann-popup-content">{current.content}</p>

                    <div className="ann-popup-meta">
                        <span className="ann-popup-author">
                            By {current.teacher_name || 'Admin'}
                        </span>
                        <span className="ann-popup-date">
                            {new Date(current.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                            })}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="ann-popup-footer">
                    {popupQueue.length > 1 && (
                        <span className="ann-popup-counter">
                            {currentIndex + 1} of {popupQueue.length}
                        </span>
                    )}
                    <button className="ann-popup-dismiss-btn" onClick={handleDismiss}>
                        {currentIndex < popupQueue.length - 1 ? (
                            <>Next <ChevronRight size={16} /></>
                        ) : (
                            'Got it'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
