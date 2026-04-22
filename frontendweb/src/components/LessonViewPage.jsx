import React from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import './LessonViewPage.css';

export function LessonViewPage({ lesson, onBack, onNext, onPrev, hasNext, hasPrev }) {
    if (!lesson) return null;

    return (
        <div className="lesson-viewer-wrapper slide-up">
            <div className="lesson-viewer-header">
                <button className="back-btn-minimal" onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>BACK TO CURRICULUM</span>
                </button>
                <div className="lesson-meta-pill">
                    <BookOpen size={14} />
                    <span>MODULE {lesson.sequence_number}</span>
                    <span className="meta-divider">|</span>
                    <Clock size={14} />
                    <span>{lesson.duration || 20} MIN</span>
                </div>
            </div>

            <div className="lesson-content-container">
                <div className="lesson-card-premium">
                    <h1 className="lesson-main-title">{lesson.title}</h1>
                    <div className="lesson-rich-content">
                        {lesson.content.split('\n').map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                    
                    <div className="lesson-navigation-footer">
                        <button 
                            className={`nav-btn prev ${!hasPrev ? 'disabled' : ''}`} 
                            onClick={onPrev}
                            disabled={!hasPrev}
                        >
                            <ChevronLeft size={20} />
                            <span>PREVIOUS MODULE</span>
                        </button>
                        
                        <div className="lesson-progress-indicator">
                            <span className="current-step">{lesson.sequence_number}</span>
                            <span className="step-divider">/</span>
                            <span className="total-steps">5</span>
                        </div>

                        <button 
                            className={`nav-btn next ${!hasNext ? 'disabled' : ''}`} 
                            onClick={onNext}
                            disabled={!hasNext}
                        >
                            <span>NEXT MODULE</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="lesson-viewer-glow"></div>
        </div>
    );
}
