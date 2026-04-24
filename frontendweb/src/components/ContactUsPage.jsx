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
            <div className="contact-page-wrapper">
                <div className="success-container">
                    <div className="success-icon-wrapper">
                        <div className="success-ring"></div>
                        <svg className="success-check" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="success-title">Message Sent!</h2>
                    <p className="success-message">Thank you for reaching out. Our team will get back to you at <strong>{form.sender_email}</strong> within 24 hours.</p>
                    <button className="back-btn" onClick={() => setSent(false)}>Send Another Message</button>
                </div>
            </div>
        );
    }

    return (
        <div className="contact-page-wrapper">
            <div className="contact-header">
                <h1>Get in Touch</h1>
                <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            </div>

            <div className="contact-content">
                <div className="contact-info-section">
                    <div className="info-card">
                        <div className="info-icon email-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <h3>Email Us</h3>
                        <p>mentiq.learn@gmail.com</p>
                    </div>

                    <div className="info-card">
                        <div className="info-icon time-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3>Response Time</h3>
                        <p>Usually within 3 hours</p>
                    </div>

                    <div className="info-card">
                        <div className="info-icon hours-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3>Working Hours</h3>
                        <p>Mon - Fri, 9am - 6pm IST</p>
                    </div>
                </div>

                <div className="contact-form-section">
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-row">
                            <div className={`form-group ${focusedField === 'name' || form.sender_name ? 'focused' : ''}`}>
                                <label>Your Name</label>
                                <input
                                    type="text"
                                    name="sender_name"
                                    value={form.sender_name}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('name')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className={`form-group ${focusedField === 'email' || form.sender_email ? 'focused' : ''}`}>
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="sender_email"
                                    value={form.sender_email}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div className={`form-group ${focusedField === 'subject' || form.subject ? 'focused' : ''}`}>
                            <label>Subject</label>
                            <div className="custom-select" onClick={() => setShowSubjects(!showSubjects)}>
                                <span className="select-value">{form.subject || 'Select a topic'}</span>
                                <svg className={`select-arrow ${showSubjects ? 'open' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                            {showSubjects && (
                                <div className="select-dropdown">
                                    {SUBJECTS.map((s) => (
                                        <div
                                            key={s}
                                            className={`select-option ${form.subject === s ? 'selected' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSubjectSelect(s);
                                            }}
                                        >
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={`form-group ${focusedField === 'message' || form.message ? 'focused' : ''}`}>
                            <label>Message</label>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('message')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Write your message here..."
                                rows="5"
                            ></textarea>
                            <span className="char-count">{form.message.length} characters</span>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <span>Sending...</span>
                            ) : (
                                <>
                                    <span>Send Message</span>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
