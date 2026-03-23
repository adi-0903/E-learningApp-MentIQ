import React, { useState, useEffect } from 'react';
import api from '../api';
import './TeacherParents.css';

export function TeacherParents({ onBack }) {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParent, setSelectedParent] = useState(null);
    const [notificationMsg, setNotificationMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchParents();
    }, []);

    const fetchParents = async () => {
        try {
            setLoading(true);
            const res = await api.get('teachers/parents/');
            if (res.data.success) {
                setParents(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching teacher-parents:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!selectedParent || !notificationMsg.trim()) return;

        try {
            setSending(true);
            const res = await api.post('teachers/parents/contact/', {
                parent_id: selectedParent.id,
                message: notificationMsg,
                title: "Personal Bulletin from your Teacher"
            });
            if (res.data.success) {
                setSuccessMsg('Notification sent to parent successfully!');
                setNotificationMsg('');
                setTimeout(() => {
                    setSuccessMsg('');
                    setSelectedParent(null);
                }, 3000);
            }
        } catch (err) {
            console.error('Error sending parent notification:', err);
        } finally {
            setSending(false);
        }
    };

    const handleSimulateCall = (parent) => {
        alert(`Initiating secure call to ${parent.name} at ${parent.phone_number || 'Parent Mobile'}...`);
    }

    const filteredParents = parents.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.children.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="teacher-parents-page slide-up">
            <header className="admin-header">
                <div className="header-content">
                    <div className="header-left">
                        <button className="back-btn" onClick={onBack} title="Go Back">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg>
                        </button>
                        <div className="title-group">
                            <h1>Parent Contacts</h1>
                            <p className="subtitle">Connect with your students' parents instantly</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="search-wrapper">
                            <div className="search-bar">
                                <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="7"/><path d="M15 15l4 4"/></svg>
                                <input 
                                    type="text" 
                                    placeholder="Search by parent or child name..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <span className="results-count">{filteredParents.length} Contacts</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="admin-content-container">
                {loading ? (
                    <div className="loader">Searching for parents...</div>
                ) : filteredParents.length === 0 ? (
                    <div className="empty-state">No parent contacts found for your students.</div>
                ) : (
                    <div className="parents-grid">
                        {filteredParents.map(parent => (
                            <div className="parent-card" key={parent.id}>
                                <div className="card-top">
                                    <div className="parent-avatar">{parent.name[0]}</div>
                                    <div className="parent-meta">
                                        <h3>{parent.name}</h3>
                                        <p>{parent.email}</p>
                                    </div>
                                </div>
                                
                                <div className="parent-children">
                                    <span className="label">Children in your classes:</span>
                                    <div className="children-list">
                                        {parent.children.map(c => (
                                            <div className="child-tag-item" key={c.id}>
                                                <div className="dot"></div> {c.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="parent-actions">
                                    <button className="action-btn call" onClick={() => handleSimulateCall(parent)}>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                                        Call
                                    </button>
                                    <button className="action-btn notify" onClick={() => setSelectedParent(parent)}>
                                         <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                                        Notify
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedParent && (
                <div className="contact-modal-overlay">
                    <div className="contact-modal">
                        <div className="modal-header">
                            <h2>Send Message to {selectedParent.name}</h2>
                            <button className="close-btn" onClick={() => setSelectedParent(null)}>×</button>
                        </div>
                        <form onSubmit={handleSendNotification}>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea 
                                    placeholder="Write your message here (e.g., child's progress, upcoming test, behavioral update)..."
                                    value={notificationMsg}
                                    onChange={(e) => setNotificationMsg(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setSelectedParent(null)}>Cancel</button>
                                <button type="submit" className="send-btn" disabled={sending}>
                                    {sending ? 'Sending...' : 'Send Bulletin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="success-toast">
                    {successMsg}
                </div>
            )}
        </div>
    );
}
