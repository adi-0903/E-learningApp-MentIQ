import React, { useState, useEffect } from 'react';
import './ContactUsPage.css';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Send,
    MessageSquare,
    Github,
    Twitter,
    Linkedin,
    Globe,
    Clock,
    ShieldCheck
} from 'lucide-react';

export const ContactUsPage = ({ onBack, userData }) => {
    const [formData, setFormData] = useState({
        name: userData?.name || '',
        email: userData?.email || '',
        subject: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (userData) {
            setFormData(prev => ({
                ...prev,
                name: userData.full_name || userData.name || '',
                email: userData.email || ''
            }));
        }
    }, [userData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            setFormData({
                name: userData?.full_name || userData?.name || '',
                email: userData?.email || '',
                subject: '',
                message: ''
            });

            // Reset success message after 5 seconds
            setTimeout(() => setSubmitted(false), 5000);
        }, 1500);
    };

    return (
        <div className="contact-page-wrapper fade-in">
            {/* Background Elements */}
            <div className="contact-bg-blob blob-1"></div>
            <div className="contact-bg-blob blob-2"></div>
            <div className="contact-bg-glow"></div>

            <header className="contact-header">
                <button className="back-btn-modern" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>
                <div className="header-text">
                    <h1 className="contact-title">Get in <span className="text-gradient">Touch</span></h1>
                    <p className="contact-subtitle">Have questions or feedback? We're here to help you on your learning journey.</p>
                </div>
            </header>

            <div className="contact-container">
                {/* Contact Info Side */}
                <div className="contact-info-section">
                    <div className="info-card-grid">
                        <div className="info-card">
                            <div className="info-icon-wrapper">
                                <Mail className="info-icon" />
                            </div>
                            <div className="info-content">
                                <h3>Email Us</h3>
                                <p>mentiq.learn@gmail.com</p>
                                <span className="info-hint">Response within 24h</span>
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-icon-wrapper">
                                <Phone className="info-icon" />
                            </div>
                            <div className="info-content">
                                <h3>Call Us</h3>
                                <p>+91 70098 12679</p>
                                <span className="info-hint">Mon-Fri, 9am-6pm</span>
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-icon-wrapper">
                                <MapPin className="info-icon" />
                            </div>
                            <div className="info-content">
                                <h3>Visit Us</h3>
                                <p>MentiQ Hub, Sector 42, Delhi</p>
                            </div>
                        </div>
                    </div>

                    <div className="social-connect">
                        <h3>Follow Us</h3>
                        <div className="social-links">
                            <a href="#" className="social-icon"><Github size={18} /></a>
                            <a href="#" className="social-icon"><Twitter size={18} /></a>
                            <a href="#" className="social-icon"><Linkedin size={18} /></a>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="contact-form-section">
                    <form className="contact-form-modern" onSubmit={handleSubmit}>
                        <div className="form-header-inner">
                            <MessageSquare className="form-header-icon" />
                            <h2>Send a Message</h2>
                        </div>

                        <div className="form-row">
                            <div className="form-group-modern">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group-modern">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group-modern">
                            <label>Subject</label>
                            <div className="input-wrapper">
                                <select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Select a subject</option>
                                    <option value="General Inquiry">General Inquiry</option>
                                    <option value="Technical Support">Technical Support</option>
                                    <option value="Billing">Billing & Payments</option>
                                    <option value="Course Feedback">Course Feedback</option>
                                    <option value="Partnership">Partnership</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group-modern">
                            <label>Message</label>
                            <div className="input-wrapper">
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Write your message here..."
                                    rows="5"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`submit-btn-modern ${isSubmitting ? 'loading' : ''} ${submitted ? 'success' : ''}`}
                            disabled={isSubmitting || submitted}
                        >
                            {isSubmitting ? (
                                <span className="loader-dots">Sending...</span>
                            ) : submitted ? (
                                <>
                                    <ShieldCheck size={18} />
                                    <span>Message Sent!</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Message</span>
                                    <Send size={18} />
                                </>
                            )}
                        </button>

                        {submitted && (
                            <p className="success-text fade-in">Thank you! We'll get back to you shortly.</p>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
