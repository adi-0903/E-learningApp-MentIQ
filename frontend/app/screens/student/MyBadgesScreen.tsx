import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Platform, TouchableOpacity } from 'react-native';
import { Text, Appbar, Searchbar, Chip } from 'react-native-paper';
import { useBadgeStore, StudentBadge } from '@/store/badgeStore';
import { BadgeCard } from '@/components/ui/BadgeCard';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type FilterType = 'all' | 'claimed' | 'unclaimed';
type SortType = 'newest' | 'rarity' | 'name';

const MyBadgesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { myBadges, fetchMyBadges, isLoading } = useBadgeStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [sort, setSort] = React.useState<SortType>('newest');

  useEffect(() => {
    fetchMyBadges();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyBadges();
    setRefreshing(false);
  };

  // Filter and sort badges
  const getFilteredBadges = () => {
    let filtered = [...myBadges];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(badge =>
        badge.badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.badge.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter
    if (filter === 'claimed') {
      filtered = filtered.filter(badge => badge.is_claimed);
    } else if (filter === 'unclaimed') {
      filtered = filtered.filter(badge => !badge.is_claimed);
    }

    // Apply sort
    if (sort === 'newest') {
      filtered.sort((a, b) => {
        if (!a.awarded_at) return 1;
        if (!b.awarded_at) return -1;
        return new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime();
      });
    } else if (sort === 'rarity') {
      const rarityOrder = { MYTHIC: 0, LEGENDARY: 1, EPIC: 2, RARE: 3, COMMON: 4 };
      filtered.sort((a, b) =>
        rarityOrder[a.badge.rarity] - rarityOrder[b.badge.rarity]
      );
    } else if (sort === 'name') {
      filtered.sort((a, b) => a.badge.name.localeCompare(b.badge.name));
    }

    return filtered;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#f0fdfa', '#ccfbf1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyGradient}
      >
        <MaterialCommunityIcons name="trophy-outline" size={80} color="#0f766e" />
        <Text style={styles.emptyTitle}>No Badges Yet</Text>
        <Text style={styles.emptyText}>
          Start earning badges by completing quizzes, maintaining streaks, and finishing courses!
        </Text>
        <Text style={styles.emptyHint}>
          💡 Tip: Complete your first quiz to earn the "First Quiz" badge
        </Text>
      </LinearGradient>
    </View>
  );

  const renderBadgeItem = ({ item }: { item: StudentBadge }) => (
    <BadgeCard
      badge={item.badge}
      isEarned={true}
      progress={item.progress}
      size="medium"
    />
  );

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
            <Text style={styles.headerTitle}>My Badges</Text>
            <Text style={styles.headerSubtitle}>Earned {myBadges.length} badges</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AvailableBadges')}>
            <View style={styles.headerActionButton}>
              <MaterialCommunityIcons name="trophy-award" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#10b981" />
          <Text style={styles.statValue}>{myBadges.filter(b => b.is_claimed).length}</Text>
          <Text style={styles.statLabel}>Claimed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="lock-outline" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{myBadges.filter(b => !b.is_claimed).length}</Text>
          <Text style={styles.statLabel}>Unclaimed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={24} color="#8b5cf6" />
          <Text style={styles.statValue}>
            {myBadges.filter(b => ['RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].includes(b.badge.rarity)).length}
          </Text>
          <Text style={styles.statLabel}>Rare+</Text>
        </View>
      </View>

      {/* Search & Filters */}
      <View style={styles.controlsContainer}>

        <View style={styles.filterRow}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={[styles.chip, filter === 'all' && styles.chipSelected]}
            textStyle={[styles.chipText, filter === 'all' && styles.chipTextSelected]}
          >
            All
          </Chip>
          <Chip
            selected={filter === 'claimed'}
            onPress={() => setFilter('claimed')}
            style={[styles.chip, filter === 'claimed' && styles.chipSelected]}
            textStyle={[styles.chipText, filter === 'claimed' && styles.chipTextSelected]}
          >
            Claimed
          </Chip>
          <Chip
            selected={filter === 'unclaimed'}
            onPress={() => setFilter('unclaimed')}
            style={[styles.chip, filter === 'unclaimed' && styles.chipSelected]}
            textStyle={[styles.chipText, filter === 'unclaimed' && styles.chipTextSelected]}
          >
            Unclaimed
          </Chip>
        </View>

        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <Chip
            selected={sort === 'newest'}
            onPress={() => setSort('newest')}
            style={[styles.chip, sort === 'newest' && styles.chipSelected]}
            textStyle={[styles.chipText, sort === 'newest' && styles.chipTextSelected]}
          >
            Newest
          </Chip>
          <Chip
            selected={sort === 'rarity'}
            onPress={() => setSort('rarity')}
            style={[styles.chip, sort === 'rarity' && styles.chipSelected]}
            textStyle={[styles.chipText, sort === 'rarity' && styles.chipTextSelected]}
          >
            Rarity
          </Chip>
          <Chip
            selected={sort === 'name'}
            onPress={() => setSort('name')}
            style={[styles.chip, sort === 'name' && styles.chipSelected]}
            textStyle={[styles.chipText, sort === 'name' && styles.chipTextSelected]}
          >
            Name
          </Chip>
        </View>
      </View>

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredBadges}
          renderItem={renderBadgeItem}
          keyExtractor={(item) => item.id}
          numColumns={Platform.OS === 'web' ? 4 : 3}
          contentContainerStyle={styles.badgeGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />
          }
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  searchbar: {
    borderRadius: BorderRadius.l,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    fontSize: 14,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#f1f5f9',
    marginRight: 0,
  },
  chipSelected: {
    backgroundColor: '#0f766e',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#fff',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  badgeGrid: {
    padding: 8,
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
    borderColor: '#0f766e',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 12,
    color: '#0f766e',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default MyBadgesScreen;
