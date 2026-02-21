import React from 'react';
import './NotificationsPage.css';

export function QuizResultPage({ result, onBack, onRetake }) {
    const score = result.percentage || 0;
    const isPassed = result.passed;

    return (
        <div className="premium-page-wrapper slide-up">
            <div className="result-container" style={{ textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
                <div className="icon-celebration" style={{ marginBottom: '2rem' }}>
                    {isPassed ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div style={{ position: 'absolute', inset: '-20px', background: 'rgba(16, 185, 129, 0.2)', filter: 'blur(30px)', borderRadius: '50%' }}></div>
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15l-2 5l9-9l-15 -4l3 3.5l-1 3.5l11 1"></path><path d="M22 11c0 -5 -4 -9 -9 -9s-9 4 -9 9s4 9 9 9s9 -4 9 -9z"></path></svg>
                        </div>
                    ) : (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <div style={{ position: 'absolute', inset: '-20px', background: 'rgba(239, 68, 68, 0.2)', filter: 'blur(30px)', borderRadius: '50%' }}></div>
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        </div>
                    )}
                </div>

                <h1 style={{ color: 'white', fontSize: '3rem', marginBottom: '0.5rem', fontWeight: '800' }}>
                    {isPassed ? 'Mastery Achieved!' : 'Growth Opportunity'}
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '3rem' }}>
                    {isPassed
                        ? "Excellent performance! You've successfully demonstrated your understanding of the material."
                        : "Almost there! A bit more review and you'll definitely conquer this challenge."}
                </p>

                <div className="score-hub" style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '2rem',
                    borderRadius: '32px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '3rem',
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center'
                }}>
                    <div className="score-item">
                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>Final Grade</span>
                        <span style={{ display: 'block', color: isPassed ? '#10b981' : '#ef4444', fontSize: '3rem', fontWeight: '900' }}>{Math.round(score)}%</span>
                    </div>
                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div className="score-item">
                        <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>Correct Answers</span>
                        <span style={{ display: 'block', color: 'white', fontSize: '2.5rem', fontWeight: '800' }}>{result.score}/{result.total_questions}</span>
                    </div>
                </div>

                <div className="action-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isPassed && (
                        <button className="cyber-submit-btn" style={{ width: '100%', padding: '1.2rem' }} onClick={onRetake}>RETAKE ASSESSMENT</button>
                    )}
                    <button
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                        onClick={onBack}
                    >
                        RETURN TO COURSE
                    </button>
                </div>
            </div>
        </div>
    );
}
