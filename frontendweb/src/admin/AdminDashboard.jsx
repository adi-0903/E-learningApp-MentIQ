import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, BarChart3, CreditCard, Radio, Megaphone, ClipboardCheck, Plus, Eye, Shield, TrendingUp } from 'lucide-react';
import api from '../api';
import './AdminDashboard.css';

export function AdminDashboard({ onNavigate }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('admin/dashboard/');
            if (res.data?.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load admin dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = stats ? [
        { label: 'Total Students', value: stats.total_students, icon: GraduationCap, color: 'purple' },
        { label: 'Total Teachers', value: stats.total_teachers, icon: Users, color: 'cyan' },
        { label: 'Total Courses', value: stats.total_courses, icon: BookOpen, color: 'amber' },
        { label: 'Published Courses', value: stats.published_courses, icon: BarChart3, color: 'green' },
        { label: 'Active Enrollments', value: stats.total_enrollments, icon: ClipboardCheck, color: 'pink' },
        { label: 'Total Quizzes', value: stats.total_quizzes, icon: ClipboardCheck, color: 'indigo' },
        { label: 'Live Classes', value: stats.total_live_classes, icon: Radio, color: 'orange' },
        { label: 'Total Revenue', value: `$${parseFloat(stats.total_revenue || 0).toLocaleString()}`, icon: CreditCard, color: 'teal' },
    ] : [];

    const quickActions = [
        { label: 'Add Teacher', desc: 'Create a new teacher account', icon: Plus, color: 'cyan', action: () => onNavigate('admin_add_teacher') },
        { label: 'Add Student', desc: 'Create a new student account', icon: Plus, color: 'purple', action: () => onNavigate('admin_add_student') },
        { label: 'View Courses', desc: 'Browse all platform courses', icon: Eye, color: 'amber', action: () => onNavigate('admin_courses') },
        { label: 'View Enrollments', desc: 'See all student enrollments', icon: TrendingUp, color: 'green', action: () => onNavigate('admin_enrollments') },
    ];

    return (
        <div className="admin-dashboard">
            {/* Page Header */}
            <div className="admin-page-header">
                <div>
                    <h1>Admin Command Center</h1>
                    <p>Platform overview and management</p>
                </div>
                <div className="admin-header-badge">
                    <Shield size={16} />
                    ADMIN ACCESS
                </div>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="admin-skeleton admin-skeleton-stat" />
                    ))
                ) : (
                    statCards.map((stat, idx) => (
                        <div key={idx} className="admin-stat-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className={`admin-stat-icon ${stat.color}`}>
                                <stat.icon />
                            </div>
                            <div className="admin-stat-info">
                                <h3>{stat.value}</h3>
                                <p>{stat.label}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div className="admin-quick-actions">
                {quickActions.map((action, idx) => (
                    <div key={idx} className="admin-action-card" onClick={action.action}>
                        <div className={`admin-action-icon admin-stat-icon ${action.color}`}>
                            <action.icon />
                        </div>
                        <h3>{action.label}</h3>
                        <p>{action.desc}</p>
                    </div>
                ))}
            </div>

            {/* Recent Users Panels */}
            <div className="admin-panels-row">
                {/* Recent Teachers */}
                <div className="admin-panel">
                    <div className="admin-panel-header">
                        <h2>
                            <Users size={18} />
                            Recent Teachers
                        </h2>
                        <button className="admin-view-all-btn" onClick={() => onNavigate('admin_teachers')}>
                            View All
                        </button>
                    </div>
                    <div className="admin-panel-body">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="admin-skeleton admin-skeleton-row" />
                            ))
                        ) : stats?.recent_teachers?.length > 0 ? (
                            stats.recent_teachers.map((teacher, idx) => (
                                <div key={idx} className="admin-user-row" onClick={() => onNavigate('admin_user_detail', teacher.id)}>
                                    <img
                                        src={teacher.profile_image_url || teacher.profile_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=0891b2&color=fff&bold=true`}
                                        alt={teacher.name}
                                        className="admin-user-avatar"
                                    />
                                    <div className="admin-user-info">
                                        <h4>{teacher.name}</h4>
                                        <p>{teacher.email}</p>
                                    </div>
                                    <div className="admin-user-meta">
                                        <div className="admin-uid">T-{teacher.teacher_id || '—'}</div>
                                        <div className="admin-date">{new Date(teacher.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="admin-empty-state">
                                <Users />
                                <p>No teachers yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Students */}
                <div className="admin-panel">
                    <div className="admin-panel-header">
                        <h2>
                            <GraduationCap size={18} />
                            Recent Students
                        </h2>
                        <button className="admin-view-all-btn" onClick={() => onNavigate('admin_students')}>
                            View All
                        </button>
                    </div>
                    <div className="admin-panel-body">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="admin-skeleton admin-skeleton-row" />
                            ))
                        ) : stats?.recent_students?.length > 0 ? (
                            stats.recent_students.map((student, idx) => (
                                <div key={idx} className="admin-user-row" onClick={() => onNavigate('admin_user_detail', student.id)}>
                                    <img
                                        src={student.profile_image_url || student.profile_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=7c3aed&color=fff&bold=true`}
                                        alt={student.name}
                                        className="admin-user-avatar"
                                    />
                                    <div className="admin-user-info">
                                        <h4>{student.name}</h4>
                                        <p>{student.email}</p>
                                    </div>
                                    <div className="admin-user-meta">
                                        <div className="admin-uid">S-{student.student_id || '—'}</div>
                                        <div className="admin-date">{new Date(student.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="admin-empty-state">
                                <GraduationCap />
                                <p>No students yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
