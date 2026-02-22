import React, { useState, useEffect } from 'react';
import api from '../api';
import './AttendanceMarkingPage.css';

export function AttendanceMarkingPage({ courseId, courseTitle, onBack }) {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [markingDate] = useState(new Date().toISOString().split('T')[0]);
    const [classTime, setClassTime] = useState('10:00');
    const [attendanceMap, setAttendanceMap] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get(`attendance/course-students/${courseId}/`);
                if (res.data && res.data.success) {
                    setStudents(res.data.data);
                    // Initialize all as present by default
                    const initialMap = {};
                    res.data.data.forEach(s => {
                        initialMap[s.id] = true;
                    });
                    setAttendanceMap(initialMap);
                }
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, [courseId]);

    const toggleAttendance = (studentId) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const records = students.map(s => ({
                student: s.id,
                is_present: !!attendanceMap[s.id]
            }));

            const payload = {
                course_id: courseId,
                start_time: classTime,
                records: records
            };

            await api.post('attendance/mark/', payload);
            alert("Attendance marked successfully!");
            onBack();
        } catch (err) {
            console.error("Error saving attendance:", err);
            alert("Failed to save attendance.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="attendance-marking-page slide-up">
            <div className="marking-header">
                <button className="back-btn-minimal" onClick={onBack}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="title-stack">
                    <h1>Mark Attendance</h1>
                    <p>{courseTitle}</p>
                </div>
                <div className="date-display">
                    <span className="label">Today's Class</span>
                    <span className="value">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="marking-controls">
                <div className="control-group">
                    <label>Class Start Time</label>
                    <input
                        type="time"
                        value={classTime}
                        onChange={(e) => setClassTime(e.target.value)}
                        className="premium-marking-input"
                    />
                </div>
                <div className="attendance-summary">
                    <div className="stat">
                        <span className="num">{students.length}</span>
                        <span className="lab">Total</span>
                    </div>
                    <div className="stat present">
                        <span className="num">{Object.values(attendanceMap).filter(v => v).length}</span>
                        <span className="lab">Present</span>
                    </div>
                    <div className="stat absent">
                        <span className="num">{Object.values(attendanceMap).filter(v => !v).length}</span>
                        <span className="lab">Absent</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="attendance-loader">
                    <div className="loader-ring"></div>
                    <p>Fetching Student Roster...</p>
                </div>
            ) : (
                <div className="student-roster">
                    <div className="roster-header">
                        <span>STUDENT IDENTIFICATION</span>
                        <span>STATUS</span>
                    </div>
                    {students.map(student => (
                        <div key={student.id} className="roster-row" onClick={() => toggleAttendance(student.id)}>
                            <div className="student-info-main">
                                <div className="avatar-mini">
                                    {student.name[0]}
                                </div>
                                <div className="text-info">
                                    <span className="name">{student.name}</span>
                                    <span className="uid">UID: {student.uid}</span>
                                </div>
                            </div>
                            <div className="status-toggle">
                                <div className={`status-pill ${attendanceMap[student.id] ? 'present' : 'absent'}`}>
                                    {attendanceMap[student.id] ? 'PRESENT' : 'ABSENT'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="marking-footer">
                <button
                    className="save-attendance-btn"
                    onClick={handleSave}
                    disabled={isSaving || students.length === 0}
                >
                    {isSaving ? 'SYNCING...' : 'FINALIZE ATTENDANCE'}
                </button>
            </div>
        </div>
    );
}
