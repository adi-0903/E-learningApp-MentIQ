import React, { useState } from 'react';
import './BadgeCard.css';

/**
 * BadgeCard Component - Displays individual badge with rarity styling
 */
const BadgeCard = ({ badge, earned = false, showTooltip = true }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getRarityGradient = (rarity) => {
        const gradients = {
            COMMON: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
            RARE: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
            EPIC: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
            LEGENDARY: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 100%)',
            MYTHIC: 'linear-gradient(135deg, #E5EEC1 0%, #6B8E23 100%)',
        };
        return gradients[rarity] || gradients.COMMON;
    };

    const getRarityBorder = (rarity) => {
        const borders = {
            COMMON: '3px solid #CD7F32',
            RARE: '3px solid #C0C0C0',
            EPIC: '3px solid #FFD700',
            LEGENDARY: '3px solid #B9F2FF',
            MYTHIC: '3px solid #E5EEC1',
        };
        return borders[rarity] || borders.COMMON;
    };

    const getRarityIcon = (rarity) => {
        const icons = {
            COMMON: '🥉',
            RARE: '🥈',
            EPIC: '🥇',
            LEGENDARY: '💎',
            MYTHIC: '🏆',
        };
        return icons[rarity] || '🏅';
    };

    if (!badge) return null;

    // Handle both API response formats
    const badgeData = badge.badge || badge;
    const isEarned = earned || (badge.is_claimed !== undefined ? badge.is_claimed : false);

    return (
        <div
            className="badge-card"
            style={{ border: getRarityBorder(badgeData.rarity) }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Rarity Badge Icon */}
            <div className="badge-icon-container">
                <img
                    src={badgeData.icon_url || '/Qbit.png'}
                    alt={badgeData.name}
                    className="badge-icon"
                />
                <div className="rarity-indicator" style={{ background: getRarityGradient(badgeData.rarity) }}>
                    {getRarityIcon(badgeData.rarity)}
                </div>
            </div>

            {/* Badge Info */}
            <div className="badge-info">
                <h3 className="badge-name">{badgeData.name}</h3>
                <p className="badge-rarity">{badgeData.rarity_display || badgeData.rarity}</p>
                
                {showTooltip && isHovered && (
                    <div className="badge-tooltip">
                        <p className="badge-description">{badgeData.description}</p>
                        <div className="badge-criteria">
                            <strong>Criteria:</strong> {badgeData.criteria_type?.replace(/_/g, ' ')} 
                            {' • '} Threshold: {badgeData.criteria_threshold}
                        </div>
                        {badgeData.total_awarded !== undefined && (
                            <div className="badge-stats">
                                <strong>Awarded:</strong> {badgeData.total_awarded} times
                            </div>
                        )}
                    </div>
                )}

                {isEarned && (
                    <div className="earned-indicator">
                        <span>✅ Earned</span>
                        {badge.awarded_at && (
                            <span className="earned-date">
                                on {new Date(badge.awarded_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}

                {!isEarned && (
                    <div className="progress-indicator">
                        <span>🔒 Locked</span>
                        {badge.progress !== undefined && (
                            <span className="progress-text">
                                Progress: {badge.progress}/{badge.criteria_threshold}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Certificate Link (if earned) */}
            {isEarned && badge.certificate_url && (
                <a
                    href={badge.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="certificate-link"
                >
                    📜 View Certificate
                </a>
            )}
        </div>
    );
};

export default BadgeCard;
