import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, Activity } from 'lucide-react';
import api from '../api';
import './TeacherStatsCard.css';

export function TeacherStatsCard() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('teachers/dashboard-stats/')
            .then(res => {
                if (res.data && res.data.success) {
                    setStats(res.data.data);
                }
            })
            .catch(err => {
                console.error("Error fetching teacher stats:", err);
                setStats({
                    total_students: 0,
                    active_courses: 0,
                    avg_attendance: 0,
                    pending_doubts: 0
                });
            })
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div className="teacher-stats-wrapper skeleton"></div>;

    const statItems = [
        { label: "Total Students", value: stats?.total_students || 0, icon: <Users size={20} />, colorClass: "blue", change: "+12% this month" },
        { label: "Active Courses", value: stats?.active_courses || 0, icon: <BookOpen size={20} />, colorClass: "purple", change: "Updated recently" },
        { label: "Avg Attendance", value: `${stats?.avg_attendance || 0}%`, icon: <Activity size={20} />, colorClass: "green", change: "Above average" },
        { label: "Pending Doubts", value: stats?.pending_doubts || 0, icon: <Clock size={20} />, colorClass: "orange", change: "Requires attention" }
    ];

    return (
        <div className="teacher-stats-wrapper slide-up">
            {statItems.map((item, idx) => (
                <div key={idx} className="teacher-stat-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="ts-header">
                        <div className={`ts-icon ${item.colorClass}`}>
                            {item.icon}
                        </div>
                        <span className="ts-label">{item.label}</span>
                    </div>
                    <div className="ts-body">
                        <div className="ts-value">{item.value}</div>
                        <div className="ts-change">{item.change}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
