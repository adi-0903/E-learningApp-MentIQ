import React, { useState, useEffect } from 'react';
import { Users, BrainCircuit, Trophy } from 'lucide-react';
import './LoginPage.css';
import api from '../api.js';

const ONBOARDING_STEPS = [
    {
        id: 1,
        title: 'Step into the Future of Learning',
        subtitle: 'Welcome to MentIQ. Experience a revolutionary way to learn and grow. Your personalized journey to excellence starts here.',
        features: [
            {
                icon: <Users size={20} />,
                title: 'Community Driven',
                desc: 'Join thousands of learners worldwide.'
            },
            {
                icon: <BrainCircuit size={20} />,
                title: 'AI Companion',
                desc: 'Get smart recommendations.'
            }
        ],
        themeColor: 'teal',
        graphicMain: '/Logo.png',
        isPhoto: false,
        floatLabel: 'Welcome Aboard',
        floatColor: '#5eead4'
    },
    {
        id: 2,
        title: 'Expert Mentorship',
        subtitle: 'Connect with world-class educators and mentors who are dedicated to your success and growth.',
        features: [
            {
                icon: <Users size={20} />,
                title: 'Live 1-on-1 Sessions',
                desc: 'Book time with top industry experts.'
            },
            {
                icon: <Users size={20} />,
                title: 'Direct Messaging',
                desc: 'Get unblocked quickly with real-time chat.'
            }
        ],
        themeColor: 'indigo',
        graphicMain: '/mentor_graphic.png',
        isPhoto: true,
        floatLabel: 'Top Mentors',
        floatColor: '#a5b4fc'
    },
    {
        id: 3,
        title: 'AI-Powered Learning',
        subtitle: 'Harness state-of-the-art AI to personalize your study path and accelerate learning beyond traditional methods.',
        features: [
            {
                icon: <BrainCircuit size={20} />,
                title: 'Smart Quizzes',
                desc: 'Dynamically adjusted difficulty based on your skill.'
            },
            {
                icon: <BrainCircuit size={20} />,
                title: 'Instant Feedback',
                desc: 'Code evaluation and essay grading in seconds.'
            }
        ],
        themeColor: 'violet',
        graphicMain: '/ai_graphic.png',
        isPhoto: true,
        floatLabel: 'AI Activated',
        floatColor: '#d8b4fe'
    },
    {
        id: 4,
        title: 'Achieve Your Goals',
        subtitle: 'Track your progress, earn verified certificates, and bloom into the best version of yourself.',
        features: [
            {
                icon: <Trophy size={20} />,
                title: 'Shareable Certificates',
                desc: 'Add them directly to your LinkedIn profile.'
            },
            {
                icon: <Trophy size={20} />,
                title: 'Progress Tracking',
                desc: 'Visualize your daily streaks and knowledge growth.'
            }
        ],
        themeColor: 'crimson',
        graphicMain: '/goals_graphic.png',
        isPhoto: true,
        floatLabel: 'Goal Achieved',
        floatColor: '#fda4af'
    }
];

export function LoginPage({ onBack }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [msg, setMsg] = useState('');
    const [activeSlide, setActiveSlide] = useState(0);
    const [forgotStep, setForgotStep] = useState(null); // 'identifier' | 'otp'
    const [forgotId, setForgotId] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPass, setNewPass] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % ONBOARDING_STEPS.length);
        }, 25000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setMsg('');
        try {
            const response = await api.post('auth/login/', { email, password });
            if (response.data && response.data.user) {
                const userData = response.data;
                localStorage.setItem('accessToken', userData.access);
                localStorage.setItem('refreshToken', userData.refresh);
                onBack(userData.user);
            } else {
                onBack({ role: 'student', name: 'Student' });
            }
        } catch (error) {
            if (error.response && error.response.data) {
                const data = error.response.data;
                if (data.detail) setErrorMsg(data.detail);
                else if (data.message) setErrorMsg(data.message);
                else if (data.non_field_errors) setErrorMsg(data.non_field_errors[0]);
                else setErrorMsg('Invalid email or password. Please try again.');
            } else {
                setErrorMsg('Network error. Is the backend running?');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setMsg('');
        try {
            const res = await api.post('auth/forgot-password/request/', { identifier: forgotId });
            if (res.data && res.data.success) {
                setMsg(res.data.message);
                setForgotStep('otp');
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setMsg('');
        try {
            const res = await api.post('auth/forgot-password/verify/', {
                identifier: forgotId,
                otp_code: otpCode,
                new_password: newPass
            });
            if (res.data && res.data.success) {
                setMsg(res.data.message);
                setTimeout(() => {
                    setForgotStep(null);
                    setMsg('');
                }, 3000);
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const step = ONBOARDING_STEPS[activeSlide];

    return (
        <div className="login-page-wrapper">
            <div className="animated-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="login-glass-container slide-up">
                {/* Left Panel — Full Onboarding Content */}
                <div className={`login-left-panel login-theme-${step.themeColor}`}>
                    <div className="login-onboard-content" key={activeSlide}>
                        <div className="login-ob-brand">
                            <img src="/Logo.png" alt="MentiQ" className="login-ob-logo" onError={(e) => e.target.style.display = 'none'} />
                            <span className="login-ob-brand-name">MentIQ</span>
                        </div>

                        <div className="login-ob-step-indicator">
                            Step {activeSlide + 1} of {ONBOARDING_STEPS.length}
                        </div>

                        <h1 className="login-ob-title">{step.title}</h1>
                        <p className="login-ob-subtitle">{step.subtitle}</p>

                        <div className="login-ob-features">
                            {step.features.map((feat, idx) => (
                                <div className="login-ob-feature-row" key={idx}>
                                    <div className={`login-ob-feat-icon ${step.themeColor}`}>
                                        {feat.icon}
                                    </div>
                                    <div className="login-ob-feat-text">
                                        <h3>{feat.title}</h3>
                                        <p>{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="login-dots">
                            {ONBOARDING_STEPS.map((_, i) => (
                                <button
                                    key={i}
                                    className={`login-dot ${i === activeSlide ? 'active' : ''}`}
                                    onClick={() => setActiveSlide(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="login-right-panel">
                    {!forgotStep ? (
                        <>
                            <div className="login-header-new">
                                <h2>Welcome Back</h2>
                                <p>Sign in to continue your journey</p>
                            </div>

                            <form className="login-form-new" onSubmit={handleSubmit}>
                                {errorMsg && <div className="login-error-msg">{errorMsg}</div>}
                                {msg && <div className="login-success-msg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '1rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem' }}>{msg}</div>}

                                <div className="input-wrapper">
                                    <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                                    <input type="text" placeholder="Email address or ID" required value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>

                                <div className="input-wrapper">
                                    <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>

                                <div className="form-actions-row">
                                    <label className="custom-checkbox">
                                        <input type="checkbox" />
                                        <span className="checkmark"></span>
                                        <span className="cb-text">Remember me</span>
                                    </label>
                                    <a href="#" className="forgot-link" onClick={() => setForgotStep('identifier')}>Forgot password?</a>
                                </div>

                                <button type="submit" className="premium-submit-btn" disabled={loading}>
                                    <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </button>
                            </form>
                        </>
                    ) : forgotStep === 'identifier' ? (
                        <>
                            <div className="login-header-new">
                                <h2>Reset Password</h2>
                                <p>Enter your email, phone, or ID to receive a 4-digit code.</p>
                            </div>

                            <form className="login-form-new" onSubmit={handleForgotRequest}>
                                {errorMsg && <div className="login-error-msg">{errorMsg}</div>}
                                <div className="input-wrapper">
                                    <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                                    <input type="text" placeholder="Email, Phone, or ID" required value={forgotId} onChange={(e) => setForgotId(e.target.value)} />
                                </div>

                                <button type="submit" className="premium-submit-btn" disabled={loading}>
                                    <span>{loading ? 'Sending...' : 'Send Code'}</span>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </button>

                                <div className="login-footer-new">
                                    <p><a href="#" onClick={() => setForgotStep(null)}>Back to Login</a></p>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="login-header-new">
                                <h2>Verify Code</h2>
                                <p>Enter the 4-digit code sent to you and choose a new password.</p>
                            </div>

                            <form className="login-form-new" onSubmit={handleForgotVerify}>
                                {errorMsg && <div className="login-error-msg">{errorMsg}</div>}
                                {msg && <div className="login-success-msg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '1rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem' }}>{msg}</div>}

                                <div className="input-wrapper">
                                    <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <input type="text" placeholder="4-digit Code" required maxLength={4} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                                </div>

                                <div className="input-wrapper">
                                    <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    <input type="password" placeholder="New Password" required value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                                </div>

                                <button type="submit" className="premium-submit-btn" disabled={loading}>
                                    <span>{loading ? 'Verifying...' : 'Reset Password'}</span>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </button>

                                <div className="login-footer-new">
                                    <p><a href="#" onClick={() => setForgotStep('identifier')}>Change Identifier</a></p>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
