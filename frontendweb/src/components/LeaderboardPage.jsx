import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import './LeaderboardPage.css';

/**
 * LeaderboardPage Component - Displays student rankings with Recharts visualization
 */
const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scope, setScope] = useState('global');
    const [timeframe, setTimeframe] = useState('all_time');

    useEffect(() => {
        fetchLeaderboard();
    }, [scope, timeframe]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(
                `${API_URL}progress/leaderboard/?scope=${scope}&timeframe=${timeframe}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            setLeaderboard(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setError('Failed to load leaderboard. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get top 3 for podium
    const topThree = leaderboard.slice(0, 3);
    const restOfLeaderboard = leaderboard.slice(3);

    // Calculate statistics
    const getStats = () => {
        const totalParticipants = leaderboard.length;
        const totalBadges = leaderboard.reduce((sum, entry) => sum + (entry.total_badges || 0), 0);
        const totalRareBadges = leaderboard.reduce((sum, entry) => sum + (entry.rare_badges || 0), 0);
        const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
        return { totalParticipants, totalBadges, totalRareBadges, topScore };
    };

    const stats = getStats();

    if (loading) {
        return (
            <div className="leaderboard-loading">
                <div className="spinner"></div>
                <p>Loading leaderboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leaderboard-error">
                <h3>⚠️ Oops!</h3>
                <p>{error}</p>
                <button onClick={fetchLeaderboard}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="leaderboard-page-container">
            {/* Animated Background Particles */}
            <div className="particles-container">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className={`particle particle-${i % 5}`} />
                ))}
            </div>

            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <div className="trophy-animation">
                        <div className="trophy-glow">
                            <span className="trophy-icon">🏆</span>
                        </div>
                        <div className="trophy-rays">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="ray" style={{ transform: `rotate(${i * 45}deg)` }} />
                            ))}
                        </div>
                    </div>
                    <h1 className="hero-title">Leaderboard</h1>
                    <p className="hero-subtitle">Celebrating top achievers across the platform</p>
                    
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card stat-participants">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalParticipants}</div>
                                <div className="stat-label">Participants</div>
                            </div>
                            <div className="stat-decoration" />
                        </div>
                        <div className="stat-card stat-badges">
                            <div className="stat-icon">🎖️</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalBadges}</div>
                                <div className="stat-label">Total Badges</div>
                            </div>
                            <div className="stat-decoration" />
                        </div>
                        <div className="stat-card stat-top-score">
                            <div className="stat-icon">⭐</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.topScore}</div>
                                <div className="stat-label">Top Score</div>
                            </div>
                            <div className="stat-decoration" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="leaderboard-filters">
                <div className="filter-group">
                    <label className="control-label">
                        <span className="label-icon">🌍</span>
                        Scope
                    </label>
                    <select value={scope} onChange={(e) => setScope(e.target.value)} className="filter-select">
                        <option value="global">Global (All Students)</option>
                    </select>
                </div>
                
                <div className="filter-group">
                    <label className="control-label">
                        <span className="label-icon">📅</span>
                        Timeframe
                    </label>
                    <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="filter-select">
                        <option value="all_time">All Time</option>
                        <option value="this_month">This Month</option>
                        <option value="this_week">This Week</option>
                    </select>
                </div>
            </div>

            {leaderboard.length === 0 ? (
                <div className="no-data-message premium-empty-state">
                    <div className="premium-empty-icon">
                        <div className="glow-orb"></div>
                        <span className="trophy-emoji">🏆</span>
                    </div>
                    <h3>Awaiting Champions</h3>
                    <p>The leaderboard is currently empty.<br/>Be the first to earn badges and claim the top spot!</p>
                </div>
            ) : (
                <>
                    {/* Podium Display - Top 3 */}
                    <div className="podium-container">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <div className="podium-position position-2">
                                <div className="medal">🥈</div>
                                <div className="avatar">{topThree[1].student_name.charAt(0)}</div>
                                <h3>{topThree[1].student_name}</h3>
                                <p className="score">{topThree[1].score} pts</p>
                                <p className="stats">
                                    {topThree[1].total_badges} badges • {topThree[1].rare_badges} rare
                                </p>
                                <div className="podium-bar" style={{ height: '120px' }}></div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <div className="podium-position position-1">
                                <div className="crown">👑</div>
                                <div className="medal">🥇</div>
                                <div className="avatar">{topThree[0].student_name.charAt(0)}</div>
                                <h3>{topThree[0].student_name}</h3>
                                <p className="score">{topThree[0].score} pts</p>
                                <p className="stats">
                                    {topThree[0].total_badges} badges • {topThree[0].rare_badges} rare
                                </p>
                                <div className="podium-bar" style={{ height: '160px' }}></div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <div className="podium-position position-3">
                                <div className="medal">🥉</div>
                                <div className="avatar">{topThree[2].student_name.charAt(0)}</div>
                                <h3>{topThree[2].student_name}</h3>
                                <p className="score">{topThree[2].score} pts</p>
                                <p className="stats">
                                    {topThree[2].total_badges} badges • {topThree[2].rare_badges} rare
                                </p>
                                <div className="podium-bar" style={{ height: '80px' }}></div>
                            </div>
                        )}
                    </div>

                    {/* Full Leaderboard Table */}
                    <div className="leaderboard-table-container">
                        <h2>Full Rankings</h2>
                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>Total Badges</th>
                                    <th>Rare Badges</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restOfLeaderboard.map((entry, index) => (
                                    <tr key={entry.student_id} className={index % 2 === 0 ? 'even' : 'odd'}>
                                        <td className="rank">#{index + 4}</td>
                                        <td className="student-name">
                                            <div className="student-avatar">
                                                {entry.student_name.charAt(0)}
                                            </div>
                                            {entry.student_name}
                                        </td>
                                        <td className="badges-count">{entry.total_badges}</td>
                                        <td className="rare-count">
                                            {entry.rare_badges > 0 && (
                                                <span className="rare-badge-icon">💎</span>
                                            )}
                                            {entry.rare_badges}
                                        </td>
                                        <td className="score-highlight">{entry.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaderboardPage;
