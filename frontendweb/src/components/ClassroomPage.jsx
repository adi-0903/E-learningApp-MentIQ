import React, { useState, useEffect } from 'react';
import './ClassroomPage.css';
import { CalendarCard } from './CalendarCard';
import api from '../api';

export function ClassroomPage({ onBack }) {
    const [liveClasses, setLiveClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);

    const fetchLiveClasses = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('live-classes/');
            if (res.data && res.data.success) {
                setLiveClasses(res.data.data);
            } else if (res.data && res.data.results) {
                setLiveClasses(res.data.results);
            }
        } catch (err) {
            console.error("Error fetching live classes:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveClasses();
    }, []);

    const handleJoinClass = async (classId) => {
        setJoiningId(classId);
        try {
            const res = await api.post(`live-classes/${classId}/join/`);
            if (res.data && res.data.success) {
                const { meeting_url } = res.data.data;
                window.open(meeting_url, '_blank');
            } else {
                alert("Could not join the class. Please try again later.");
            }
        } catch (err) {
            console.error("Error joining live class:", err);
            alert("Failed to join class. It might not have started yet.");
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <div className="classroom-wrapper fade-in">
            <div className="classroom-header">
                <div className="header-content">
                    <h1>Virtual Classroom</h1>
                    <p>Experience real-time learning with industry experts and interactive sessions.</p>
                </div>
                {onBack && (
                    <button className="premium-back-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
                        BACK TO DASHBOARD
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="classroom-empty-container">
                    <div className="premium-spinner"></div>
                    <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Synching with live servers...</p>
                </div>
            ) : (
                <div className="classroom-main-layout">
                    <aside className="calendar-pane slide-up">
                        <CalendarCard
                            onRefresh={fetchLiveClasses}
                            liveClasses={liveClasses.map(c => ({
                                ...c,
                                scheduled_time: c.scheduled_at,
                                topic: c.title
                            }))}
                        />
                    </aside>

                    <main className="classes-pane">
                        <div className="classroom-grid">
                            {liveClasses.map(liveClass => (
                                <div key={liveClass.id} className="premium-class-card fade-in-blur">
                                    <div className="class-card-header">
                                        <h3 className="class-title">{liveClass.title}</h3>
                                        <span className={`status-badge ${liveClass.status === 'ongoing' ? 'status-ongoing' : 'status-scheduled'}`}>
                                            {liveClass.status}
                                        </span>
                                    </div>

                                    <p className="class-desc">{liveClass.description || 'Join this exclusively curated professional session to elevate your domain expertise with real-world insights.'}</p>

                                    <div className="class-meta-grid">
                                        <div className="meta-item">
                                            <span className="meta-label">MENTOR</span>
                                            <span className="meta-value">{liveClass.teacher_name}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">SCHEDULE</span>
                                            <span className="meta-value">{new Date(liveClass.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    <button
                                        className={`join-btn-ultra ${liveClass.status === 'ongoing' ? 'active' : 'disabled'}`}
                                        disabled={liveClass.status !== 'ongoing' || joiningId === liveClass.id}
                                        onClick={() => handleJoinClass(liveClass.id)}
                                    >
                                        {joiningId === liveClass.id ? 'CONNECTING...' : liveClass.status === 'ongoing' ? 'ENTER CLASSROOM' : 'NOT STARTED'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}
