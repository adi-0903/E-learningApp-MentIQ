import React, { useState, useEffect, useRef } from 'react';
import './ClassroomPage.css';
import { CalendarCard } from './CalendarCard';
import api, { API_URL } from '../api';

export function ClassroomPage({ onBack, userRole, userData }) {
    const [liveClasses, setLiveClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);

    // Scheduling states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newClassTitle, setNewClassTitle] = useState('');
    const [newClassDescription, setNewClassDescription] = useState('');
    const [newClassDate, setNewClassDate] = useState('');
    const [newClassTime, setNewClassTime] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [teacherCourses, setTeacherCourses] = useState([]);

    // Meeting & Recording states
    const [activeMeeting, setActiveMeeting] = useState(null); // {id, roomName, meetingUrl}
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const streamRef = useRef(null);

    const fetchLiveClasses = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('live-classes/');
            if (res.data && res.data.success) {
                setLiveClasses(res.data.data);
            } else if (res.data && res.data.results) {
                setLiveClasses(res.data.results);
            }
        } catch (err) {
            console.error("Error fetching live classes:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeacherCourses = async () => {
        try {
            const res = await api.get('courses/');
            if (res.data && res.data.success) {
                setTeacherCourses(res.data.data);
            } else if (res.data && res.data.results) {
                setTeacherCourses(res.data.results);
            }
        } catch (err) {
            console.error("Error fetching courses", err);
        }
    };

    useEffect(() => {
        fetchLiveClasses();
    }, []);

    useEffect(() => {
        if (isModalOpen && userRole === 'teacher') {
            fetchTeacherCourses();
        }
    }, [isModalOpen, userRole]);

    // Cleanup recording on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const handleActionClass = async (liveClassObj) => {
        setJoiningId(liveClassObj.id);
        try {
            const isTeacherStarting = userRole === 'teacher' && liveClassObj.status === 'scheduled';
            const endpoint = isTeacherStarting ? `live-classes/${liveClassObj.id}/start/` : `live-classes/${liveClassObj.id}/join/`;
            const res = await api.post(endpoint);
            if (res.data && res.data.success) {
                const { room_name, meeting_url } = res.data.data;
                // Open embedded meeting
                setActiveMeeting({
                    id: liveClassObj.id,
                    roomName: room_name || liveClassObj.channel_name,
                    meetingUrl: meeting_url,
                    title: liveClassObj.title
                });
                if (isTeacherStarting) {
                    fetchLiveClasses();
                }
            } else {
                alert("Could not process your request. Please try again later.");
            }
        } catch (err) {
            console.error("Error connecting to live class:", err);
            alert("Failed to connect to class.");
        } finally {
            setJoiningId(null);
        }
    };

    const startRecording = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'browser', width: 1920, height: 1080 },
                audio: true
            });

            // Also capture microphone audio
            let audioStream;
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e) {
                console.warn("Could not capture microphone audio, proceeding with display audio only.");
            }

            // Merge display and mic audio into one stream
            const tracks = [...displayStream.getVideoTracks()];
            if (audioStream) {
                tracks.push(...audioStream.getAudioTracks());
            }
            // Also include display audio if captured
            if (displayStream.getAudioTracks().length > 0) {
                tracks.push(...displayStream.getAudioTracks());
            }

            const combinedStream = new MediaStream(tracks);
            streamRef.current = combinedStream;

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            recordedChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                clearInterval(recordingTimerRef.current);
                combinedStream.getTracks().forEach(t => t.stop());
            };

            // Stop recording if user stops screen share
            displayStream.getVideoTracks()[0].onended = () => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    stopRecording();
                }
            };

            recorder.start(1000); // Collect data every second
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Failed to start recording:", err);
            if (err.name !== 'NotAllowedError') {
                alert("Failed to start screen recording. Please allow screen sharing.");
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        clearInterval(recordingTimerRef.current);
    };

    const uploadRecording = async () => {
        if (recordedChunksRef.current.length === 0 || !activeMeeting) return;

        setIsUploading(true);
        try {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const formData = new FormData();
            formData.append('recording', blob, `recording-${activeMeeting.roomName}.webm`);

            const res = await api.post(`live-classes/${activeMeeting.id}/upload-recording/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000 // 5 min timeout for large files
            });

            if (res.data && res.data.success) {
                alert("✅ Recording uploaded successfully! Students can now access it.");
                recordedChunksRef.current = [];
            } else {
                alert("Failed to upload recording.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload recording. You can try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const downloadRecording = () => {
        if (recordedChunksRef.current.length === 0) return;
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${activeMeeting?.roomName || 'class'}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const leaveMeeting = async () => {
        if (isRecording) stopRecording();
        // If teacher, end the class on the backend
        if (userRole === 'teacher' && activeMeeting) {
            try {
                await api.post(`live-classes/${activeMeeting.id}/end/`);
            } catch (err) {
                console.error('Error ending class:', err);
            }
        }
        setActiveMeeting(null);
        fetchLiveClasses();
    };

    const formatTime = (secs) => {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleScheduleClass = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const datetime = new Date(`${newClassDate}T${newClassTime}`).toISOString();
            const payload = {
                title: newClassTitle,
                description: newClassDescription,
                scheduled_at: datetime,
                max_participants: 100
            };
            if (selectedCourseId) {
                payload.course = selectedCourseId;
            }
            const res = await api.post('live-classes/', payload);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                setNewClassTitle('');
                setNewClassDescription('');
                setNewClassDate('');
                setNewClassTime('');
                setSelectedCourseId('');
                fetchLiveClasses();
            }
        } catch (err) {
            console.error("Error creating live class:", err);
            alert("Failed to schedule class.");
        } finally {
            setIsLoading(false);
        }
    };

    // ─── MEETING VIEW (Embedded Jitsi) ─────────────────────────────
    if (activeMeeting) {
        return (
            <div className="classroom-wrapper fade-in" style={{ padding: 0 }}>
                {/* Meeting Toolbar */}
                <div className="meeting-toolbar">
                    <div className="meeting-toolbar-left">
                        <div className="meeting-live-dot"></div>
                        <span className="meeting-title">{activeMeeting.title}</span>
                    </div>
                    <div className="meeting-toolbar-center">
                        {isRecording && (
                            <div className="recording-indicator">
                                <span className="rec-dot"></span>
                                <span>REC {formatTime(recordingTime)}</span>
                            </div>
                        )}
                    </div>
                    <div className="meeting-toolbar-right">
                        {userRole === 'teacher' && !isRecording && recordedChunksRef.current.length === 0 && (
                            <button className="toolbar-btn rec-btn" onClick={startRecording}>
                                ⏺ Start Recording
                            </button>
                        )}
                        {isRecording && (
                            <button className="toolbar-btn stop-btn" onClick={stopRecording}>
                                ⏹ Stop Recording
                            </button>
                        )}
                        {!isRecording && recordedChunksRef.current.length > 0 && (
                            <>
                                <button className="toolbar-btn upload-btn" onClick={uploadRecording} disabled={isUploading}>
                                    {isUploading ? '⏳ Uploading...' : '☁ Upload to Platform'}
                                </button>
                                <button className="toolbar-btn download-btn" onClick={downloadRecording}>
                                    ⬇ Download
                                </button>
                            </>
                        )}
                        <button className="toolbar-btn leave-btn" onClick={leaveMeeting}>
                            ✕ Leave Meeting
                        </button>
                    </div>
                </div>

                {/* Jitsi Iframe */}
                <iframe
                    src={activeMeeting.meetingUrl}
                    className="jitsi-iframe"
                    allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                    allowFullScreen
                />
            </div>
        );
    }

    // ─── MAIN CLASSROOM VIEW ───────────────────────────────────────
    return (
        <div className="classroom-wrapper fade-in">
            <div className="classroom-header">
                <div className="header-content">
                    <h1>Virtual Classroom</h1>
                    <p>Experience real-time learning with industry experts and interactive sessions.</p>
                </div>
                <div className="classroom-header-actions" style={{ display: 'flex', gap: '15px' }}>
                    {userRole === 'teacher' && (
                        <button className="premium-back-btn fade-in" onClick={() => setIsModalOpen(true)} style={{ background: 'linear-gradient(45deg, #9b6cff, #3b82f6)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
                            + SCHEDULE CLASS
                        </button>
                    )}
                    {onBack && (
                        <button className="premium-back-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
                            BACK TO DASHBOARD
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="classroom-empty-container">
                    <div className="premium-spinner"></div>
                    <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Synching with live servers...</p>
                </div>
            ) : (
                <div className="classroom-main-layout">
                    <aside className="calendar-pane slide-up">
                        <CalendarCard
                            onRefresh={fetchLiveClasses}
                            liveClasses={liveClasses.map(c => ({
                                ...c,
                                scheduled_time: c.scheduled_at,
                                topic: c.title
                            }))}
                        />
                    </aside>

                    <main className="classes-pane">
                        <div className="classroom-grid">
                            {liveClasses.map(liveClass => (
                                <div key={liveClass.id} className="premium-class-card fade-in-blur">
                                    <div className="class-card-header">
                                        <h3 className="class-title">{liveClass.title}</h3>
                                        <span className={`status-badge ${(liveClass.status === 'ongoing' || liveClass.status === 'live') ? 'status-ongoing' : liveClass.status === 'ended' ? 'status-ended' : 'status-scheduled'}`}>
                                            {liveClass.status === 'live' ? 'LIVE' : liveClass.status === 'ended' ? 'COMPLETED' : liveClass.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <p className="class-desc">{liveClass.description || 'Join this exclusively curated professional session to elevate your domain expertise with real-world insights.'}</p>

                                    <div className="class-meta-grid">
                                        <div className="meta-item">
                                            <span className="meta-label">MENTOR</span>
                                            <span className="meta-value" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{liveClass.teacher_name || 'Instructor'}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">SCHEDULE</span>
                                            <span className="meta-value">{new Date(liveClass.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    {liveClass.recording_url && (
                                        <a
                                            href={liveClass.recording_url.startsWith('http') ? liveClass.recording_url : `${API_URL.split('/api/v1/')[0]}${liveClass.recording_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="recording-link"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            🎬 Watch Recording
                                        </a>
                                    )}

                                    <button
                                        className={`join-btn-ultra ${(liveClass.status === 'ongoing' || liveClass.status === 'live') || (userRole === 'teacher' && liveClass.status === 'scheduled') ? 'active' : liveClass.status === 'ended' ? 'completed' : 'disabled'}`}
                                        disabled={liveClass.status === 'ended' || (!(liveClass.status === 'ongoing' || liveClass.status === 'live' || (userRole === 'teacher' && liveClass.status === 'scheduled')) || joiningId === liveClass.id)}
                                        onClick={() => handleActionClass(liveClass)}
                                    >
                                        {joiningId === liveClass.id ? 'CONNECTING...'
                                            : liveClass.status === 'ended' ? '✓ COMPLETED'
                                                : (userRole === 'teacher' && liveClass.status === 'scheduled') ? 'START CLASS'
                                                    : (liveClass.status === 'ongoing' || liveClass.status === 'live') ? 'ENTER CLASSROOM'
                                                        : 'NOT STARTED'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay fade-in">
                    <div className="modal-content-premium">
                        <div className="modal-header">
                            <h2 className="modal-title">Schedule Class</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleScheduleClass} className="modal-form">
                            <div className="premium-input-group">
                                <label className="input-label">Class Title</label>
                                <input type="text" className="premium-input" placeholder="e.g. Advanced System Design" required value={newClassTitle} onChange={e => setNewClassTitle(e.target.value)} />
                            </div>

                            <div className="premium-input-group">
                                <label className="input-label">Link to Course (Optional)</label>
                                <select className="premium-input" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                                    <option value="">-- Platform Wide Session --</option>
                                    {teacherCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="premium-input-group">
                                <label className="input-label">Description</label>
                                <textarea className="premium-input" placeholder="What will be covered in this session?" rows="3" required value={newClassDescription} onChange={e => setNewClassDescription(e.target.value)}></textarea>
                            </div>

                            <div className="premium-date-time-wrapper">
                                <div className="premium-input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Date</label>
                                    <input type="date" className="premium-input" required value={newClassDate} onChange={e => setNewClassDate(e.target.value)} />
                                </div>
                                <div className="premium-input-group" style={{ flex: 1 }}>
                                    <label className="input-label">Time</label>
                                    <input type="time" className="premium-input" required value={newClassTime} onChange={e => setNewClassTime(e.target.value)} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="premium-cancel-btn" onClick={() => setIsModalOpen(false)}>CANCEL</button>
                                <button type="submit" className="premium-submit-btn">SCHEDULE NOW</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
