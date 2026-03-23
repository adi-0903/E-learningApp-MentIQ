import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementBadge } from '@/store/badgeStore';

interface BadgeCardProps {
  badge: AchievementBadge;
  isEarned?: boolean;
  progress?: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  hideInfo?: boolean;
}

// Rarity Configuration with Premium Gradient Tokens

const getRarityConfig = (rarity: string) => {
  switch (rarity) {
    case 'MYTHIC':
      return {
        gradient: ['#fbbf24', '#b45309'], // Gold to Deep Amber
        iconColor: '#fff',
        borderColor: '#fcd34d',
        shadowColor: '#fbbf24',
      };
    case 'LEGENDARY':
      return {
        gradient: ['#a78bfa', '#5b21b6'], // Lavender to Deep Purple
        iconColor: '#fff',
        borderColor: '#c4b5fd',
        shadowColor: '#a78bfa',
      };
    case 'EPIC':
      return {
        gradient: ['#f43f5e', '#9f1239'], // Rose to Deep Crimson
        iconColor: '#fff',
        borderColor: '#fda4af',
        shadowColor: '#f43f5e',
      };
    case 'RARE':
      return {
        gradient: ['#38bdf8', '#0369a1'], // Sky to Deep Blue
        iconColor: '#fff',
        borderColor: '#7dd3fc',
        shadowColor: '#38bdf8',
      };
    default: // COMMON
      return {
        gradient: ['#94a3b8', '#334155'], // Slate Light to Dark
        iconColor: '#fff',
        borderColor: '#cbd5e1',
        shadowColor: '#94a3b8',
      };
  }
};

// Helper function to map criteria types to icons
const getIconForBadge = (criteriaType: string): any => {
  const iconMap: Record<string, any> = {
    'first_quiz': 'flash-outline',
    'quiz_novice': 'book-open-page-variant',
    'quiz_warrior': 'sword-cross',
    'streak_7days': 'fire',
    'course_completion': 'medal-outline',
    'quiz_master': 'star-face',
    'perfect_score': 'target',
    'speed_demon': 'speedometer',
    'knowledge_seeker': 'map-marker-path',
    'elite_scholar': 'crown-outline',
  };

  return iconMap[criteriaType] || 'trophy-outline';
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  isEarned = false,
  progress = 0,
  onPress,
  size = 'medium',
  hideInfo = false,
}) => {
  const config = getRarityConfig(badge.rarity);

  const getSize = () => {
    switch (size) {
      case 'small': return { width: 64, height: 64 };
      case 'large': return { width: 120, height: 120 };
      default: return { width: 90, height: 90 };
    }
  };

  const dimensions = getSize();
  const iconSize = dimensions.width * 0.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.container}
    >
      <View style={[styles.badgeWrapper, { width: dimensions.width, height: dimensions.height }]}>
        {/* Outer Glow */}
        <View style={[styles.glow, { backgroundColor: config.shadowColor, width: dimensions.width, height: dimensions.height }]} />

        <LinearGradient
          colors={config.gradient as any}
          style={[styles.badgeGradient, { borderRadius: dimensions.width / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.reflection} />

          <MaterialCommunityIcons
            name={getIconForBadge(badge.criteria_type)}
            size={iconSize}
            color="#fff"
          />

          {!isEarned && (
            <View style={styles.lockedOverlay}>
              <MaterialCommunityIcons name="lock" size={iconSize * 0.4} color="rgba(255,255,255,0.8)" />
            </View>
          )}
        </LinearGradient>
      </View>

      {!hideInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.badgeName} numberOfLines={2}>{badge.name}</Text>
          <Text style={[styles.badgeRarity, { color: config.gradient[0] }]}>
            {badge.rarity_display}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 12,
  },
  badgeWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
    transform: [{ scale: 1.1 }],
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reflection: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: '150%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ rotate: '45deg' }],
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '35%',
    height: '35%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  infoContainer: {
    marginTop: 10,
    alignItems: 'center',
    maxWidth: 100,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeRarity: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.8,
  },
});
