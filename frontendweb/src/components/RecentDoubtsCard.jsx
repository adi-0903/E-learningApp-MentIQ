import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import api from '../api';
import './RecentDoubtsCard.css';

export function RecentDoubtsCard({ onOpenDoubts }) {
    const [doubts, setDoubts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('doubts/')
            .then(res => {
                if (res.data && res.data.success) {
                    const unresolved = res.data.data.filter(d => d.status !== 'resolved').slice(0, 3);
                    setDoubts(unresolved);
                }
            })
            .catch(err => {
                console.error("Error fetching doubts", err);
                setDoubts([]);
            })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="card recent-doubts-card slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="card-header-flex">
                <div className="title-section">
                    <h3>Recent Doubts</h3>
                    <div className="active-badge">{doubts.length} Pending</div>
                </div>
                <button className="view-all-btn" onClick={onOpenDoubts}>
                    View All <ArrowRight size={16} />
                </button>
            </div>

            {isLoading ? (
                <div className="mini-loader">Loading...</div>
            ) : doubts.length === 0 ? (
                <div className="empty-state">
                    <MessageCircle size={32} color="var(--primary-light)" />
                    <p>No pending doubts. Great job!</p>
                </div>
            ) : (
                <div className="doubts-list-mini">
                    {doubts.map(doubt => (
                        <div key={doubt.id} className="doubt-item-mini" onClick={onOpenDoubts}>
                            <div className="doubt-avatar">
                                {doubt.student_name ? doubt.student_name[0] : '?'}
                            </div>
                            <div className="doubt-info">
                                <span className="student-name">
                                    {doubt.student_name || 'Student'}
                                    <span className="course-tag">{doubt.course_title || 'General'}</span>
                                </span>
                                <span className="doubt-question text-ellipsis">{doubt.question}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
