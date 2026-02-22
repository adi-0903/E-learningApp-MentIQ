import React, { useState, useEffect } from 'react';
import api from '../api';
import './TeacherAttendanceCard.css';

export function TeacherAttendanceCard({ onMarkAttendance }) {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('teachers/courses/');
                if (res.data && res.data.success) {
                    setCourses(res.data.data);
                }
            } catch (err) {
                console.error("Error fetching courses for attendance:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourses();
    }, []);

    return (
        <div className="card teacher-attendance-card slide-up">
            <div className="attendance-header">
                <div className="title-section">
                    <h3>Mark Attendance</h3>
                    <div className="active-badge">Live Actions</div>
                </div>
                <div className="icon-circle">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
            </div>

            <p className="card-description">Select an active course to log daily student presence.</p>

            <div className="courses-list-mini">
                {isLoading ? (
                    <div className="mini-loader">Loading...</div>
                ) : courses.length === 0 ? (
                    <div className="empty-courses">No active courses found.</div>
                ) : (
                    courses.map(course => (
                        <div
                            key={course.id}
                            className="mini-course-item"
                            onClick={() => onMarkAttendance(course.id, course.title)}
                        >
                            <div className="course-avatar">
                                {course.title[0]}
                            </div>
                            <div className="course-info">
                                <span className="course-name">{course.title}</span>
                                <span className="student-count">{course.student_count || 0} Students Enrolled</span>
                            </div>
                            <button className="action-btn">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
