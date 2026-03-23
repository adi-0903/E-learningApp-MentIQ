import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, Appbar, Chip } from 'react-native-paper';
import { useBadgeStore, AchievementBadge } from '@/store/badgeStore';
import { BadgeCard } from '@/components/ui/BadgeCard';
import { Colors, BorderRadius } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type RarityFilter = 'all' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

const AvailableBadgesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { availableBadges, fetchAvailableBadges, isLoading } = useBadgeStore();
  const [rarityFilter, setRarityFilter] = React.useState<RarityFilter>('all');

  useEffect(() => {
    fetchAvailableBadges();
  }, []);

  // Filter and sort badges by rarity
  const getFilteredBadges = () => {
    let filtered = [...availableBadges];
    
    // rarity sequence: common, rare, epic, legendary, mythic
    const rarityOrder = {
      'COMMON': 1,
      'RARE': 2,
      'EPIC': 3,
      'LEGENDARY': 4,
      'MYTHIC': 5
    };

    // Apply sort
    filtered.sort((a, b) => {
      return (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0) - 
             (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0);
    });

    if (rarityFilter === 'all') return filtered;
    return filtered.filter(badge => badge.rarity === rarityFilter);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#fef3c7', '#fde68a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyGradient}
      >
        <MaterialCommunityIcons name="information-outline" size={60} color="#92400e" />
        <Text style={styles.emptyTitle}>Badges Loading...</Text>
        <Text style={styles.emptyText}>
          Discover all the awesome badges you can earn!
        </Text>
      </LinearGradient>
    </View>
  );

  const renderBadgeItem = ({ item }: { item: AchievementBadge }) => (
    <View style={styles.badgeListCard}>
      <BadgeCard
        badge={item}
        isEarned={false}
        progress={0}
        size="small"
        hideInfo={true}
      />
      <View style={styles.badgeDetails}>
        <View style={styles.badgeHeaderRow}>
          <Text style={styles.badgeNameText} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.rarityLabel, { backgroundColor: getRarityColor(item.rarity) + '15' }]}>
            <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>{item.rarity_display}</Text>
          </View>
        </View>
        <Text style={styles.badgeDescriptionText} numberOfLines={3}>{item.description}</Text>
        <View style={styles.howToEarnRow}>
          <MaterialCommunityIcons name="target" size={14} color="#0f766e" />
          <Text style={styles.howToEarnText}>Challenge: {formatGoalText(item.criteria_type, item.criteria_threshold)}</Text>
        </View>
      </View>
    </View>
  );

  const formatGoalText = (type: string, threshold: number) => {
    const formatted = type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    switch (type) {
      case 'quiz_mastery': return `Complete ${threshold} quizzes`;
      case 'streak_master': return `Maintain a ${threshold}-day streak`;
      case 'course_completion': return `Finish ${threshold} full courses`;
      case 'quiz_novice': return `Pass ${threshold} quizzes (70%+)`;
      case 'quiz_warrior': return `Pass ${threshold} quizzes (85%+)`;
      case 'quiz_master': return `Pass ${threshold} quizzes (90%+)`;
      case 'perfect_score': return `Get 100% on ${threshold} quizzes`;
      case 'speed_demon': return `Under-time perfect score ${threshold} times`;
      case 'knowledge_seeker': return `Complete ${threshold} modules`;
      case 'elite_scholar': return `Collect ${threshold} expert badges`;
      default: return `Goal: ${threshold} ${formatted}`;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'MYTHIC': return '#d97706'; // Amber 600
      case 'LEGENDARY': return '#7c3aed'; // Violet 600
      case 'EPIC': return '#e11d48'; // Rose 600
      case 'RARE': return '#0284c7'; // Sky 600
      default: return '#475569'; // Slate 600
    }
  };

  const filteredBadges = getFilteredBadges();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Available Badges</Text>
            <Text style={styles.headerSubtitle}>{availableBadges.length} badges to earn</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="lightbulb-on" size={20} color="#f59e0b" />
        <Text style={styles.infoText}>
          Earn badges by completing challenges and showcasing your achievements!
        </Text>
      </View>

      {/* Rarity Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: 'All', count: availableBadges.length },
            { key: 'COMMON', label: 'Common', count: availableBadges.filter(b => b.rarity === 'COMMON').length },
            { key: 'RARE', label: 'Rare', count: availableBadges.filter(b => b.rarity === 'RARE').length },
            { key: 'EPIC', label: 'Epic', count: availableBadges.filter(b => b.rarity === 'EPIC').length },
            { key: 'LEGENDARY', label: 'Legendary', count: availableBadges.filter(b => b.rarity === 'LEGENDARY').length },
            { key: 'MYTHIC', label: 'Mythic', count: availableBadges.filter(b => b.rarity === 'MYTHIC').length },
          ]}
          renderItem={({ item }) => (
            <Chip
              selected={rarityFilter === (item.key as RarityFilter)}
              onPress={() => setRarityFilter(item.key as RarityFilter)}
              style={[
                styles.chip,
                rarityFilter === item.key && styles.chipSelected,
              ]}
              textStyle={[
                styles.chipText,
                rarityFilter === item.key && styles.chipTextSelected,
              ]}
              mode="outlined"
            >
              {item.label} ({item.count})
            </Chip>
          )}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Badge Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading badges...</Text>
        </View>
      ) : filteredBadges.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredBadges}
          renderItem={renderBadgeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.badgeList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    margin: 16,
    borderRadius: BorderRadius.l,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  infoText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    flex: 1,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterList: {
    paddingHorizontal: 16,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#fff',
  },
  badgeList: {
    padding: 16,
    gap: 16,
  },
  badgeListCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.l,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  badgeDetails: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 4,
  },
  badgeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  badgeNameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  rarityLabel: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgeDescriptionText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  howToEarnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  howToEarnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f766e',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyGradient: {
    borderRadius: BorderRadius.xl,
    padding: 40,
    alignItems: 'center',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#78350f',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AvailableBadgesScreen;
