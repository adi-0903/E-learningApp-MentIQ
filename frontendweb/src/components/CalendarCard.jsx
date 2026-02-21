import React, { useState, useMemo } from 'react';
import './CalendarCard.css';

export function CalendarCard({ liveClasses = [], onRefresh }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedStatuses, setSelectedStatuses] = useState(['ongoing', 'upcoming', 'completed']);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Mini-calendar generation logic based on currentMonthDate
    const { monthDays, currentMonthName } = useMemo(() => {
        const startOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
        const endOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
        const prevMonthLastDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 0).getDate();

        const daysArray = [];
        const firstDayIdx = startOfMonth.getDay();

        // Fill previous month days
        for (let i = firstDayIdx - 1; i >= 0; i--) {
            daysArray.push({
                num: prevMonthLastDay - i,
                current: false,
                date: new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, prevMonthLastDay - i)
            });
        }
        // Fill current month days
        for (let i = 1; i <= endOfMonth.getDate(); i++) {
            daysArray.push({
                num: i,
                current: true,
                isToday: i === today.getDate() && currentMonthDate.getMonth() === today.getMonth() && currentMonthDate.getFullYear() === today.getFullYear(),
                isSelected: i === viewDate.getDate() && currentMonthDate.getMonth() === viewDate.getMonth() && currentMonthDate.getFullYear() === viewDate.getFullYear(),
                date: new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), i)
            });
        }
        // Fill next month days
        const remaining = 42 - daysArray.length;
        for (let i = 1; i <= remaining; i++) {
            daysArray.push({
                num: i,
                current: false,
                date: new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, i)
            });
        }

        return {
            monthDays: daysArray,
            currentMonthName: currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })
        };
    }, [currentMonthDate, viewDate, today]);

    const hours = Array.from({ length: 24 }).map((_, i) => {
        const h = i % 12 || 12;
        const ampm = i < 12 ? 'am' : 'pm';
        return `${h}${ampm}`;
    });

    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'

    // Helper to get week range
    const getWeekRange = (date) => {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
    };

    const weekRange = useMemo(() => getWeekRange(viewDate), [viewDate]);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(weekRange.start);
            d.setDate(weekRange.start.getDate() + i);
            return d;
        });
    }, [weekRange]);

    const toggleStatus = (status) => {
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
        if (viewMode === 'month') {
            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
        }
    };

    const handleNav = (offset) => {
        setViewDate(prev => {
            const next = new Date(prev);
            if (viewMode === 'day') next.setDate(prev.getDate() + offset);
            else if (viewMode === 'week') next.setDate(prev.getDate() + (offset * 7));
            else if (viewMode === 'month') {
                next.setMonth(prev.getMonth() + offset);
                // Sync the mini-calendar month as well
                setCurrentMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
            }
            return next;
        });
    };

    const renderEvents = (date, hour) => {
        return liveClasses.map(cls => {
            const clsTime = new Date(cls.scheduled_time || cls.scheduled_at);
            const isSameDay = clsTime.toDateString() === date.toDateString();
            const matchesFilter = selectedStatuses.includes(cls.status);

            if (isSameDay && clsTime.getHours() === hour && matchesFilter) {
                return (
                    <div key={cls.id} className={`timeline-event ${cls.status}`}>
                        <span className="event-tag" style={{ fontSize: viewMode === 'week' ? '0.5rem' : '0.65rem' }}>{cls.status}</span>
                        <strong style={{ fontSize: viewMode === 'week' ? '0.75rem' : '0.9rem' }}>{cls.topic || cls.title}</strong>
                    </div>
                );
            }
            return null;
        });
    };

    const getTitle = () => {
        if (viewMode === 'day') return viewDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
        if (viewMode === 'week') {
            const startStr = weekRange.start.toLocaleDateString('default', { month: 'short', day: 'numeric' });
            const endStr = weekRange.end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
            return `${startStr} - ${endStr}`;
        }
        return viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="premium-scheduler">
            {/* Top Legend */}
            <div className="scheduler-header-bar">
                <div className="legend-container">
                    <strong>Legend:</strong>
                    <div className="legend-item"><span className="dot upcoming"></span> Upcoming</div>
                    <div className="legend-item"><span className="dot delayed"></span> Delayed</div>
                    <div className="legend-item"><span className="dot ongoing"></span> Ongoing</div>
                    <div className="legend-item"><span className="dot completed"></span> Completed</div>
                </div>
            </div>

            <div className="scheduler-main-content">
                {/* Left Sidebar */}
                <aside className="scheduler-sidebar">
                    <div className="mini-month-view">
                        <div className="month-nav">
                            <span onClick={() => changeMonth(-1)} style={{ cursor: 'pointer', padding: '0 10px' }}>&laquo;</span>
                            <strong>{currentMonthName}</strong>
                            <span onClick={() => changeMonth(1)} style={{ cursor: 'pointer', padding: '0 10px' }}>&raquo;</span>
                        </div>
                        <div className="mini-grid">
                            {days.map(d => <div key={d} className="mini-day-header">{d}</div>)}
                            {monthDays.map((d, i) => (
                                <div
                                    key={i}
                                    className={`mini-day ${!d.current ? 'other-month' : ''} ${d.isToday ? 'is-today' : ''} ${d.isSelected ? 'is-selected' : ''}`}
                                    onClick={() => setViewDate(d.date)}
                                >
                                    {d.num}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="scheduler-filters">
                        <div className="filter-group">
                            <strong>Filters</strong>
                            <div className="filter-box">
                                <label>Status</label>
                                <div className="status-tags">
                                    {['ongoing', 'upcoming', 'completed'].map(status => (
                                        <span
                                            key={status}
                                            onClick={() => toggleStatus(status)}
                                            style={{
                                                opacity: selectedStatuses.includes(status) ? 1 : 0.3,
                                                cursor: 'pointer',
                                                transition: 'opacity 0.2s',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {status} <i style={{ fontStyle: 'normal' }}>&times;</i>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button className="apply-filter-btn" onClick={() => setSelectedStatuses(['ongoing', 'upcoming', 'completed'])}>
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Right Timeline Grid */}
                <main className="scheduler-timeline-container">
                    <div className="timeline-header">
                        <div className="timeline-nav">
                            <button onClick={() => handleNav(-1)}>&lsaquo;</button>
                            <button onClick={() => handleNav(1)}>&rsaquo;</button>
                            <button className="today-btn" onClick={() => setViewDate(new Date())}>today</button>
                            <button className="refresh-btn" onClick={() => onRefresh ? onRefresh() : window.location.reload()}>🔄</button>
                        </div>
                        <h2 className="current-date-title">{getTitle()}</h2>
                        <div className="view-selector">
                            <button className={`view-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Month</button>
                            <button className={`view-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Week</button>
                            <button className={`view-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Day</button>
                        </div>
                    </div>

                    <div className="timeline-grid-wrapper horizontal-scroll-container">
                        {viewMode === 'month' ? (
                            <div className="month-view-grid">
                                {days.map(d => <div key={d} className="month-grid-header">{d}</div>)}
                                {monthDays.map((d, i) => (
                                    <div key={i} className={`month-grid-cell ${!d.current ? 'other-month' : ''} ${d.isToday ? 'is-today' : ''}`}>
                                        <span className="cell-day-num">{d.num}</span>
                                        <div className="cell-events">
                                            {liveClasses.filter(c => {
                                                const cDate = new Date(c.scheduled_time || c.scheduled_at);
                                                return cDate.toDateString() === d.date.toDateString();
                                            }).map(c => (
                                                <div key={c.id} className={`dot ${c.status}`} title={c.topic || c.title}></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="timeline-content-scroller">
                                <div className="timeline-day-header-row">
                                    <div className="hour-spacer"></div>
                                    {viewMode === 'day' ? (
                                        <div className="timeline-day-header">{viewDate.toLocaleDateString('default', { weekday: 'long' })}</div>
                                    ) : (
                                        weekDays.map(d => (
                                            <div key={d.toISOString()} className="timeline-day-header week-mode">
                                                {d.toLocaleDateString('default', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="timeline-scroll-area">
                                    {hours.map((h, i) => (
                                        <div key={i} className="hour-row">
                                            <div className="hour-label">{h}</div>
                                            {viewMode === 'day' ? (
                                                <div className="hour-slot">
                                                    {renderEvents(viewDate, i)}
                                                    {i === today.getHours() && viewDate.toDateString() === today.toDateString() && (
                                                        <div className="now-indicator" style={{ top: `${(today.getMinutes() / 60) * 100}%` }}></div>
                                                    )}
                                                </div>
                                            ) : (
                                                weekDays.map(d => (
                                                    <div key={d.toISOString()} className="hour-slot week-mode">
                                                        {renderEvents(d, i)}
                                                        {i === today.getHours() && d.toDateString() === today.toDateString() && (
                                                            <div className="now-indicator" style={{ top: `${(today.getMinutes() / 60) * 100}%` }}></div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
