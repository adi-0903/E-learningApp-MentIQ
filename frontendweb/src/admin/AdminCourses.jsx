import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, BookOpen, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../api';
import './AdminUsers.css';

export function AdminCourses({ onBack }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCourses();
    }, [search]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get(`admin/courses/?search=${search}`);
            if (res.data) {
                const data = res.data.results || res.data.data || res.data;
                setCourses(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to load courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (e, id) => {
        e.stopPropagation();
        try {
            await api.post(`admin/courses/${id}/toggle-publish/`);
            fetchCourses();
        } catch (err) {
            console.error('Failed to toggle publish:', err);
        }
    };

    return (
        <div className="admin-users-page">
            <div className="admin-topbar">
                <div className="admin-topbar-left">
                    <button className="admin-back-btn" onClick={onBack}>
                        <ArrowLeft />
                    </button>
                    <h1>All Courses</h1>
                    <span className="admin-count-badge">{courses.length} courses</span>
                </div>
                <div className="admin-search-bar">
                    <Search />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Teacher</th>
                            <th>Category</th>
                            <th>Level</th>
                            <th>Students</th>
                            <th>Lessons</th>
                            <th>Quizzes</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan="9"><div className="admin-skeleton" style={{ height: 20, width: '100%' }} /></td>
                                </tr>
                            ))
                        ) : courses.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No courses found
                                </td>
                            </tr>
                        ) : (
                            courses.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div className="admin-table-user">
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: 'rgba(245, 158, 11, 0.15)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fbbf24', flexShrink: 0
                                            }}>
                                                <BookOpen size={18} />
                                            </div>
                                            <div>
                                                <div className="admin-table-user-name">{c.title}</div>
                                                <div className="admin-table-user-email">{c.duration || 'No duration'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="admin-table-user-name" style={{ fontSize: '0.82rem' }}>{c.teacher_name}</div>
                                        <div className="admin-table-user-email">{c.teacher_email}</div>
                                    </td>
                                    <td style={{ textTransform: 'capitalize' }}>{c.category?.replace('_', ' ') || '—'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{c.level?.replace('_', ' ') || '—'}</td>
                                    <td>{c.student_count}</td>
                                    <td>{c.lesson_count}</td>
                                    <td>{c.quiz_count}</td>
                                    <td>
                                        <span className={`admin-status-badge ${c.is_published ? 'active' : 'inactive'}`}>
                                            <span className="admin-status-dot" />
                                            {c.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-table-actions">
                                            <button
                                                className="admin-table-action-btn"
                                                title={c.is_published ? 'Unpublish' : 'Publish'}
                                                onClick={(e) => handleTogglePublish(e, c.id)}
                                            >
                                                {c.is_published ? <ToggleRight /> : <ToggleLeft />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
