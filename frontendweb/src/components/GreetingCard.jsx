import React from 'react';
import './GreetingCard.css';

export function GreetingCard({ userData, userRole, onEnrollCourse }) {
    const isTeacher = userRole === 'teacher';
    // If the name exists, grab just the first word (first name) for a casual greeting
    const firstName = userData?.name ? userData.name.split(' ')[0] : (isTeacher ? 'Instructor' : 'Student');

    // Simple deterministic hash based on name to keep avatar consistent per user
    const isFemale = firstName.length % 2 !== 0;
    const portraitSrc = isFemale ? "/premium_student_portrait_female.png" : "/premium_student_portrait.png";

    return (
        <div className="card greeting-card slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="greeting-text">
                <h2>Hi, {firstName}!</h2>
                <p>{isTeacher ? "Your classroom is ready for today's sessions." : "Ready to make progress today?"}</p>
                {!isTeacher && (
                    <button 
                        className="premium-enroll-btn" 
                        onClick={onEnrollCourse}
                        style={{
                            marginTop: '15px',
                            padding: '8px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <span>ENROLL COURSE</span>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </button>
                )}
            </div>
            <img
                src={portraitSrc}
                alt={isTeacher ? "Teacher Avatar" : "Student Avatar"}
                className="greeting-avatar premium-character-mask"
            />
        </div>
    );
}
