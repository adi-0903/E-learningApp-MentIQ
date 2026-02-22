import React, { useState, useRef, useEffect } from 'react';
import {
    MessageSquare,
    Layers,
    Calendar,
    Send,
    Mic,
    Maximize2,
    X,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Sparkles,
    BookOpen,
    Download,
    Loader2
} from 'lucide-react';
import './AIAssistantCard.css';
import api from '../api';

export function AIAssistantCard({ userRole }) {
    const isTeacher = userRole === 'teacher';
    const [activeTab, setActiveTab] = useState('chat');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Flashcards state
    const [flashcardTopic, setFlashcardTopic] = useState('');
    const [flashcards, setFlashcards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Planner state
    const [examDate, setExamDate] = useState('');
    const [studyPlan, setStudyPlan] = useState('');
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');

    const messagesEndRefSmall = useRef(null);
    const messagesEndRefExpanded = useRef(null);

    const scrollToBottom = () => {
        messagesEndRefSmall.current?.scrollIntoView({ behavior: 'smooth' });
        messagesEndRefExpanded.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, isExpanded]);

    useEffect(() => {
        if (isExpanded && !isTeacher) {
            fetchEnrolledCourses();
        }
    }, [isExpanded, isTeacher]);

    const fetchEnrolledCourses = async () => {
        try {
            const res = await api.get('students/courses/');
            if (res.data && res.data.success) {
                setEnrolledCourses(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch courses:", err);
        }
    };

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

    const handleGenerateFlashcards = async () => {
        if (!flashcardTopic.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.post('ai/generate-flashcards/', { topic: flashcardTopic });
            if (res.data && Array.isArray(res.data)) {
                setFlashcards(res.data);
                setCurrentCardIndex(0);
                setIsFlipped(false);
            }
        } catch (error) {
            console.error("Flashcard generation failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePlan = async () => {
        if (!examDate) return;
        setIsLoading(true);
        try {
            const res = await api.post('ai/generate-plan/', {
                exam_date: examDate,
                hours_per_day: 2,
                subject: selectedCourse
            });
            if (res.data && res.data.plan) {
                setStudyPlan(res.data.plan);
            }
        } catch (error) {
            console.error("Plan generation failed:", error);
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
                        {!isModal && <p className="ai-welcome-text">Ask me anything!</p>}
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
                    <button className="tip-btn" onClick={() => handleTipClick(isTeacher ? 'Create a lesson plan' : 'Explain AI Basics')}>
                        {isTeacher ? 'Lesson Plan' : 'Basics'}
                    </button>
                    <button className="tip-btn" onClick={() => handleTipClick(isTeacher ? 'Generate quiz ideas' : 'Generate a quiz')}>
                        {isTeacher ? 'Quiz Ideas' : 'Quiz'}
                    </button>
                    <button className="tip-btn" onClick={() => handleTipClick(isTeacher ? 'Draft student email' : 'Make a study plan')}>
                        {isTeacher ? 'Draft Email' : 'Plan'}
                    </button>
                </div>
            )}

            <div className="chat-input-wrapper">
                <div className="chat-input">
                    <Mic className="chat-icon" size={20} />
                    <input
                        type="text"
                        placeholder={isTeacher ? "Message QBit T.A..." : "Message QBit..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="send-btn" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    // Calendar logic for premium planner
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateCalendarDays = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Padding for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
            const isSelected = examDate === dateStr;

            days.push(
                <div
                    key={d}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setExamDate(dateStr)}
                >
                    {d}
                </div>
            );
        }
        return days;
    };

    const changeMonth = (offset) => {
        const newMonth = new Date(calendarMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        setCalendarMonth(newMonth);
    };

    const renderFlashcards = () => (
        <div className="ai-flashcards-tab">
            {!flashcards.length ? (
                <div className="flashcard-generator">
                    <div className="tab-hero-icon">
                        <Layers size={64} />
                    </div>
                    <h3>Create Neural Flashcards</h3>
                    <p>Enter a topic and I'll build a custom study deck for you with adaptive logic.</p>
                    <div className="flashcard-input-row">
                        <div className="fancy-input-wrapper">
                            <Sparkles size={18} className="input-sparkle" />
                            <input
                                type="text"
                                placeholder="e.g., Photosynthesis, React Hooks..."
                                value={flashcardTopic}
                                onChange={(e) => setFlashcardTopic(e.target.value)}
                            />
                        </div>
                        <button className="premium-gen-btn" onClick={handleGenerateFlashcards} disabled={isLoading}>
                            {isLoading ? <Loader2 className="spinner" size={20} /> : "Generate"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flashcard-viewer">
                    <div className="flashcard-stats">
                        <div className="progress-lbl">Neural Deck Progress</div>
                        <div className="progress-val">{currentCardIndex + 1} / {flashcards.length}</div>
                        <button className="reset-btn" onClick={() => setFlashcards([])} title="Reset Deck"><RotateCcw size={16} /></button>
                    </div>

                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}></div>
                    </div>

                    <div className="card-container">
                        <div className={`flashcard-item ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                            <div className="flashcard-front">
                                <div className="card-lbl-row">
                                    <span className="card-lbl">QUESTION</span>
                                    <Sparkles size={16} />
                                </div>
                                <div className="card-txt">{flashcards[currentCardIndex].front}</div>
                                <div className="card-hint">
                                    <RotateCcw size={12} /> Tap to reveal answer
                                </div>
                            </div>
                            <div className="flashcard-back">
                                <div className="card-lbl-row">
                                    <span className="card-lbl">ANSWER</span>
                                    <BookOpen size={16} />
                                </div>
                                <div className="card-txt">{flashcards[currentCardIndex].back}</div>
                                <div className="card-hint">
                                    <RotateCcw size={12} /> Tap to flip back
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flashcard-controls">
                        <button
                            className="nav-btn prev"
                            disabled={currentCardIndex === 0}
                            onClick={() => { setCurrentCardIndex(c => c - 1); setIsFlipped(false); }}
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <div className="flip-instruction">Tap card to flip</div>
                        <button
                            className="nav-btn next"
                            disabled={currentCardIndex === flashcards.length - 1}
                            onClick={() => { setCurrentCardIndex(c => c + 1); setIsFlipped(false); }}
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPlanner = () => (
        <div className="ai-planner-tab">
            {!studyPlan ? (
                <div className="planner-generator">
                    <div className="tab-hero-icon">
                        <Calendar size={64} />
                    </div>
                    <h3>Study Roadmap Generator</h3>
                    <p>Select your deadline and target courses to generate a personalized trajectory.</p>

                    <div className="planner-grid">
                        <div className="planner-calendar-container">
                            <div className="calendar-header">
                                <button onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                                <h4>{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</h4>
                                <button onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                            </div>
                            <div className="calendar-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="calendar-days-grid">
                                {generateCalendarDays()}
                            </div>
                        </div>

                        <div className="planner-options">
                            <div className="planner-field">
                                <label><BookOpen size={14} /> Focus Subject</label>
                                <div className="fancy-input-wrapper">
                                    <Sparkles size={18} className="input-sparkle" />
                                    <input
                                        type="text"
                                        list="enrolled-subjects"
                                        placeholder="e.g. Advanced Calculus, ML..."
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                    />
                                    <datalist id="enrolled-subjects">
                                        <option value="General (All Core Courses)" />
                                        {enrolledCourses.map(c => (
                                            <option key={c.id} value={c.title} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="selected-date-preview">
                                <div className="date-badge">
                                    <Calendar size={14} />
                                    {examDate ? `Exam: ${examDate}` : 'Select a date on the calendar'}
                                </div>
                            </div>
                            <button className="premium-gen-btn planner-cta" onClick={handleGeneratePlan} disabled={isLoading || !examDate}>
                                {isLoading ? <Loader2 className="spinner" size={20} /> : (
                                    <>
                                        <span>Generate Roadmap</span>
                                        <Sparkles size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="planner-viewer">
                    <div className="planner-actions">
                        <button className="back-btn" onClick={() => setStudyPlan('')}>
                            <ChevronLeft size={16} /> Edit Details
                        </button>
                        <div className="action-group">
                            <button className="download-btn" onClick={() => window.print()}>
                                <Download size={16} /> PDF Report
                            </button>
                            <button className="reset-btn-square" onClick={() => setStudyPlan('')}>
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="plan-markdown-container">
                        <div className="plan-content-rendered">
                            {studyPlan.split('\n').map((line, i) => {
                                if (line.startsWith('# ')) return <h1 key={i}>{line.replace('# ', '')}</h1>;
                                if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
                                if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
                                if (line.startsWith('|')) return null; // Skip raw tables in simple view
                                if (line.startsWith('- ')) return <li key={i}>{line.replace('- ', '')}</li>;
                                return <p key={i}>{line}</p>;
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className={`card ai-assistant-card slide-up ${isExpanding ? 'ai-charging' : ''}`} style={{ animationDelay: '0.7s' }}>
                <div className="card-header">
                    <h2 className="card-title">QBit AI {isTeacher ? 'T.A.' : 'Tutor'}</h2>
                    <Maximize2 onClick={handleExpandClick} className="card-action" size={16} style={{ cursor: 'pointer' }} />
                </div>
                {renderChatContent(messagesEndRefSmall, false)}
            </div>

            {isExpanded && (
                <div className="ai-modal-overlay">
                    <div className="ai-modal-backdrop" onClick={handleCloseModal}></div>
                    <div className="ai-modal-content expand-scale-up">
                        <div className="ai-modal-header">
                            <div className="modal-title-area">
                                <img src="/Qbit.png" alt="QBit AI" className="ai-logo-mini" />
                                <h2>QBit Intelligence Hub</h2>
                            </div>
                            {!isTeacher && (
                                <div className="modal-tabs">
                                    <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
                                        <MessageSquare size={16} /> Chat
                                    </button>
                                    <button className={activeTab === 'flashcards' ? 'active' : ''} onClick={() => setActiveTab('flashcards')}>
                                        <Layers size={16} /> Flashcards
                                    </button>
                                    <button className={activeTab === 'planner' ? 'active' : ''} onClick={() => setActiveTab('planner')}>
                                        <Calendar size={16} /> Planner
                                    </button>
                                </div>
                            )}
                            <button className="close-modal-btn" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="ai-modal-body">
                            {activeTab === 'chat' && renderChatContent(messagesEndRefExpanded, true)}
                            {activeTab === 'flashcards' && renderFlashcards()}
                            {activeTab === 'planner' && renderPlanner()}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
