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
        <div className="teacher-parents-page">
            <header className="admin-header slide-down">
                <div className="header-content">
                    <div className="header-left">
                        <button className="back-btn" onClick={onBack} title="Go Back">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 10H5m0 0l7 7m-7-7l7-7"/></svg>
                        </button>
                        <div className="title-group">
                            <h1>Parent Contacts</h1>
                            <p className="subtitle">Secure communication portal for guardians</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="search-wrapper">
                            <div className="search-bar">
                                <svg className="search-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="9" r="7"/><path d="M15 15l4 4"/></svg>
                                <input 
                                    type="text" 
                                    placeholder="Search by parent or child name..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <span className="results-count">{filteredParents.length} Contacts Found</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="admin-content-container">
                {loading ? (
                    <div className="loader">Synchronizing contacts...</div>
                ) : filteredParents.length === 0 ? (
                    <div className="empty-state slide-up">
                         <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" style={{marginBottom: '20px', opacity: 0.5}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m12-10a4 4 0 11-8-0 4 4 0 018 0zm10 10V11m0 0l-3 3m3-3l3 3"/></svg>
                        <p>No parent contacts found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="parents-grid">
                        {filteredParents.map((parent, index) => (
                            <div 
                                className="parent-card slide-up" 
                                key={parent.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="card-top">
                                    <div className="parent-avatar">
                                        <span>{parent.name[0]}</span>
                                    </div>
                                    <div className="parent-meta">
                                        <h3>{parent.name}</h3>
                                        <p>{parent.email}</p>
                                    </div>
                                </div>
                                
                                <div className="parent-children">
                                    <span className="label">Associated Students</span>
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
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                                        Voice
                                    </button>
                                    <button className="action-btn notify" onClick={() => setSelectedParent(parent)}>
                                         <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                                        Message
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
                        <button className="close-btn" onClick={() => setSelectedParent(null)}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                        <div className="modal-header">
                            <div className="avatar-small" style={{
                                width: '40px', height: '40px', borderRadius: '10px', 
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', color: 'white', marginBottom: '16px'
                            }}>{selectedParent.name[0]}</div>
                            <h2>Message to Guardian</h2>
                            <p className="subtitle">Send a private bulletin to {selectedParent.name}</p>
                        </div>
                        <form onSubmit={handleSendNotification}>
                            <div className="form-group">
                                <textarea 
                                    placeholder="Type your message here... The guardian will receive a secure notification instantly."
                                    value={notificationMsg}
                                    onChange={(e) => setNotificationMsg(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="action-btn call" onClick={() => setSelectedParent(null)}>Dismiss</button>
                                <button type="submit" className="action-btn notify" disabled={sending}>
                                    {sending ? 'Processing...' : 'Broadcast Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="success-toast">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" style={{marginRight: '8px'}}><path d="M20 6L9 17l-5-5"/></svg>
                    {successMsg}
                </div>
            )}
        </div>
    );
}
