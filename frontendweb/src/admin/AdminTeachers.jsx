import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Search, Plus, Eye, UserX, KeyRound, X, Send, MessageSquare } from 'lucide-react';
import api from '../api';
import './AdminUsers.css';

export function AdminTeachers({ onBack, onViewDetail }) {
    const [teachers, setTeachers] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone_number: '', bio: '' });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Personal announcement modal state
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [msgTarget, setMsgTarget] = useState(null);
    const [msgForm, setMsgForm] = useState({ title: '', content: '', priority: 'high' });
    const [msgSending, setMsgSending] = useState(false);
    const [msgSuccess, setMsgSuccess] = useState('');
    const [msgError, setMsgError] = useState('');

    useEffect(() => {
        fetchTeachers();
    }, [search]);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`admin/teachers/?search=${search}`);
            if (res.data?.success) {
                const data = res.data.data;
                setTeachers(Array.isArray(data) ? data : data.results || []);
                setCount(res.data.count || 0);
            }
        } catch (err) {
            console.error('Failed to load teachers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setSubmitting(true);
        try {
            const res = await api.post('admin/teachers/create/', formData);
            if (res.data?.success) {
                setFormSuccess(res.data.message);
                setFormData({ name: '', email: '', password: '', phone_number: '', bio: '' });
                fetchTeachers();
                setTimeout(() => {
                    setShowModal(false);
                    setFormSuccess('');
                }, 1500);
            }
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.error) {
                // Backend returns { success: false, error: { code, message, details } }
                const errorObj = errData.error;
                if (errorObj.details && typeof errorObj.details === 'object' && Object.keys(errorObj.details).length > 0) {
                    const detailMessages = Object.values(errorObj.details).flat().join(' ');
                    setFormError(detailMessages);
                } else {
                    setFormError(errorObj.message || 'Failed to create teacher.');
                }
            } else if (errData) {
                // Fallback for non-standard error formats
                const messages = typeof errData === 'string' ? errData : Object.values(errData).flat().join(' ');
                setFormError(messages || 'Failed to create teacher.');
            } else {
                setFormError('Network error. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (e, id) => {
        e.stopPropagation();
        try {
            await api.post(`admin/teachers/${id}/deactivate/`);
            fetchTeachers();
        } catch (err) {
            console.error('Failed to toggle teacher status:', err);
        }
    };

    const openMsgModal = (e, teacher) => {
        e.stopPropagation();
        setMsgTarget({ id: teacher.id, name: teacher.name, email: teacher.email });
        setMsgForm({ title: '', content: '', priority: 'high' });
        setMsgSuccess('');
        setMsgError('');
        setShowMsgModal(true);
    };

    const handleSendMsg = async () => {
        if (!msgForm.title.trim() || !msgForm.content.trim()) {
            setMsgError('Title and message are required.');
            return;
        }
        setMsgSending(true);
        setMsgError('');
        setMsgSuccess('');
        try {
            const res = await api.post(`admin/teachers/${msgTarget.id}/send-announcement/`, {
                title: msgForm.title.trim(),
                content: msgForm.content.trim(),
                priority: msgForm.priority,
            });
            if (res.data?.success) {
                setMsgSuccess(res.data.message || 'Message sent!');
                setTimeout(() => {
                    setShowMsgModal(false);
                    setMsgSuccess('');
                }, 1800);
            }
        } catch (err) {
            const msg = err.response?.data?.error?.message
                || err.response?.data?.message
                || 'Failed to send message.';
            setMsgError(msg);
        } finally {
            setMsgSending(false);
        }
    };

    return (
        <div className="admin-users-page">
            {/* Top Bar */}
            <div className="admin-topbar">
                <div className="admin-topbar-left">
                    <button className="admin-back-btn" onClick={onBack}>
                        <ArrowLeft />
                    </button>
                    <h1>Teachers</h1>
                    <span className="admin-count-badge">{count} total</span>
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
                    <button className="admin-add-btn" onClick={() => setShowModal(true)}>
                        <Plus /> Add Teacher
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Teacher ID</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Courses</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan="7"><div className="admin-skeleton" style={{ height: 20, width: '100%' }} /></td>
                                </tr>
                            ))
                        ) : teachers.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No teachers found
                                </td>
                            </tr>
                        ) : (
                            teachers.map((t) => (
                                <tr key={t.id} onClick={() => onViewDetail(t.id, 'teacher')}>
                                    <td>
                                        <div className="admin-table-user">
                                            <img
                                                src={t.profile_image_url || t.profile_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0891b2&color=fff&bold=true`}
                                                alt={t.name}
                                            />
                                            <div>
                                                <div className="admin-table-user-name">{t.name}</div>
                                                <div className="admin-table-user-email">{t.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="admin-uid-chip">T-{t.teacher_id || '—'}</span></td>
                                    <td>{t.phone_number || '—'}</td>
                                    <td>
                                        <span className={`admin-status-badge ${t.is_active ? 'active' : 'inactive'}`}>
                                            <span className="admin-status-dot" />
                                            {t.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{t.courses_count}</td>
                                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="admin-table-actions">
                                            <button className="admin-table-action-btn" title="View Detail" onClick={(e) => { e.stopPropagation(); onViewDetail(t.id, 'teacher'); }}>
                                                <Eye />
                                            </button>
                                            <button className="admin-table-action-btn admin-msg-btn" title="Send Personal Message" onClick={(e) => openMsgModal(e, t)}>
                                                <MessageSquare />
                                            </button>
                                            <button className="admin-table-action-btn" title="Toggle Active" onClick={(e) => handleDeactivate(e, t.id)}>
                                                <UserX />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Teacher Modal */}
            {showModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Create New Teacher</h2>
                            <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                                <X />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleCreate}>
                                <div className="admin-form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter teacher's full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        placeholder="teacher@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Bio</label>
                                    <textarea
                                        placeholder="Short biography (optional)"
                                        rows={3}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                                {formError && <div className="admin-form-error">{formError}</div>}
                                {formSuccess && <div className="admin-form-success">{formSuccess}</div>}
                                <button className="admin-form-submit" type="submit" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Teacher Account'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Send Personal Announcement Modal */}
            {showMsgModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowMsgModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
                        <div className="admin-modal-header">
                            <h2><MessageSquare size={20} /> Send Personal Message</h2>
                            <button className="admin-modal-close" onClick={() => setShowMsgModal(false)}>
                                <X />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            {/* Recipient preview */}
                            <div className="admin-audience-preview" style={{ marginBottom: '1.2rem' }}>
                                <div className="admin-audience-preview-icon">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msgTarget?.name || '')}&background=0891b2&color=fff&bold=true&size=40`}
                                        alt=""
                                        style={{ width: 40, height: 40, borderRadius: '50%' }}
                                    />
                                </div>
                                <div className="admin-audience-preview-text">
                                    <strong>Sending to: {msgTarget?.name}</strong>
                                    <span>{msgTarget?.email} — Only this teacher will see this message as a popup.</span>
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Regarding Course Schedule"
                                    value={msgForm.title}
                                    onChange={(e) => setMsgForm({ ...msgForm, title: e.target.value })}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Message</label>
                                <textarea
                                    placeholder="Write your personal message to this teacher..."
                                    value={msgForm.content}
                                    onChange={(e) => setMsgForm({ ...msgForm, content: e.target.value })}
                                    rows={5}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Priority</label>
                                <select
                                    value={msgForm.priority}
                                    onChange={(e) => setMsgForm({ ...msgForm, priority: e.target.value })}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="high">High — Shows as popup twice</option>
                                    <option value="urgent">Urgent — Shows popup every visit</option>
                                </select>
                            </div>

                            {msgError && <div className="admin-form-error">{msgError}</div>}
                            {msgSuccess && <div className="admin-form-success">{msgSuccess}</div>}

                            <button
                                className="admin-submit-btn"
                                onClick={handleSendMsg}
                                disabled={msgSending || !msgForm.title.trim() || !msgForm.content.trim()}
                            >
                                {msgSending ? 'Sending...' : (
                                    <><Send size={16} /> Send Personal Message</>
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
