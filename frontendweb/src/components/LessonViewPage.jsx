import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Edit3, Save, X } from 'lucide-react';
import api from '../api';
import './LessonViewPage.css';

export function LessonViewPage({ lesson, onBack, onNext, onPrev, hasNext, hasPrev, userRole }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentLesson, setCurrentLesson] = useState(lesson);
    const [editForm, setEditForm] = useState({ title: '', content: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Fetch full lesson detail if content is missing (common in list view results)
        const fetchFullLesson = async () => {
            try {
                const res = await api.get(`lessons/${lesson.id}/`);
                if (res.data?.success) {
                    setCurrentLesson(res.data.data);
                    setEditForm({
                        title: res.data.data.title,
                        content: res.data.data.content
                    });
                }
            } catch (err) {
                console.error("Failed to fetch lesson detail:", err);
            }
        };

        if (lesson?.id) {
            fetchFullLesson();
        }
        window.scrollTo(0, 0);
    }, [lesson]);

    if (!currentLesson) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await api.put(`lessons/${currentLesson.id}/`, editForm);
            if (res.data?.success) {
                setCurrentLesson(res.data.data);
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Failed to update lesson:", err);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const contentParagraphs = (currentLesson.content || "No content available for this lesson.")
        .split('\n')
        .filter(p => p.trim() !== '');

    const isTeacher = userRole === 'teacher';

    return (
        <div className="lesson-view-container">
            <div className="progress-ley-line">
                <div className="progress-fill" style={{ width: `${((currentLesson.sequence_number || 1) / 5) * 100}%` }}></div>
            </div>

            {/* Top Navigation */}
            <nav className="lesson-top-nav">
                <button className="back-link" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>BACK TO CURRICULUM</span>
                </button>
                
                <div className="lesson-progress-info">
                    <span className="lesson-meta">MODULE {currentLesson.sequence_number || 1} • {isEditing ? 'EDITING MODE' : 'LESSON ARCHIVE'}</span>
                    <div className="lesson-nav-title">{currentLesson.title}</div>
                </div>

                <div className="lesson-actions">
                    {isTeacher && (
                        !isEditing ? (
                            <button className="lesson-edit-trigger" onClick={() => setIsEditing(true)}>
                                <Edit3 size={18} />
                                <span>EDIT LESSON</span>
                            </button>
                        ) : (
                            <div className="edit-action-group">
                                <button className="lesson-save-btn" onClick={handleSave} disabled={isSaving}>
                                    <Save size={18} />
                                    <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
                                </button>
                                <button className="lesson-cancel-btn" onClick={() => setIsEditing(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                        )
                    )}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="lesson-main-content">
                {isEditing ? (
                    <div className="lesson-edit-form fade-in">
                        <div className="edit-field">
                            <label>Lesson Title</label>
                            <input 
                                type="text" 
                                value={editForm.title} 
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="Enter lesson title..."
                            />
                        </div>
                        <div className="edit-field">
                            <label>Lesson Content (Markdown/Rich Text)</label>
                            <textarea 
                                value={editForm.content} 
                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                placeholder="Write your lesson content here..."
                                rows={20}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <header className="lesson-header">
                            <h1 className="lesson-editorial-title">{currentLesson.title}</h1>
                        </header>

                        <article className="lesson-content-body">
                            {contentParagraphs.map((paragraph, i) => (
                                <React.Fragment key={i}>
                                    <p className="lesson-paragraph">{paragraph}</p>
                                    {i === 1 && <div className="lesson-section-divider" />}
                                </React.Fragment>
                            ))}
                        </article>
                    </>
                )}
            </main>

            {/* Bottom Navigation Controls */}
            {!isEditing && (
                <footer className="lesson-bottom-nav">
                    <button 
                        className="lesson-nav-btn btn-prev" 
                        onClick={onPrev}
                        disabled={!hasPrev}
                    >
                        <ChevronLeft size={20} />
                        <span>PREVIOUS</span>
                    </button>
                    
                    <button 
                        className="lesson-nav-btn btn-next" 
                        onClick={onNext}
                        disabled={!hasNext}
                    >
                        <span>NEXT LESSON</span>
                        <ChevronRight size={20} />
                    </button>
                </footer>
            )}
        </div>
    );
}
