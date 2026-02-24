import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import api from '../api';
import './AdminUsers.css';

export function AdminEnrollments({ onBack }) {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchEnrollments();
    }, [search]);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const res = await api.get(`admin/enrollments/?search=${search}`);
            if (res.data) {
                const data = res.data.results || res.data.data || res.data;
                setEnrollments(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to load enrollments:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-users-page">
            <div className="admin-topbar">
                <div className="admin-topbar-left">
                    <button className="admin-back-btn" onClick={onBack}>
                        <ArrowLeft />
                    </button>
                    <h1>All Enrollments</h1>
                    <span className="admin-count-badge">{enrollments.length} records</span>
                </div>
                <div className="admin-search-bar">
                    <Search />
                    <input
                        type="text"
                        placeholder="Search by student or course..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Student ID</th>
                            <th>Course</th>
                            <th>Teacher</th>
                            <th>Status</th>
                            <th>Enrolled</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan="6"><div className="admin-skeleton" style={{ height: 20, width: '100%' }} /></td>
                                </tr>
                            ))
                        ) : enrollments.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No enrollments found
                                </td>
                            </tr>
                        ) : (
                            enrollments.map((e) => (
                                <tr key={e.id}>
                                    <td>
                                        <div className="admin-table-user-name">{e.student_name}</div>
                                        <div className="admin-table-user-email">{e.student_email}</div>
                                    </td>
                                    <td><span className="admin-uid-chip">S-{e.student_id_num || '—'}</span></td>
                                    <td style={{ fontWeight: 600, color: 'white' }}>{e.course_title}</td>
                                    <td>{e.teacher_name}</td>
                                    <td>
                                        <span className={`admin-status-badge ${e.is_active ? 'active' : 'inactive'}`}>
                                            <span className="admin-status-dot" />
                                            {e.is_active ? 'Active' : 'Dropped'}
                                        </span>
                                    </td>
                                    <td>{new Date(e.enrolled_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
