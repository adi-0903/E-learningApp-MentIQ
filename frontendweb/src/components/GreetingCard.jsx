import React from 'react';
import './GreetingCard.css';

export function GreetingCard({ userData }) {
    // If the name exists, grab just the first word (first name) for a casual greeting
    const firstName = userData?.name ? userData.name.split(' ')[0] : 'Student';

    // Simple deterministic hash based on name to keep avatar consistent per user
    const isFemale = firstName.length % 2 !== 0;
    const portraitSrc = isFemale ? "/premium_student_portrait_female.png" : "/premium_student_portrait.png";

    return (
        <div className="card greeting-card slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="greeting-text">
                <h2>Hi, {firstName}!</h2>
                <p>Ready to make progress today?</p>
            </div>
            <img
                src={portraitSrc}
                alt="Student Avatar"
                className="greeting-avatar premium-character-mask"
            />
        </div>
    );
}
