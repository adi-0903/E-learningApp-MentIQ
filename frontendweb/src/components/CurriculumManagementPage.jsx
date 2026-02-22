import React, { useState, useEffect } from 'react';
import './CurriculumManagementPage.css';
import api from '../api';

export function CurriculumManagementPage({ courseId, onBack }) {
    const [activeTab, setActiveTab] = useState('lessons');
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states for modals
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [lessonData, setLessonData] = useState({
        title: '',
        description: '',
        content: '',
        file_type: 'video',
        video_url: '',
        file_url: '',
        duration: 0,
        sequence_number: 1
    });

    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        passing_score: 70,
        time_limit: 30,
        questions: []
    });

    const [currentQuestion, setCurrentQuestion] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: '', // Will be "a" for MCQ or "a,b" for MSQ
        explanation: '',
        type: 'MCQ' // UI state only
    });

    useEffect(() => {
        fetchCurriculum();
    }, [courseId]);

    const fetchCurriculum = async () => {
        setIsLoading(true);
        try {
            const [courseRes, lessonsRes, quizzesRes] = await Promise.all([
                api.get(`courses/${courseId}/`),
                api.get(`lessons/?course=${courseId}`),
                api.get(`quizzes/?course=${courseId}`)
            ]);

            if (courseRes.data?.success) setCourse(courseRes.data.data);

            const lessonList = lessonsRes.data?.data?.results || lessonsRes.data?.results || [];
            setLessons(lessonList);

            const quizList = quizzesRes.data?.data?.results || quizzesRes.data?.results || [];
            setQuizzes(quizList);

        } catch (err) {
            console.error("Fetch error:", err);
            setError("Failed to synchronize curriculum vault.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateLesson = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...lessonData,
                course: courseId,
                sequence_number: lessons.length + 1
            };
            await api.post('lessons/', payload);
            setShowLessonModal(false);
            fetchCurriculum();
            setLessonData({
                title: '',
                description: '',
                content: '',
                file_type: 'video',
                video_url: '',
                file_url: '',
                duration: 0,
                sequence_number: 1
            });
        } catch (err) {
            alert("Failed to publish lesson. Check console.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...quizData,
                course: courseId
            };
            await api.post('quizzes/', payload);
            setShowQuizModal(false);
            fetchCurriculum();
            setQuizData({ title: '', description: '', passing_score: 70, time_limit: 30, questions: [] });
            setCurrentQuestion({
                question_text: '', option_a: '', option_b: '',
                option_c: '', option_d: '', correct_answer: '', explanation: '', type: 'MCQ'
            });
        } catch (err) {
            alert("Failed to create quiz.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLesson = async (id) => {
        if (!window.confirm("Archive this lesson from curriculum?")) return;
        try {
            await api.delete(`lessons/${id}/`);
            fetchCurriculum();
        } catch (err) {
            alert("Removal failed.");
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (!window.confirm("Remove this assessment from course?")) return;
        try {
            await api.delete(`quizzes/${id}/`);
            fetchCurriculum();
        } catch (err) {
            alert("Removal failed.");
        }
    };

    if (isLoading) return (
        <div className="curriculum-mgmt-wrapper loading">
            <div className="premium-spinner"></div>
            <p>Scanning Curriculum Vault...</p>
        </div>
    );

    const videos = lessons.filter(l => l.file_type === 'video' || l.video_url);
    const readingLessons = lessons.filter(l => l.file_type !== 'video' && !l.video_url);

    return (
        <div className="curriculum-mgmt-wrapper fade-in">
            {/* Header Section */}
            <div className="mgmt-header">
                <div className="header-top">
                    <button className="back-circle-btn" onClick={onBack}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div className="header-titles">
                        <span className="subtitle-shimmer">CURRICULUM MANAGEMENT</span>
                        <h1 className="mgmt-title">{course?.title}</h1>
                    </div>
                </div>

                <div className="mgmt-tabs">
                    <button className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`} onClick={() => setActiveTab('lessons')}>
                        📝 Lessons ({readingLessons.length})
                    </button>
                    <button className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
                        🎬 Videos ({videos.length})
                    </button>
                    <button className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
                        🏆 Quizzes ({quizzes.length})
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mgmt-content">
                <div className="section-actions">
                    <h2 className="section-title">
                        {activeTab === 'lessons' ? 'Course Lessons' : activeTab === 'videos' ? 'Video Lectures' : 'Assessments'}
                    </h2>
                    <button
                        className="premium-add-asset-btn"
                        onClick={() => activeTab === 'quizzes' ? setShowQuizModal(true) : setShowLessonModal(true)}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>
                        NEW {activeTab.toUpperCase().slice(0, -1)}
                    </button>
                </div>

                <div className="asset-grid">
                    {activeTab === 'lessons' && readingLessons.map((lesson, idx) => (
                        <div key={lesson.id} className="asset-card lesson-card">
                            <div className="asset-idx">{idx + 1}</div>
                            <div className="asset-info">
                                <h3>{lesson.title}</h3>
                                <p>{lesson.description || 'No description'}</p>
                                <span className="asset-meta">{lesson.duration || 0} mins • {lesson.file_type}</span>
                            </div>
                            <div className="asset-ops">
                                <button className="op-btn delete" onClick={() => handleDeleteLesson(lesson.id)}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    {activeTab === 'videos' && videos.map((video, idx) => (
                        <div key={video.id} className="asset-card video-card">
                            <div className="video-thumb">
                                <svg width="32" height="32" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                            </div>
                            <div className="asset-info">
                                <h3>{video.title}</h3>
                                <p>{video.description || 'No description'}</p>
                                <span className="asset-meta">{video.duration || 0} mins</span>
                            </div>
                            <div className="asset-ops">
                                <button className="op-btn delete" onClick={() => handleDeleteLesson(video.id)}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    {activeTab === 'quizzes' && quizzes.map((quiz) => (
                        <div key={quiz.id} className="asset-card quiz-card">
                            <div className="quiz-icon">🏆</div>
                            <div className="asset-info">
                                <h3>{quiz.title}</h3>
                                <p>{quiz.description || 'Assessment module'}</p>
                                <span className="asset-meta">{quiz.total_questions} Qs • {quiz.passing_score}% Pass</span>
                            </div>
                            <div className="asset-ops">
                                <button className="op-btn delete" onClick={() => handleDeleteQuiz(quiz.id)}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    {((activeTab === 'lessons' && readingLessons.length === 0) ||
                        (activeTab === 'videos' && videos.length === 0) ||
                        (activeTab === 'quizzes' && quizzes.length === 0)) && (
                            <div className="empty-content">
                                <div className="empty-pulsar"></div>
                                <h3>No content found in this vault</h3>
                                <p>Upload new material to expand the curriculum.</p>
                            </div>
                        )}
                </div>
            </div>

            {/* Modals */}
            {showLessonModal && (
                <div className="curriculum-modal-overlay fade-in">
                    <div className="curriculum-modal-content">
                        <div className="curriculum-modal-header">
                            <h2 className="curriculum-modal-title">New {activeTab === 'videos' ? 'Video Lecture' : 'Lesson Asset'}</h2>
                            <button className="curriculum-modal-close" onClick={() => setShowLessonModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateLesson} className="curriculum-modal-form">
                            <div className="curriculum-modal-section">
                                <h3 className="curriculum-section-title">Basic Information</h3>
                                <div className="curriculum-input-group">
                                    <label className="curriculum-input-label">Title</label>
                                    <input
                                        className="curriculum-form-input"
                                        required
                                        value={lessonData.title}
                                        onChange={e => setLessonData({ ...lessonData, title: e.target.value })}
                                        placeholder="e.g. Introduction to Architecture"
                                    />
                                </div>
                                <div className="curriculum-input-group">
                                    <label className="curriculum-input-label">Description</label>
                                    <textarea
                                        className="curriculum-form-input"
                                        rows="2"
                                        value={lessonData.description}
                                        onChange={e => setLessonData({ ...lessonData, description: e.target.value })}
                                        placeholder="Brief overview..."
                                    />
                                </div>
                            </div>

                            <div className="curriculum-modal-section">
                                <h3 className="curriculum-section-title">Content & Media</h3>
                                <div className="curriculum-input-group">
                                    <label className="curriculum-input-label">Lesson Type</label>
                                    <select
                                        className="curriculum-form-input"
                                        value={lessonData.file_type}
                                        onChange={e => setLessonData({ ...lessonData, file_type: e.target.value })}
                                    >
                                        <option value="video">Video Lecture</option>
                                        <option value="pdf">PDF Document</option>
                                        <option value="document">Text Lesson</option>
                                    </select>
                                </div>

                                {lessonData.file_type === 'video' ? (
                                    <div className="curriculum-input-group">
                                        <label className="curriculum-input-label">Video URL</label>
                                        <input
                                            type="url"
                                            className="curriculum-form-input"
                                            required
                                            value={lessonData.video_url}
                                            onChange={e => setLessonData({ ...lessonData, video_url: e.target.value })}
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="curriculum-input-group">
                                            <label className="curriculum-input-label">Text Content</label>
                                            <textarea
                                                className="curriculum-form-input"
                                                rows="4"
                                                value={lessonData.content}
                                                onChange={e => setLessonData({ ...lessonData, content: e.target.value })}
                                                placeholder="Write your lesson content here..."
                                            />
                                        </div>
                                        <div className="curriculum-input-group">
                                            <label className="curriculum-input-label">Resource URL (Optional)</label>
                                            <input
                                                type="url"
                                                className="curriculum-form-input"
                                                value={lessonData.file_url}
                                                onChange={e => setLessonData({ ...lessonData, file_url: e.target.value })}
                                                placeholder="Link to PDF or external resource"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="curriculum-input-group">
                                    <label className="curriculum-input-label">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        className="curriculum-form-input"
                                        value={lessonData.duration}
                                        onChange={e => setLessonData({ ...lessonData, duration: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="curriculum-modal-actions">
                                <button type="button" className="curriculum-cancel-btn" onClick={() => setShowLessonModal(false)}>CANCEL</button>
                                <button type="submit" className="curriculum-submit-btn" disabled={isSaving}>
                                    {isSaving ? 'PUBLISHING...' : 'PUBLISH ASSET'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showQuizModal && (
                <div className="curriculum-modal-overlay fade-in">
                    <div className="curriculum-modal-content">
                        <div className="curriculum-modal-header">
                            <h2 className="curriculum-modal-title">New Assessment</h2>
                            <button className="curriculum-modal-close" onClick={() => setShowQuizModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateQuiz} className="curriculum-modal-form">
                            <div className="curriculum-modal-section">
                                <h3 className="curriculum-section-title">Quiz Details</h3>
                                <div className="curriculum-input-group">
                                    <label className="curriculum-input-label">Quiz Title</label>
                                    <input
                                        className="curriculum-form-input"
                                        required
                                        value={quizData.title}
                                        onChange={e => setQuizData({ ...quizData, title: e.target.value })}
                                        placeholder="e.g. Midterm Assessment"
                                    />
                                </div>
                                <div className="curriculum-input-grid">
                                    <div className="curriculum-input-group">
                                        <label className="curriculum-input-label">Passing Score (%)</label>
                                        <input
                                            type="number"
                                            className="curriculum-form-input"
                                            value={quizData.passing_score}
                                            onChange={e => setQuizData({ ...quizData, passing_score: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="curriculum-input-group">
                                        <label className="curriculum-input-label">Time Limit (Mins)</label>
                                        <input
                                            type="number"
                                            className="curriculum-form-input"
                                            value={quizData.time_limit}
                                            onChange={e => setQuizData({ ...quizData, time_limit: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="curriculum-modal-section">
                                <h3 className="curriculum-section-title">Question Builder ({quizData.questions.length})</h3>

                                <div className="curriculum-question-form">
                                    <div className="curriculum-input-group">
                                        <label className="curriculum-input-label">Question Text</label>
                                        <textarea
                                            className="curriculum-form-input"
                                            rows="2"
                                            value={currentQuestion.question_text}
                                            onChange={e => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                                            placeholder="Enter your question here..."
                                        />
                                    </div>

                                    <div className="curriculum-type-toggle">
                                        <button
                                            type="button"
                                            className={`type-btn ${currentQuestion.type === 'MCQ' ? 'active' : ''}`}
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'MCQ', correct_answer: '' })}
                                        >
                                            MCQ (Single)
                                        </button>
                                        <button
                                            type="button"
                                            className={`type-btn ${currentQuestion.type === 'MSQ' ? 'active' : ''}`}
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'MSQ', correct_answer: '' })}
                                        >
                                            MSQ (Multiple)
                                        </button>
                                    </div>

                                    <div className="curriculum-options-grid">
                                        {['a', 'b', 'c', 'd'].map(opt => (
                                            <div key={opt} className="curriculum-option-row">
                                                <div
                                                    className={`option-check-circle ${currentQuestion.correct_answer.split(',').includes(opt) ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        let newAnswer = currentQuestion.correct_answer;
                                                        if (currentQuestion.type === 'MCQ') {
                                                            newAnswer = opt;
                                                        } else {
                                                            const answers = newAnswer ? newAnswer.split(',').filter(Boolean) : [];
                                                            if (answers.includes(opt)) {
                                                                newAnswer = answers.filter(a => a !== opt).join(',');
                                                            } else {
                                                                newAnswer = [...answers, opt].sort().join(',');
                                                            }
                                                        }
                                                        setCurrentQuestion({ ...currentQuestion, correct_answer: newAnswer });
                                                    }}
                                                >
                                                    {opt.toUpperCase()}
                                                </div>
                                                <input
                                                    className="curriculum-form-input"
                                                    placeholder={`Option ${opt.toUpperCase()}`}
                                                    value={currentQuestion[`option_${opt}`]}
                                                    onChange={e => setCurrentQuestion({ ...currentQuestion, [`option_${opt}`]: e.target.value })}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="curriculum-add-q-btn"
                                        onClick={() => {
                                            if (!currentQuestion.question_text || !currentQuestion.option_a || !currentQuestion.option_b || !currentQuestion.correct_answer) {
                                                alert("Please complete the question and at least two options, and mark the correct answer.");
                                                return;
                                            }
                                            setQuizData({
                                                ...quizData,
                                                questions: [...quizData.questions, { ...currentQuestion, sequence_number: quizData.questions.length + 1 }]
                                            });
                                            setCurrentQuestion({
                                                question_text: '', option_a: '', option_b: '',
                                                option_c: '', option_d: '', correct_answer: '', explanation: '', type: currentQuestion.type
                                            });
                                        }}
                                    >
                                        + Add Question to Quiz
                                    </button>
                                </div>

                                {quizData.questions.length > 0 && (
                                    <div className="curriculum-q-preview-list">
                                        {quizData.questions.map((q, idx) => (
                                            <div key={idx} className="curriculum-q-preview-item">
                                                <span className="q-preview-text">Q{idx + 1}: {q.question_text.substring(0, 40)}...</span>
                                                <div className="q-preview-meta">
                                                    <span className="q-preview-type">{q.type}</span>
                                                    <button
                                                        className="q-preview-delete"
                                                        type="button"
                                                        onClick={() => setQuizData({
                                                            ...quizData,
                                                            questions: quizData.questions.filter((_, i) => i !== idx)
                                                        })}
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="curriculum-modal-actions">
                                <button type="button" className="curriculum-cancel-btn" onClick={() => setShowQuizModal(false)}>CANCEL</button>
                                <button type="submit" className="curriculum-submit-btn" disabled={isSaving}>
                                    {isSaving ? 'CREATING...' : 'CREATE QUIZ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
