import { PlusCircle, Video, BookOpen, GraduationCap, Users } from 'lucide-react';
import './QuickActionsCard.css';

export function QuickActionsCard({ onOpenCourses, onOpenClassroom, onOpenDoubts, onOpenParents }) {
    const actions = [
        { label: "Create Course", icon: <PlusCircle size={24} />, onClick: onOpenCourses, color: "blue" },
        { label: "Live Classroom", icon: <Video size={24} />, onClick: onOpenClassroom, color: "red" },
        { label: "Answer Doubts", icon: <BookOpen size={24} />, onClick: onOpenDoubts, color: "purple" },
        { label: "Curriculum", icon: <GraduationCap size={24} />, onClick: onOpenCourses, color: "emerald" },
        { label: "Parent Contacts", icon: <Users size={24} />, onClick: onOpenParents, color: "orange" },
    ];

    return (
        <div className="card quick-actions-card slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="title-section mb-4">
                <h3>Quick Actions</h3>
            </div>
            <div className="qa-grid">
                {actions.map((action, idx) => (
                    <button key={idx} className={`qa-btn qa-${action.color}`} onClick={action.onClick}>
                        <div className="qa-icon-wrapper">
                            {action.icon}
                        </div>
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
