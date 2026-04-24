import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import BadgeCard from './BadgeCard';
import './BadgeGallery.css';

/**
 * BadgeGallery Component - Displays all earned badges with filters
 */
const BadgeGallery = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            
            const earnedRes = await axios.get(`${API_URL}progress/my-badges/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => ({ data: [] }));

            const extractArray = (res) => {
                if (!res || !res.data) return [];
                if (Array.isArray(res.data)) return res.data;
                if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
                if (Array.isArray(res.data.results)) return res.data.results;
                return [];
            };

            const earnedBadgesRaw = extractArray(earnedRes);

            const processedBadges = earnedBadgesRaw.map(earned => ({
                ...earned,
                is_earned: true
            }));
            
            setBadges(processedBadges);
            setError(null);
        } catch (err) {
            console.error('Error fetching badges:', err);
            setError('Failed to load badges. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter badges by rarity
    const filteredBadges = badges.filter(badge => {
        if (filter === 'all') return true;
        return badge.badge?.rarity === filter;
    });

    // Sort badges
    const sortedBadges = [...filteredBadges].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.awarded_at) - new Date(a.awarded_at);
            case 'oldest':
                return new Date(a.awarded_at) - new Date(b.awarded_at);
            case 'rarity':
                const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
                return rarityOrder[b.badge?.rarity] - rarityOrder[a.badge?.rarity];
            default:
                return 0;
        }
    });

    // Get badge counts by rarity
    const getRarityCounts = () => {
        const counts = { all: badges.length, COMMON: 0, RARE: 0, EPIC: 0, LEGENDARY: 0, MYTHIC: 0 };
        badges.forEach(badge => {
            if (badge.badge?.rarity && counts[badge.badge.rarity] !== undefined) {
                counts[badge.badge.rarity]++;
            }
        });
        return counts;
    };

    const rarityCounts = getRarityCounts();

    if (loading) {
        return (
            <div className="badge-gallery-loading">
                <div className="spinner"></div>
                <p>Loading your badge collection...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="badge-gallery-error">
                <h3>⚠️ Oops!</h3>
                <p>{error}</p>
                <button onClick={fetchBadges}>Try Again</button>
            </div>
        );
    }

    // Calculate achievement statistics
    const getAchievementStats = () => {
        const totalBadges = badges.length;
        const rarestBadge = badges.reduce((rarest, badge) => {
            const rarityOrder = { MYTHIC: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
            const currentRarity = rarityOrder[badge.badge?.rarity] || 0;
            const rarestRarity = rarityOrder[rarest?.badge?.rarity] || 0;
            return currentRarity > rarestRarity ? badge : rarest;
        }, null);

        const recentBadge = badges[0];
        
        return { totalBadges, rarestBadge, recentBadge };
    };

    const stats = getAchievementStats();

    return (
        <div className="badge-gallery-container">
            {/* Animated Background Particles */}
            <div className="particles-container">
                {[...Array(20)].map((_, i) => (
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
                    <h1 className="hero-title">My Badge Collection</h1>
                    <p className="hero-subtitle">Showcase your achievements and track your learning journey</p>
                    
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card stat-total">
                            <div className="stat-icon">🎖️</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.totalBadges}</div>
                                <div className="stat-label">Total Badges</div>
                            </div>
                            <div className="stat-decoration" />
                        </div>
                        <div className="stat-card stat-rare">
                            <div className="stat-icon">💎</div>
                            <div className="stat-content">
                                <div className="stat-value">{rarityCounts.RARE + rarityCounts.EPIC + rarityCounts.LEGENDARY + rarityCounts.MYTHIC}</div>
                                <div className="stat-label">Rare+ Badges</div>
                            </div>
                            <div className="stat-decoration" />
                        </div>
                        <div className="stat-card stat-completion">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <div className="stat-value">{rarityCounts.LEGENDARY + rarityCounts.MYTHIC}</div>
                                <div className="stat-label">Premium Badges</div>
                            </div>
                            <div className="stat-decoration" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Rarity Progress Tracker */}
            <div className="rarity-tracker">
                <h2 className="tracker-title">Rarity Progress</h2>
                <div className="rarity-bars">
                    {[
                        { rarity: 'COMMON', label: 'Common', icon: '🥉', color: '#CD7F32' },
                        { rarity: 'RARE', label: 'Rare', icon: '🥈', color: '#C0C0C0' },
                        { rarity: 'EPIC', label: 'Epic', icon: '🥇', color: '#FFD700' },
                        { rarity: 'LEGENDARY', label: 'Legendary', icon: '💎', color: '#B9F2FF' },
                        { rarity: 'MYTHIC', label: 'Mythic', icon: '🏆', color: '#E5EEC1' },
                    ].map((r) => (
                        <div key={r.rarity} className="rarity-bar-item">
                            <div className="rarity-bar-header">
                                <span className="rarity-icon">{r.icon}</span>
                                <span className="rarity-label">{r.label}</span>
                                <span className="rarity-count">{rarityCounts[r.rarity]}</span>
                            </div>
                            <div className="rarity-progress-bg">
                                <div 
                                    className="rarity-progress-fill" 
                                    style={{ 
                                        width: `${Math.min((rarityCounts[r.rarity] / Math.max(rarityCounts[r.rarity], 1)) * 100, 100)}%`,
                                        background: `linear-gradient(90deg, ${r.color} 0%, ${r.color}88 100%)`,
                                        boxShadow: `0 0 20px ${r.color}66`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters & Sorting */}
            <div className="badge-controls">
                <div className="filter-section">
                    <label className="control-label">
                        <span className="label-icon">🔍</span>
                        Filter by Rarity
                    </label>
                    <div className="filter-buttons">
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            <span className="btn-icon">📋</span>
                            <span className="btn-text">All</span>
                            <span className="btn-count">{rarityCounts.all}</span>
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'COMMON' ? 'active' : ''}`}
                            onClick={() => setFilter('COMMON')}
                        >
                            <span className="btn-icon">🥉</span>
                            <span className="btn-text">Common</span>
                            <span className="btn-count">{rarityCounts.COMMON}</span>
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'RARE' ? 'active' : ''}`}
                            onClick={() => setFilter('RARE')}
                        >
                            <span className="btn-icon">🥈</span>
                            <span className="btn-text">Rare</span>
                            <span className="btn-count">{rarityCounts.RARE}</span>
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'EPIC' ? 'active' : ''}`}
                            onClick={() => setFilter('EPIC')}
                        >
                            <span className="btn-icon">🥇</span>
                            <span className="btn-text">Epic</span>
                            <span className="btn-count">{rarityCounts.EPIC}</span>
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'LEGENDARY' ? 'active' : ''}`}
                            onClick={() => setFilter('LEGENDARY')}
                        >
                            <span className="btn-icon">💎</span>
                            <span className="btn-text">Legendary</span>
                            <span className="btn-count">{rarityCounts.LEGENDARY}</span>
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'MYTHIC' ? 'active' : ''}`}
                            onClick={() => setFilter('MYTHIC')}
                        >
                            <span className="btn-icon">🏆</span>
                            <span className="btn-text">Mythic</span>
                            <span className="btn-count">{rarityCounts.MYTHIC}</span>
                        </button>
                    </div>
                </div>

                <div className="sort-section">
                    <label className="control-label">
                        <span className="label-icon">⚡</span>
                        Sort by
                    </label>
                    <div className="sort-select-wrapper">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                            <option value="newest">🆕 Newest First</option>
                            <option value="oldest">📅 Oldest First</option>
                            <option value="rarity">💫 Rarity (High to Low)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div className="badges-grid">
                {sortedBadges.length > 0 ? (
                    sortedBadges.map((badge, index) => (
                        <BadgeCard 
                            key={badge.id || index} 
                            badge={badge}
                            earned={badge.is_earned || !!badge.awarded_at}
                        />
                    ))
                ) : (
                    <div className="no-badges-message">
                        <div className="empty-state-illustration">
                            <div className="empty-badge">
                                <span className="empty-icon">🏅</span>
                                <div className="empty-sparkles">
                                    {[...Array(6)].map((_, i) => (
                                        <span key={i} className="sparkle" style={{ 
                                            left: `${20 + Math.random() * 60}%`,
                                            top: `${20 + Math.random() * 60}%`,
                                            animationDelay: `${i * 0.2}s`
                                        }}>✨</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <h3 className="empty-title">Your Badge Journey Awaits!</h3>
                        <p className="empty-description">
                            Embark on your learning adventure! Complete quizzes, maintain streaks, 
                            and finish courses to unlock amazing badges and showcase your achievements.
                        </p>
                        <div className="empty-actions">
                            <button className="cta-primary" onClick={() => window.location.href = '/courses'}>
                                <span>🚀</span>
                                <span>Start Learning</span>
                            </button>
                            <button className="cta-secondary" onClick={() => window.location.href = '/dashboard'}>
                                <span>📊</span>
                                <span>View Dashboard</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeGallery;
