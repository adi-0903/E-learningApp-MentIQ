import React, { useState } from 'react';
import { Users, BrainCircuit, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import './OnboardingScreen.css';

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
        isPhoto: false
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
        isPhoto: true
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
        isPhoto: true
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
        isPhoto: true
    }
];

export function OnboardingScreen({ onFinish }) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onFinish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const step = ONBOARDING_STEPS[currentStep];

    return (
        <div className={`onboarding-page-wrapper theme-${step.themeColor}`}>
            {/* Subtle Background Elements */}
            <div className="onboarding-bg-shape shape-1"></div>
            <div className="onboarding-bg-shape shape-2"></div>

            <div className="onboarding-glass-container slide-up">
                {/* Left Panel: Content & Features */}
                <div className="onboarding-left-panel">
                    <div className="onboarding-brand">
                        <img src="/Logo.png" alt="MentIQ Logo" className="onboarding-logo-small" onError={(e) => e.target.style.display = 'none'} />
                        <span className="brand-name">MentIQ</span>
                    </div>

                    <div className="onboarding-progress-indicator">
                        Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                    </div>

                    <h1 className="onboarding-title">{step.title}</h1>
                    <p className="onboarding-subtitle">{step.subtitle}</p>

                    <div className="onboarding-features-list">
                        {step.features.map((feat, idx) => (
                            <div className="feature-row" key={idx}>
                                <div className={`feature-icon-wrapper ${step.themeColor}`}>
                                    {feat.icon}
                                </div>
                                <div className="feature-text">
                                    <h3>{feat.title}</h3>
                                    <p>{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="onboarding-nav-buttons">
                        <button
                            className="onboarding-secondary-btn"
                            onClick={handlePrev}
                            style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
                        >
                            <ArrowLeft size={20} />
                            <span>Back</span>
                        </button>

                        <button className="onboarding-primary-btn" onClick={handleNext}>
                            <span>{currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next Step'}</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Right Panel: Graphic Presentation */}
                <div className={`onboarding-right-panel bg-${step.themeColor}`}>
                    <div className="graphic-showcase">
                        <div className={`graphic-backdrop glow-${step.themeColor}`}></div>
                        <img
                            src={step.graphicMain}
                            alt="MentIQ Master Graphic"
                            className={`graphic-main-element floating-graphic key-image ${step.isPhoto ? 'photo-style' : ''}`}
                            onError={(e) => {
                                // Make sure Logo.png is not treated as missing if they don't have internet
                                if (e.target.src !== window.location.origin + '/Logo.png') {
                                    e.target.src = '/Logo.png';
                                    e.target.classList.remove('photo-style');
                                } else {
                                    e.target.style.display = 'none';
                                }
                            }}
                        />

                        {/* Decorative floating cards customized per step */}
                        <div className="floating-card flex-up float-anim-1">
                            {currentStep === 0 && <><Users size={20} color="#5eead4" /><span>Welcome Aboard</span></>}
                            {currentStep === 1 && <><Users size={20} color="#a5b4fc" /><span>Top Mentors</span></>}
                            {currentStep === 2 && <><BrainCircuit size={20} color="#d8b4fe" /><span>AI Activated</span></>}
                            {currentStep === 3 && <><Trophy size={20} color="#fda4af" /><span>Goal Achieved</span></>}
                        </div>

                        <div className="floating-card flex-down float-anim-2">
                            <BrainCircuit size={20} color="#34d399" />
                            <span>MentIQ Engine</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
