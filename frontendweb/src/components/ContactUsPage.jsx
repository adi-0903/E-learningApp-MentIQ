import React, { useState, useEffect } from 'react';
import './ContactUsPage.css';
import api from '../api';

const SUBJECTS = [
    'General Inquiry',
    'Technical Support',
    'Course Issues',
    'Billing & Payments',
    'Report a Bug',
    'Feature Request',
    'Other',
];

export function ContactUsPage({ userData }) {
    const [form, setForm] = useState({
        sender_name: '',
        sender_email: '',
        subject: '',
        message: '',
    });

    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [showSubjects, setShowSubjects] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    useEffect(() => {
        if (userData) {
            setForm(prev => ({
                ...prev,
                sender_name: userData.name || '',
                sender_email: userData.email || '',
            }));
        }
    }, [userData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubjectSelect = (subj) => {
        setForm(prev => ({ ...prev, subject: subj }));
        setShowSubjects(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.sender_name.trim()) return alert('Please enter your name.');
        if (!form.sender_email.trim() || !form.sender_email.includes('@')) return alert('Please enter a valid email.');
        if (!form.subject.trim()) return alert('Please select a subject.');
        if (!form.message.trim() || form.message.length < 10) return alert('Message must be at least 10 characters.');

        setLoading(true);
        try {
            const res = await api.post('emails/contact/', form);
            if (res.data && res.data.success) {
                setSent(true);
            } else {
                alert(res.data.error?.message || 'Failed to send message.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while sending your message.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="premium-contact-wrapper slide-up">
                <div className="contact-success-card expand-scale-up">
                    <div className="success-hologram">
                        <div className="hologram-ring"></div>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h2>Transmission Successful</h2>
                    <p>Your message has securely reached our servers.<br />We'll transmit a response to <strong>{form.sender_email}</strong> shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="premium-contact-wrapper slide-up">

            <div className="contact-split-layout">
                {/* Visual / Info Left Pane */}
                <div className="contact-info-pane">
                    <div className="contact-glow-orb"></div>

                    <div className="info-content">
                        <div className="logo-badge">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        </div>
                        <h1 className="contact-title">Let's talk about<br />your future.</h1>
                        <p className="contact-subtitle">Whether you're facing technical difficulties or just want to suggest a new feature, our engineering team is standing by.</p>

                        <div className="contact-methods">
                            <div className="method-item">
                                <div className="method-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                                <div className="method-text">
                                    <strong>Direct Transmission</strong>
                                    <span>mentiq.learn@gmail.com</span>
                                </div>
                            </div>
                            <div className="method-item">
                                <div className="method-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3"></path></svg></div>
                                <div className="method-text">
                                    <strong>Operating Hours</strong>
                                    <span>Mon–Fri, 9am–6pm IST</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive floating elements */}
                        <div className="floating-stat-card">
                            <div className="stat-pulse"></div>
                            <span>Average response time: <strong>&lt; 3 Hours</strong></span>
                        </div>
                    </div>
                </div>

                {/* Form Right Pane */}
                <div className="contact-form-pane">
                    <form onSubmit={handleSubmit} className="premium-form">
                        <div className="form-header">
                            <h2>Send a Message</h2>
                        </div>

                        <div className="premium-form-grid">
                            <div className={`premium-input-group ${focusedField === 'name' || form.sender_name ? 'active' : ''}`}>
                                <label>Operator Name</label>
                                <div className="input-box">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    <input
                                        type="text"
                                        name="sender_name"
                                        value={form.sender_name}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('name')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="Identify yourself"
                                    />
                                </div>
                            </div>

                            <div className={`premium-input-group ${focusedField === 'email' || form.sender_email ? 'active' : ''}`}>
                                <label>Return Signal (Email)</label>
                                <div className="input-box">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                                    <input
                                        type="email"
                                        name="sender_email"
                                        value={form.sender_email}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="user@domain.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="premium-input-group full-width" style={{ zIndex: 10 }}>
                            <label>Designation</label>
                            <div
                                className={`input-box select-box ${showSubjects ? 'expanded' : ''} ${form.subject ? 'has-value' : ''}`}
                                onClick={() => setShowSubjects(!showSubjects)}
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
                                <span className="selected-value">{form.subject || 'Select a topic...'}</span>
                                <svg className={`select-chevron ${showSubjects ? 'up' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                            </div>

                            {showSubjects && (
                                <div className="premium-dropdown slide-up-fast">
                                    {SUBJECTS.map((s) => (
                                        <div
                                            key={s}
                                            className={`drop-item ${form.subject === s ? 'selected' : ''}`}
                                            onClick={() => handleSubjectSelect(s)}
                                        >
                                            <div className="drop-indicator"></div>
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`premium-input-group full-width textarea-group ${focusedField === 'message' || form.message ? 'active' : ''}`}>
                            <div className="textarea-header">
                                <label>Encrypted Payload (Message)</label>
                                <span className="char-counter">{form.message.length} chars</span>
                            </div>
                            <div className="input-box">
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('message')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter your transmission here..."
                                    rows="5"
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-footer">
                            <span className="security-badge">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                E2E Encrypted Channel
                            </span>

                            <button type="submit" className="cyber-submit-btn" disabled={loading}>
                                {loading ? (
                                    <div className="btn-loader"></div>
                                ) : (
                                    <>
                                        <span>INITIATE TRANSFER</span>
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    );
}
