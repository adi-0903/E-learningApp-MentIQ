import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, Search, Plus, Eye, UserX, X, GraduationCap } from 'lucide-react';
import api from '../api';
import './AdminUsers.css';

export function AdminParents({ onBack, onViewDetail }) {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Create modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone_number: '' });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Student search / linking state
    const [studentQuery, setStudentQuery] = useState('');
    const [studentResults, setStudentResults] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]); // [{ id, name, email, student_id }]
    const [studentSearching, setStudentSearching] = useState(false);
    const searchTimeout = useRef(null);

    useEffect(() => {
        fetchParents();
    }, []);

    const fetchParents = async () => {
        try {
            setLoading(true);
            const res = await api.get('admin/parents/');
            if (res.data.success) setParents(res.data.data);
        } catch (err) {
            console.error('Error fetching parents:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Student search ──────────────────────────────────────
    useEffect(() => {
        clearTimeout(searchTimeout.current);
        if (!studentQuery.trim()) { setStudentResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            try {
                setStudentSearching(true);
                const res = await api.get(`admin/students/search/?q=${encodeURIComponent(studentQuery)}`);
                if (res.data?.success) {
                    // Filter out already-selected students
                    const filtered = res.data.data.filter(s => !selectedStudents.find(sel => sel.id === s.id));
                    setStudentResults(filtered);
                }
            } catch (err) {
                console.error('Student search error:', err);
            } finally {
                setStudentSearching(false);
            }
        }, 350);
    }, [studentQuery, selectedStudents]);

    const addStudent = (student) => {
        setSelectedStudents(prev => [...prev, student]);
        setStudentResults([]);
        setStudentQuery('');
    };

    const removeStudent = (id) => {
        setSelectedStudents(prev => prev.filter(s => s.id !== id));
    };

    // ── Create parent ──────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                children: selectedStudents.map(s => s.id),
            };
            const res = await api.post('admin/parents/create/', payload);
            if (res.data?.success) {
                setFormSuccess(res.data.message);
                fetchParents();
                setTimeout(() => {
                    setShowModal(false);
                    resetModal();
                }, 1500);
            }
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.email) {
                setFormError(errData.email.join(' '));
            } else if (errData?.password) {
                setFormError(errData.password.join(' '));
            } else {
                const msg = errData?.message || Object.values(errData || {}).flat().join(' ') || 'Failed to create parent.';
                setFormError(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetModal = () => {
        setFormData({ name: '', email: '', password: '', phone_number: '' });
        setFormError('');
        setFormSuccess('');
        setSelectedStudents([]);
        setStudentQuery('');
        setStudentResults([]);
    };

    const handleDeactivate = async (e, id) => {
        e.stopPropagation();
        try {
            await api.post(`admin/parents/${id}/deactivate/`);
            fetchParents();
        } catch (err) {
            console.error('Failed to toggle parent status:', err);
        }
    };

    const filteredParents = parents.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.parent_id && String(p.parent_id).includes(searchTerm))
    );

    return (
        <div className="admin-users-page">
            {/* Top Bar */}
            <div className="admin-topbar">
                <div className="admin-topbar-left">
                    <button className="admin-back-btn" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1>Parents</h1>
                    <span className="admin-count-badge">{filteredParents.length} total</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="admin-search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className="admin-create-btn"
                        onClick={() => { resetModal(); setShowModal(true); }}
                    >
                        <Plus size={18} /> Add Parent
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper">
                {loading ? (
                    <table className="admin-table">
                        <tbody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan="7"><div className="admin-skeleton" style={{ height: 20, width: '100%' }} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : filteredParents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                        <p>No parent accounts found.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Parent</th>
                                <th>Parent ID</th>
                                <th>Contact Info</th>
                                <th>Connected Children</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParents.map(parent => (
                                <tr key={parent.id} onClick={() => onViewDetail && onViewDetail(parent.id, 'parent')}>
                                    <td>
                                        <div className="admin-table-user">
                                            <img
                                                src={parent.profile_image_url || parent.profile_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(parent.name)}&background=4f46e5&color=fff&bold=true`}
                                                alt={parent.name}
                                            />
                                            <div>
                                                <div className="admin-table-user-name">{parent.name}</div>
                                                <div className="admin-table-user-email">{parent.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="admin-uid-chip">P-{parent.parent_id || '—'}</span></td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {parent.phone_number || 'No phone'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {parent.children && parent.children.length > 0 ? (
                                                parent.children.map(child => (
                                                    <span key={child.id} style={{
                                                        fontSize: '0.7rem',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        color: '#60a5fa',
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                                    }}>
                                                        {child.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>None linked</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{new Date(parent.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`admin-status-badge ${parent.is_active !== false ? 'active' : 'inactive'}`}>
                                            <span className="admin-status-dot"></span>
                                            {parent.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-table-actions">
                                            <button
                                                className="admin-table-action-btn"
                                                title="View Profile"
                                                onClick={(e) => { e.stopPropagation(); onViewDetail && onViewDetail(parent.id, 'parent'); }}
                                            >
                                                <Eye />
                                            </button>
                                            <button
                                                className="admin-table-action-btn"
                                                title={parent.is_active !== false ? 'Deactivate' : 'Activate'}
                                                onClick={(e) => handleDeactivate(e, parent.id)}
                                            >
                                                <UserX />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Create Parent Modal ── */}
            {showModal && ReactDOM.createPortal(
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Add Parent Account</h2>
                            <button className="admin-modal-close" onClick={() => setShowModal(false)}><X /></button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleCreate}>
                                {/* Basic Info */}
                                <div className="admin-form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sarah Ahmed"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        placeholder="parent@email.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        placeholder="Min 8 characters"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="Optional"
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                    />
                                </div>

                                {/* Link Children */}
                                <div className="admin-form-group">
                                    <label>Link to Children (Students)</label>

                                    {/* Selected chips */}
                                    {selectedStudents.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                            {selectedStudents.map(s => (
                                                <span key={s.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                                                    border: '1px solid rgba(59,130,246,0.25)',
                                                    borderRadius: 8, padding: '4px 10px', fontSize: '0.8rem'
                                                }}>
                                                    <GraduationCap size={12} />
                                                    {s.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeStudent(s.id)}
                                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search input */}
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder="Search student by name, email or ID..."
                                            value={studentQuery}
                                            onChange={e => setStudentQuery(e.target.value)}
                                            autoComplete="off"
                                        />
                                        {/* Dropdown results */}
                                        {(studentResults.length > 0 || studentSearching) && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 10, zIndex: 100, marginTop: 4,
                                                maxHeight: 200, overflowY: 'auto'
                                            }}>
                                                {studentSearching ? (
                                                    <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Searching...</div>
                                                ) : studentResults.map(s => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => addStudent(s)}
                                                        style={{
                                                            padding: '10px 16px', cursor: 'pointer', display: 'flex',
                                                            alignItems: 'center', gap: 10, fontSize: '0.85rem',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <GraduationCap size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: 600 }}>{s.name}</div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                                                {s.email} • S-{s.student_id || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {formError && <div className="admin-form-error">{formError}</div>}
                                {formSuccess && <div className="admin-form-success">{formSuccess}</div>}

                                <button className="admin-form-submit" type="submit" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Parent Account'}
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
