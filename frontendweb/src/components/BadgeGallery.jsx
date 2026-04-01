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

    return (
        <div className="badge-gallery-container">
            <div className="badge-gallery-header">
                <h1>🏆 My Badge Collection</h1>
                <p className="total-badges">
                    Total Earned: <strong>{badges.length}</strong> badges
                </p>
            </div>

            {/* Filters & Sorting */}
            <div className="badge-controls">
                <div className="filter-section">
                    <label>Filter by Rarity:</label>
                    <div className="filter-buttons">
                        <button 
                            className={filter === 'all' ? 'active' : ''}
                            onClick={() => setFilter('all')}
                        >
                            All ({rarityCounts.all})
                        </button>
                        <button 
                            className={filter === 'COMMON' ? 'active' : ''}
                            onClick={() => setFilter('COMMON')}
                        >
                            🥉 Common ({rarityCounts.COMMON})
                        </button>
                        <button 
                            className={filter === 'RARE' ? 'active' : ''}
                            onClick={() => setFilter('RARE')}
                        >
                            🥈 Rare ({rarityCounts.RARE})
                        </button>
                        <button 
                            className={filter === 'EPIC' ? 'active' : ''}
                            onClick={() => setFilter('EPIC')}
                        >
                            🥇 Epic ({rarityCounts.EPIC})
                        </button>
                        <button 
                            className={filter === 'LEGENDARY' ? 'active' : ''}
                            onClick={() => setFilter('LEGENDARY')}
                        >
                            💎 Legendary ({rarityCounts.LEGENDARY})
                        </button>
                        <button 
                            className={filter === 'MYTHIC' ? 'active' : ''}
                            onClick={() => setFilter('MYTHIC')}
                        >
                            🏆 Mythic ({rarityCounts.MYTHIC})
                        </button>
                    </div>
                </div>

                <div className="sort-section">
                    <label>Sort by:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="rarity">Rarity (High to Low)</option>
                    </select>
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
                        <h3>🎯 No badges yet!</h3>
                        <p>Complete quizzes, maintain streaks, and finish courses to earn badges.</p>
                        <button onClick={() => window.location.href = '/courses'}>
                            Start Learning
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeGallery;
