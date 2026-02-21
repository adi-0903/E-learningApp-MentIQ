import React, { useState, useEffect, useRef } from 'react';
import './NotificationsPage.css'; // Reusing premium layouts
import api from '../api';

export function QuizTakingPage({ quizId, onBack, onComplete }) {
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                const res = await api.get(`quizzes/${quizId}/`);

                if (res.data && res.data.success) {
                    const quizData = res.data.data;
                    setQuiz(quizData);
                    setTimeLeft((quizData.duration || 30) * 60);

                    // The questions are nested inside the quiz detail response
                    const questionList = quizData.questions || [];
                    setQuestions(questionList);
                }

            } catch (err) {
                console.error("Error loading quiz:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizData();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [quizId]);

    useEffect(() => {
        if (!isLoading && timeLeft > 0 && !isSubmitting) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isLoading, timeLeft > 0, isSubmitting]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOptionSelect = (questionId, optionValue) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionValue }));
    };

    const handleSubmit = async (isAuto = false) => {
        if (isSubmitting) return;

        const unanswered = questions.length - Object.keys(answers).length;
        if (!isAuto && unanswered > 0) {
            if (!window.confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const res = await api.post(`quizzes/${quizId}/submit/`, { answers });
            if (res.data && res.data.success) {
                onComplete(res.data.data);
            }
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Failed to submit quiz. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="premium-page-wrapper">
                <div className="loading-state">
                    <div className="premium-spinner"></div>
                    <p>Building your assessment environment...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="premium-page-wrapper">
                <div className="empty-state">
                    <h3>No questions found for this quiz.</h3>
                    <button className="cyber-submit-btn" onClick={onBack}>GO BACK</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="premium-page-wrapper slide-up">
            <div className="quiz-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)',
                padding: '1.5rem 2rem',
                borderRadius: '24px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
                <div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>{quiz?.title}</h2>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Question {currentIndex + 1} of {questions.length}</span>
                </div>
                <div className="timer-badge" style={{
                    background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)',
                    color: timeLeft < 60 ? '#ef4444' : 'white',
                    padding: '10px 20px',
                    borderRadius: '16px',
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    border: timeLeft < 60 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    fontFamily: 'monospace'
                }}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="quiz-progress-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '3rem', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#6366f1', transition: 'width 0.3s ease' }}></div>
            </div>

            <div className="quiz-content-area" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card question-card" style={{ padding: '2.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '32px' }}>
                    <h3 style={{ color: 'white', fontSize: '1.6rem', lineHeight: '1.4', fontWeight: '500' }}>
                        {currentQuestion.question_text || currentQuestion.questionText}
                    </h3>
                </div>

                <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {['a', 'b', 'c', 'd'].map(opt => {
                        const optText = currentQuestion[`option_${opt}`];
                        if (!optText) return null;

                        const label = optText;

                        const isSelected = answers[currentQuestion.id] === opt;

                        return (
                            <div
                                key={opt}
                                onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                                style={{
                                    padding: '1.5rem',
                                    background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                                    borderRadius: '20px',
                                    border: isSelected ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: isSelected ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {opt}
                                </div>
                                <span style={{ color: isSelected ? 'white' : '#94a3b8', fontSize: '1.1rem' }}>{label}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="quiz-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', paddingBottom: '4rem' }}>
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', opacity: currentIndex === 0 ? 0.3 : 1 }}
                    >
                        PREVIOUS QUESTION
                    </button>

                    {currentIndex === questions.length - 1 ? (
                        <button
                            className="cyber-submit-btn"
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'TRANSMITTING...' : 'SUBMIT ASSESSMENT'}
                        </button>
                    ) : (
                        <button
                            className="cyber-submit-btn"
                            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        >
                            NEXT QUESTION
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
