import React, { useState, useRef, useEffect } from 'react';
import './AIAssistantCard.css';
import api from '../api';

export function AIAssistantCard() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRefSmall = useRef(null);
    const messagesEndRefExpanded = useRef(null);

    const scrollToBottom = () => {
        messagesEndRefSmall.current?.scrollIntoView({ behavior: 'smooth' });
        messagesEndRefExpanded.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, isExpanded]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await api.post('ai/ask/', { query: userMsg.text });
            if (res.data && res.data.answer) {
                setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: 'Error: Could not get response.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to the server.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const handleExpandClick = () => {
        setIsExpanding(true);
        setTimeout(() => {
            setIsExpanding(false);
            setIsExpanded(true);
        }, 600);
    };

    const handleCloseModal = () => {
        setIsExpanded(false);
    };
    const handleTipClick = (tip) => {
        setInputValue(tip);
    };

    const renderChatContent = (endRef, isModal) => (
        <div className={`ai-chat-inner ${isModal ? 'ai-modal-inner' : ''}`}>
            <div className="ai-chat-area">
                {messages.length === 0 ? (
                    <div className="ai-orb-container">
                        <img src="/Qbit.png" alt="QBit AI" className="ai-logo-main" />
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.role}`}>
                                <div className="message-bubble">{msg.text}</div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-message ai">
                                <div className="message-bubble typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                )}
            </div>

            {messages.length === 0 && (
                <div className="tips-container">
                    <button className="tip-btn" onClick={() => handleTipClick('Explain AI Basics')}>Basics</button>
                    <button className="tip-btn" onClick={() => handleTipClick('Generate a quiz')}>Quiz</button>
                    <button className="tip-btn" onClick={() => handleTipClick('Make a study plan')}>Plan</button>
                </div>
            )}

            <div className="chat-input-wrapper">
                <div className="chat-input">
                    <svg className="chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    <input
                        type="text"
                        placeholder="Message QBit..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="send-btn" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Base Dashboard Card */}
            <div className={`card ai-assistant-card slide-up ${isExpanding ? 'ai-charging' : ''}`} style={{ animationDelay: '0.7s' }}>
                <div className="card-header">
                    <h2 className="card-title">QBit AI Tutor</h2>
                    <svg onClick={handleExpandClick} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="card-action" style={{ width: '16px', height: '16px', cursor: 'pointer' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                    </svg>
                </div>
                {renderChatContent(messagesEndRefSmall, false)}
            </div>

            {/* Fullscreen Overlay Animation Modal */}
            {isExpanded && (
                <div className="ai-modal-overlay">
                    <div className="ai-modal-backdrop" onClick={handleCloseModal}></div>
                    <div className="ai-modal-content expand-scale-up">
                        <div className="ai-modal-header">
                            <div className="modal-title-area">
                                <img src="/Qbit.png" alt="QBit AI" className="ai-logo-mini" />
                                <h2>QBit AI Tutor</h2>
                            </div>
                            <button className="close-modal-btn" onClick={handleCloseModal}>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        {renderChatContent(messagesEndRefExpanded, true)}
                    </div>
                </div>
            )}
        </>
    );
}
