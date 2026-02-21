import React, { useState, useEffect } from 'react';
import './DoubtsPage.css';
import { Calendar, MessageSquare, Video, Clock, Bot, User, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import api from '../api.js';

export function DoubtsPage({ onBack }) {
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [bookingMode, setBookingMode] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [topic, setTopic] = useState('');
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const response = await api.get('students/my-teachers/');
                if (response.data && response.data.success) {
                    const mappedTeachers = response.data.data.map(t => ({
                        id: t.id,
                        name: t.name,
                        role: t.role === 'teacher' ? 'Course Instructor' : t.role,
                        expertise: t.expertise,
                        availability: t.availability,
                        isOnline: t.is_ai ? true : Math.random() > 0.5, // Mock online mostly for offline users
                        isAI: t.is_ai || false,
                        image: t.image,
                        rating: t.rating,
                        reviews: t.reviews,
                        phone_number: t.phone_number,
                        subject: t.subject
                    }));
                    setMentors(mappedTeachers);
                }
            } catch (error) {
                console.error("Error fetching teachers:", error);
                setMentors([]); // Fallback to empty
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    const handleBookSession = (mentor) => {
        setSelectedMentor(mentor);
        setBookingMode(true);
    };

    const handleConfirmBooking = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('students/book-session/', {
                teacher: selectedMentor.id,
                date: date,
                time: time,
                topic: topic
            });
            if (response.data && response.data.success) {
                alert(`Session booked with ${selectedMentor.name} for ${date} at ${time}. You will receive a notification shortly.`);
                setBookingMode(false);
                setSelectedMentor(null);
                setDate('');
                setTime('');
                setTopic('');
            } else {
                alert('Session booking failed. Please try again.');
            }
        } catch (error) {
            console.error('Error booking session:', error);
            alert(error.response?.data?.error?.message || 'Failed to book session. Please try again later.');
        }
    };

    if (bookingMode && selectedMentor) {
        return (
            <div className="doubts-page-wrapper slide-up">
                <button className="back-btn" onClick={() => setBookingMode(false)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Mentors
                </button>

                <div className="booking-container slide-up">
                    <div className="booking-header">
                        <img src={selectedMentor.image} alt={selectedMentor.name} className={`booking-avatar ${selectedMentor.isAI ? 'ai-avatar' : ''}`} />
                        <div className="booking-header-info">
                            <h2>Book Session with {selectedMentor.name}</h2>
                            <p>{selectedMentor.role}</p>
                        </div>
                    </div>

                    <form className="booking-form" onSubmit={handleConfirmBooking}>
                        <div className="form-group">
                            <label><Calendar size={18} /> Select Date</label>
                            <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label><Clock size={18} /> Select Time</label>
                            <input type="time" required value={time} onChange={e => setTime(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label><MessageSquare size={18} /> What do you need help with?</label>
                            <textarea placeholder="Briefly describe your doubt or topic..." required rows="4" value={topic} onChange={e => setTopic(e.target.value)}></textarea>
                        </div>

                        <button type="submit" className="confirm-booking-btn">Confirm Booking</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="doubts-page-wrapper slide-up">
            <div className="page-header">
                <div className="header-info">
                    <h1 className="premium-title">Doubts & Support</h1>
                    <p className="premium-subtitle">Connect with our expert mentors or get instant help from our 24/7 AI Assistant.</p>
                </div>
            </div>

            <div className="mentors-grid">
                {loading ? (
                    <div className="mentors-loading">
                        <Loader2 className="spinner" size={32} color="#a855f7" />
                        <p>Finding your instructors...</p>
                    </div>
                ) : (
                    mentors.map(mentor => (
                        <div key={mentor.id} className={`mentor-card ${mentor.isAI ? 'ai-mentor-card' : ''}`}>
                            {mentor.isAI && (
                                <div className="ai-badge">
                                    <Bot size={14} /> 24/7 AI Mentor
                                </div>
                            )}

                            <div className="mentor-header">
                                <div className="mentor-avatar-container">
                                    <img src={mentor.image} alt={mentor.name} className={`mentor-avatar ${mentor.isAI ? 'ai-avatar-img' : ''}`} />
                                    {mentor.isOnline && <div className="online-indicator"></div>}
                                </div>
                                <div className="mentor-info">
                                    <h3 className="mentor-name">{mentor.name}</h3>
                                    <div className="mentor-role-row">
                                        <span className="mentor-subject">{mentor.subject}</span>
                                        <span className="mentor-divider">•</span>
                                        <span className="mentor-role">{mentor.role}</span>
                                    </div>
                                    {mentor.phone_number && (
                                        <div className="mentor-phone-chip">
                                            <svg className="phone-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {mentor.phone_number}
                                        </div>
                                    )}
                                    <div className="mentor-stats">
                                        <span className="rating"><span className="star">★</span> {mentor.rating}</span>
                                        <span className="reviews">({mentor.reviews} sessions)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mentor-expertise">
                                {mentor.expertise.map((tag, idx) => (
                                    <span key={idx} className="expertise-tag">{tag}</span>
                                ))}
                            </div>

                            <div className="mentor-availability">
                                <Clock size={16} /> <span>{mentor.availability}</span>
                            </div>

                            <div className="mentor-actions">
                                {mentor.isAI ? (
                                    <>
                                        <button className="action-btn chat-btn">
                                            <MessageSquare size={18} /> Chat Now
                                        </button>
                                        <button className="action-btn primary-action-btn" onClick={() => alert("Initiating Live Audio connection with MentIQ AI...")}>
                                            <Video size={18} /> Start Live Audio Call
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="action-btn chat-btn">
                                            <MessageSquare size={18} /> Drop a Message
                                        </button>
                                        <button className="action-btn primary-action-btn" onClick={() => handleBookSession(mentor)}>
                                            <Calendar size={18} /> Book 1:1 Session
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
