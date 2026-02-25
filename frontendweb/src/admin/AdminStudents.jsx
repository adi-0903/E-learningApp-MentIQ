import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Search, Plus, Eye, UserX, X } from 'lucide-react';
import api from '../api';
import './AdminUsers.css';

export function AdminStudents({ onBack, onViewDetail }) {
    const [students, setStudents] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone_number: '', bio: '' });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [search]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get(`admin/students/?search=${search}`);
            if (res.data?.success) {
                const data = res.data.data;
                setStudents(Array.isArray(data) ? data : data.results || []);
                setCount(res.data.count || 0);
            }
        } catch (err) {
            console.error('Failed to load students:', err);
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
            const res = await api.post('admin/students/create/', formData);
            if (res.data?.success) {
                setFormSuccess(res.data.message);
                setFormData({ name: '', email: '', password: '', phone_number: '', bio: '' });
                fetchStudents();
                setTimeout(() => {
                    setShowModal(false);
                    setFormSuccess('');
                }, 1500);
            }
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.error) {
                const errorObj = errData.error;
                if (errorObj.details && typeof errorObj.details === 'object' && Object.keys(errorObj.details).length > 0) {
                    const detailMessages = Object.values(errorObj.details).flat().join(' ');
                    setFormError(detailMessages);
                } else {
                    setFormError(errorObj.message || 'Failed to create student.');
                }
            } else if (errData) {
                const messages = typeof errData === 'string' ? errData : Object.values(errData).flat().join(' ');
                setFormError(messages || 'Failed to create student.');
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
            await api.post(`admin/students/${id}/deactivate/`);
            fetchStudents();
        } catch (err) {
            console.error('Failed to toggle student status:', err);
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
                    <h1>Students</h1>
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
                        <Plus /> Add Student
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Student ID</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Enrollments</th>
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
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No students found
                                </td>
                            </tr>
                        ) : (
                            students.map((s) => (
                                <tr key={s.id} onClick={() => onViewDetail(s.id, 'student')}>
                                    <td>
                                        <div className="admin-table-user">
                                            <img
                                                src={s.profile_image_url || s.profile_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=7c3aed&color=fff&bold=true`}
                                                alt={s.name}
                                            />
                                            <div>
                                                <div className="admin-table-user-name">{s.name}</div>
                                                <div className="admin-table-user-email">{s.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="admin-uid-chip">S-{s.student_id || '—'}</span></td>
                                    <td>{s.phone_number || '—'}</td>
                                    <td>
                                        <span className={`admin-status-badge ${s.is_active ? 'active' : 'inactive'}`}>
                                            <span className="admin-status-dot" />
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{s.enrollments_count}</td>
                                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="admin-table-actions">
                                            <button className="admin-table-action-btn" title="View Detail" onClick={(e) => { e.stopPropagation(); onViewDetail(s.id, 'student'); }}>
                                                <Eye />
                                            </button>
                                            <button className="admin-table-action-btn" title="Toggle Active" onClick={(e) => handleDeactivate(e, s.id)}>
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

            {/* Create Student Modal */}
            {showModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Create New Student</h2>
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
                                        placeholder="Enter student's full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        placeholder="student@example.com"
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
                                    {submitting ? 'Creating...' : 'Create Student Account'}
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
