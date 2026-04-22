import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import './SuccessModal.css';

export function SuccessModal({ isOpen, onClose, title, message, buttonText = "CONTINUE" }) {
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setShouldRender(true);
    }, [isOpen]);

    const handleAnimationEnd = () => {
        if (!isOpen) setShouldRender(false);
    };

    if (!shouldRender) return null;

    return (
        <div 
            className={`success-modal-overlay ${isOpen ? 'fade-in' : 'fade-out'}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className={`success-modal-card ${isOpen ? 'scale-in' : 'scale-out'}`}>
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
                
                <div className="success-icon-container">
                    <div className="icon-pulse-ring"></div>
                    <CheckCircle className="success-icon-svg" size={64} />
                </div>

                <h2 className="success-title">{title}</h2>
                <p className="success-message">{message}</p>

                <button className="success-action-btn" onClick={onClose}>
                    {buttonText}
                </button>
                
                <div className="success-modal-glow"></div>
            </div>
        </div>
    );
}
