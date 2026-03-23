import React, { useState, useEffect } from 'react';
import api from '../api';
import './AdminParents.css';

export function AdminParents({ onBack }) {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchParents();
    }, []);

    const fetchParents = async () => {
        try {
            setLoading(true);
            const res = await api.get('admin/parents/');
            if (res.data.success) {
                setParents(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching parents:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredParents = parents.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.parent_id && p.parent_id.includes(searchTerm))
    );

    return (
        <div className="admin-parents-page slide-up">
            <header className="admin-header">
                <div className="header-content">
                    <div className="header-left">
                        <button className="back-btn" onClick={onBack} title="Go Back">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
                        </button>
                        <div className="title-group">
                            <h1>Parent Management</h1>
                            <p className="subtitle">View and manage all registered parent accounts</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="search-wrapper">
                            <div className="search-bar">
                                <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="7"/><path d="M15 15l4 4"/></svg>
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email or ID..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <span className="results-count">{filteredParents.length} Accounts</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="admin-content-container">
                {loading ? (
                    <div className="loader">Loading parents...</div>
                ) : filteredParents.length === 0 ? (
                    <div className="empty-state">No parents found.</div>
                ) : (
                    <div className="parents-list">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Parent Name</th>
                                    <th>Parent ID</th>
                                    <th>Contact Info</th>
                                    <th>Connected Children</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParents.map(parent => (
                                    <tr key={parent.id}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">{parent.name[0]}</div>
                                                <div className="user-details">
                                                    <span className="user-name">{parent.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><code>{parent.parent_id || 'N/A'}</code></td>
                                        <td>
                                            <div className="contact-info">
                                                <div>{parent.email}</div>
                                                <div className="phone">{parent.phone_number || 'No phone'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="children-tags">
                                                {parent.children.length > 0 ? (
                                                    parent.children.map(child => (
                                                        <span key={child.id} className="child-tag" title={child.student_id}>
                                                            {child.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="no-children">No children linked</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{new Date(parent.created_at).toLocaleDateString()}</td>
                                         <td>
                                            <span className={`status-badge ${parent.is_active !== false ? 'active' : 'inactive'}`}>
                                                <span className="status-dot"></span>
                                                {parent.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
