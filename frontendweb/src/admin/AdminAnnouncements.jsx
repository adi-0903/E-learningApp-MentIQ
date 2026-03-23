import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Megaphone, Send, Users, GraduationCap, BookOpen, Search, Pin, AlertTriangle, ChevronDown, X, Clock, Shield } from 'lucide-react';
import api from '../api';
import './AdminUsers.css';

export function AdminAnnouncements({ onBack }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAudience, setFilterAudience] = useState('all');

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('normal');
    const [targetAudience, setTargetAudience] = useState('all');
    const [isPinned, setIsPinned] = useState(false);
    const [sending, setSending] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get('admin/announcements/');
            const data = res.data?.data || res.data?.results || res.data || [];
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch announcements', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !content.trim()) {
            setErrorMsg('Title and content are required.');
            return;
        }
        setSending(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await api.post('admin/announcements/create/', {
                title: title.trim(),
                content: content.trim(),
                priority,
                target_audience: targetAudience,
                is_pinned: isPinned,
            });
            if (res.data?.success) {
                setSuccessMsg(res.data.message || 'Announcement sent!');
                setTitle('');
                setContent('');
                setPriority('normal');
                setTargetAudience('all');
                setIsPinned(false);
                fetchAnnouncements();
                setTimeout(() => {
                    setShowModal(false);
                    setSuccessMsg('');
                }, 1500);
            }
        } catch (err) {
            const msg = err.response?.data
                ? JSON.stringify(err.response.data)
                : 'Failed to send announcement.';
            setErrorMsg(msg);
        } finally {
            setSending(false);
        }
    };

    const getPriorityBadge = (p) => {
        const map = {
            low: { label: 'Low', cls: 'priority-low' },
            normal: { label: 'Normal', cls: 'priority-normal' },
            high: { label: 'High', cls: 'priority-high' },
            urgent: { label: 'Urgent', cls: 'priority-urgent' },
        };
        return map[p] || map.normal;
    };

    const getAudienceLabel = (a) => {
        const map = {
            all: 'Everyone',
            students: 'Students Only',
            teachers: 'Teachers Only',
        };
        return map[a] || a;
    };

    const getAudienceIcon = (a) => {
        if (a === 'students') return <GraduationCap size={13} />;
        if (a === 'teachers') return <BookOpen size={13} />;
        return <Users size={13} />;
    };

    const filtered = announcements.filter(a => {
        const matchSearch = a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.content?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchAudience = filterAudience === 'all' ? true : a.target_audience === filterAudience;
        return matchSearch && matchAudience;
    });

    return (
        <div className="admin-users-page">
            {/* Header */}
            <div className="admin-page-header">
                <div className="admin-page-header-left">
                    <h2>Announcements</h2>
                    <p>Send targeted messages to students and teachers</p>
                </div>
                <button className="admin-create-btn" onClick={() => setShowModal(true)}>
                    <Megaphone size={16} />
                    New Announcement
                </button>
            </div>

            {/* Filters */}
            <div className="admin-filters-row">
                <div className="admin-search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search announcements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="admin-filter-group">
                    <select value={filterAudience} onChange={(e) => setFilterAudience(e.target.value)}>
                        <option value="all">All Audiences</option>
                        <option value="students">Students Only</option>
                        <option value="teachers">Teachers Only</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="admin-stats-row">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                        <Megaphone size={18} />
                    </div>
                    <div className="admin-stat-info">
                        <h3>{announcements.length}</h3>
                        <span>Total</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                        <GraduationCap size={18} />
                    </div>
                    <div className="admin-stat-info">
                        <h3>{announcements.filter(a => a.target_audience === 'students' || a.target_audience === 'all').length}</h3>
                        <span>To Students</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <BookOpen size={18} />
                    </div>
                    <div className="admin-stat-info">
                        <h3>{announcements.filter(a => a.target_audience === 'teachers' || a.target_audience === 'all').length}</h3>
                        <span>To Teachers</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                        <Pin size={18} />
                    </div>
                    <div className="admin-stat-info">
                        <h3>{announcements.filter(a => a.is_pinned).length}</h3>
                        <span>Pinned</span>
                    </div>
                </div>
            </div>

            {/* Announcement List */}
            <div className="admin-users-table-card" style={{ padding: '0' }}>
                {loading ? (
                    <div className="admin-loading-state">Loading announcements...</div>
                ) : filtered.length === 0 ? (
                    <div className="admin-empty-state">
                        <Megaphone size={40} style={{ opacity: 0.3 }} />
                        <p>No announcements found</p>
                    </div>
                ) : (
                    <div className="admin-announcement-list">
                        {filtered.map((a) => {
                            const badge = getPriorityBadge(a.priority);
                            return (
                                <div key={a.id} className={`admin-announcement-card ${a.is_pinned ? 'pinned' : ''}`}>
                                    <div className="admin-announcement-top">
                                        <div className="admin-announcement-meta">
                                            {a.is_pinned && <Pin size={13} className="admin-pin-icon" />}
                                            <span className={`admin-priority-badge ${badge.cls}`}>{badge.label}</span>
                                            <span className="admin-audience-badge">
                                                {getAudienceIcon(a.target_audience)}
                                                {getAudienceLabel(a.target_audience)}
                                            </span>
                                            {a.created_by_admin && (
                                                <span className="admin-source-badge">
                                                    <Shield size={11} /> Admin
                                                </span>
                                            )}
                                        </div>
                                        <span className="admin-announcement-time">
                                            <Clock size={12} />
                                            {new Date(a.created_at).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <h4 className="admin-announcement-title">{a.title}</h4>
                                    <p className="admin-announcement-content">{a.content}</p>
                                    <div className="admin-announcement-footer">
                                        <span className="admin-announcement-author">
                                            By {a.teacher_name || 'Admin'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Announcement Modal */}
            {showModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
                        <div className="admin-modal-header">
                            <h2><Megaphone size={20} /> New Announcement</h2>
                            <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            {successMsg && <div className="admin-success-msg">{successMsg}</div>}
                            {errorMsg && <div className="admin-error-msg">{errorMsg}</div>}

                            <div className="admin-form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Announcement title..."
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Message</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your announcement message..."
                                    rows={5}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="admin-form-group">
                                    <label>Target Audience</label>
                                    <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                                        <option value="all">Everyone</option>
                                        <option value="students">Students Only</option>
                                        <option value="teachers">Teachers Only</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>Priority</label>
                                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={isPinned}
                                        onChange={(e) => setIsPinned(e.target.checked)}
                                    />
                                    <Pin size={14} />
                                    Pin this announcement
                                </label>
                            </div>

                            {/* Audience Preview */}
                            <div className="admin-audience-preview">
                                <div className="admin-audience-preview-icon">
                                    {targetAudience === 'students' && <GraduationCap size={20} />}
                                    {targetAudience === 'teachers' && <BookOpen size={20} />}
                                    {targetAudience === 'all' && <Users size={20} />}
                                </div>
                                <div className="admin-audience-preview-text">
                                    <strong>Sending to: {getAudienceLabel(targetAudience)}</strong>
                                    <span>
                                        {targetAudience === 'students' && 'Only students will see this announcement. Teachers will NOT see it.'}
                                        {targetAudience === 'teachers' && 'Only teachers will see this announcement. Students will NOT see it.'}
                                        {targetAudience === 'all' && 'Both students and teachers will see this announcement.'}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="admin-submit-btn"
                                onClick={handleSend}
                                disabled={sending || !title.trim() || !content.trim()}
                            >
                                {sending ? 'Sending...' : (
                                    <><Send size={16} /> Send Announcement</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
