import React, { useState, useEffect } from 'react';
import './DoubtsPage.css';
import { Calendar, MessageSquare, Video, Clock, Bot, User, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import api from '../api.js';

export function DoubtsPage({ onBack, userRole }) {
    const isTeacher = userRole === 'teacher';
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [bookingMode, setBookingMode] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [topic, setTopic] = useState('');
    const [mentors, setMentors] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Generate upcoming 7 days for the premium date selector
    const getUpcomingDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(today);
            nextDay.setDate(today.getDate() + i);
            days.push({
                fullDate: nextDay.toISOString().split('T')[0],
                dayName: nextDay.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: nextDay.getDate(),
                isToday: i === 0
            });
        }
        return days;
    };

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:30 AM",
        "02:00 PM", "03:30 PM", "05:00 PM", "07:00 PM"
    ];

    const upcomingDays = getUpcomingDays();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (isTeacher) {
                    const response = await api.get('teachers/bookings/');
                    if (response.data && response.data.success) {
                        setBookings(response.data.data);
                    }
                } else {
                    const response = await api.get('students/my-teachers/');
                    if (response.data && response.data.success) {
                        const mappedTeachers = response.data.data.map(t => ({
                            id: t.id,
                            name: t.name,
                            role: t.role === 'teacher' ? 'Course Instructor' : t.role,
                            expertise: t.expertise,
                            availability: t.availability,
                            isOnline: t.is_ai ? true : Math.random() > 0.5,
                            isAI: t.is_ai || false,
                            image: t.image,
                            rating: t.rating,
                            reviews: t.reviews,
                            phone_number: t.phone_number,
                            subject: t.subject
                        }));
                        setMentors(mappedTeachers);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isTeacher]);

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
                            <div className="premium-date-selector">
                                {upcomingDays.map((d, idx) => (
                                    <div
                                        key={idx}
                                        className={`date-tile ${date === d.fullDate ? 'selected' : ''}`}
                                        onClick={() => setDate(d.fullDate)}
                                    >
                                        <span className="date-tile-name">{d.isToday ? 'Today' : d.dayName}</span>
                                        <span className="date-tile-number">{d.dayNumber}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label><Clock size={18} /> Select Time Slot</label>
                            <div className="premium-time-selector">
                                {timeSlots.map((t, idx) => (
                                    <div
                                        key={idx}
                                        className={`time-tile ${time === t ? 'selected' : ''}`}
                                        onClick={() => setTime(t)}
                                    >
                                        {t}
                                    </div>
                                ))}
                            </div>
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
                    <h1 className="premium-title">{isTeacher ? "Student Doubt Requests" : "Doubts & Support"}</h1>
                    <p className="premium-subtitle">
                        {isTeacher
                            ? "Review and manage your upcoming 1:1 sessions with students who need guidance."
                            : "Connect with our expert mentors or get instant help from our 24/7 AI Assistant."}
                    </p>
                </div>
            </div>

            <div className="mentors-grid">
                {loading ? (
                    <div className="mentors-loading">
                        <Loader2 className="spinner" size={32} color="#a855f7" />
                        <p>{isTeacher ? "Loading your schedule..." : "Finding your instructors..."}</p>
                    </div>
                ) : isTeacher ? (
                    bookings.length === 0 ? (
                        <div className="mentors-loading">
                            <CheckCircle2 size={48} color="#22c55e" />
                            <p>You're all caught up! No pending doubt requests.</p>
                        </div>
                    ) : (
                        bookings.map(booking => (
                            <div key={booking.id} className="mentor-card booking-card">
                                <div className="mentor-header">
                                    <div className="mentor-avatar-container">
                                        <div className="mentor-avatar-initials">
                                            {booking.student_name ? booking.student_name[0].toUpperCase() : 'S'}
                                        </div>
                                    </div>
                                    <div className="mentor-info">
                                        <h3 className="mentor-name">{booking.student_name}</h3>
                                        <div className="mentor-role-row">
                                            <span className="mentor-role">Student</span>
                                            <span className="mentor-divider">•</span>
                                            <span className="status-badge" style={{
                                                background: booking.status === 'confirmed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                                color: booking.status === 'confirmed' ? '#22c55e' : '#a855f7',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem'
                                            }}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="mentor-phone-chip">
                                            <MessageSquare size={14} className="phone-icon" />
                                            {booking.student_email}
                                        </div>
                                    </div>
                                </div>

                                <div className="mentor-expertise" style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <strong>Topic:</strong> {booking.topic}
                                </div>

                                <div className="mentor-availability">
                                    <Calendar size={16} /> <span>{booking.date} at {booking.time}</span>
                                </div>

                                <div className="mentor-actions">
                                    {booking.status === 'pending' ? (
                                        <button className="action-btn primary-action-btn" onClick={() => alert("Session confirmed. Notification sent to student.")}>
                                            <CheckCircle2 size={18} /> Confirm Session
                                        </button>
                                    ) : (
                                        <button className="action-btn primary-action-btn" onClick={() => window.open('https://meet.google.com/new', '_blank')}>
                                            <Video size={18} /> Start Meeting
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )
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
