import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Image, Platform } from 'react-native';
import { Text, Appbar, Chip, Avatar } from 'react-native-paper';
import { useBadgeStore, LeaderboardEntry } from '@/store/badgeStore';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ScopeType = 'global' | 'course' | 'school';

const LeaderboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { leaderboard, fetchLeaderboard, isLoading } = useBadgeStore();
  const [scope, setScope] = React.useState<ScopeType>('global');
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchLeaderboard(scope);
  }, [scope]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard(scope);
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: 'trophy', color: '#fbbf24', size: 32 };
      case 2:
        return { icon: 'trophy', color: '#94a3b8', size: 28 };
      case 3:
        return { icon: 'trophy', color: '#b45309', size: 28 };
      default:
        return { icon: 'numeric', color: '#64748b', size: 20 };
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rankConfig = getRankIcon(item.rank);
    const isTopThree = item.rank <= 3;

    return (
      <View style={[
        styles.leaderboardItem,
        isTopThree && styles.topThreeItem,
        { backgroundColor: isTopThree ? `${rankConfig.color}10` : '#fff' }
      ]}>
        {/* Rank */}
        <View style={[
          styles.rankContainer,
          isTopThree && { backgroundColor: rankConfig.color }
        ]}>
          {isTopThree ? (
            <MaterialCommunityIcons name={rankConfig.icon as any} size={rankConfig.size} color="#fff" />
          ) : (
            <Text style={styles.rankText}>{item.rank}</Text>
          )}
        </View>

        {/* Avatar & Name */}
        <View style={styles.userInfo}>
          {item.student_avatar ? (
            <Image source={{ uri: item.student_avatar }} style={styles.avatar} />
          ) : (
            <Avatar.Text 
              size={48} 
              label={item.student_name.charAt(0)} 
              style={styles.avatarPlaceholder}
            />
          )}
          <View style={styles.userInfoText}>
            <Text style={styles.userName} numberOfLines={1}>{item.student_name}</Text>
            <View style={styles.badgeStats}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#10b981" />
              <Text style={styles.badgeCount}>{item.total_badges} badges</Text>
              {item.rare_badges > 0 && (
                <>
                  <MaterialCommunityIcons name="star" size={14} color="#f59e0b" style={{ marginLeft: 8 }} />
                  <Text style={styles.rareBadgeCount}>{item.rare_badges} rare</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{item.score}</Text>
          <Text style={styles.scoreLabel}>points</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#f0fdfa', '#ccfbf1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyGradient}
      >
        <MaterialCommunityIcons name="account-group-outline" size={80} color="#0f766e" />
        <Text style={styles.emptyTitle}>No Rankings Yet</Text>
        <Text style={styles.emptyText}>
          Be the first to earn badges and climb the leaderboard!
        </Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header style={styles.appbar} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Leaderboard" subtitle="Top badge earners" />
      </Appbar.Header>

      {/* Scope Selector */}
      <View style={styles.scopeSelector}>
        <Chip
          selected={scope === 'global'}
          onPress={() => setScope('global')}
          style={[styles.scopeChip, scope === 'global' && styles.scopeChipSelected]}
          textStyle={styles.scopeChipText}
          mode="outlined"
        >
          Global
        </Chip>
        <Chip
          selected={scope === 'school'}
          onPress={() => setScope('school')}
          style={[styles.scopeChip, scope === 'school' && styles.scopeChipSelected]}
          textStyle={styles.scopeChipText}
          mode="outlined"
        >
          School
        </Chip>
        <Chip
          selected={scope === 'course'}
          onPress={() => setScope('course')}
          style={[styles.scopeChip, scope === 'course' && styles.scopeChipSelected]}
          textStyle={styles.scopeChipText}
          mode="outlined"
        >
          Course
        </Chip>
      </View>

      {/* Top 3 Podium (if data exists) */}
      {leaderboard.length >= 3 && (
        <View style={styles.podiumContainer}>
          {/* Second Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.secondPlace]}>
              {leaderboard[1]?.student_avatar ? (
                <Image source={{ uri: leaderboard[1].student_avatar }} style={styles.podiumAvatarImage} />
              ) : (
                <Avatar.Text size={56} label={leaderboard[1]?.student_name.charAt(0) || '?'} />
              )}
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1]?.student_name}</Text>
            <View style={styles.podiumScore}>
              <Text style={styles.podiumScoreValue}>{leaderboard[1]?.score}</Text>
            </View>
            <View style={[styles.podiumBase, styles.secondBase]} />
          </View>

          {/* First Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.firstPlace]}>
              {leaderboard[0]?.student_avatar ? (
                <Image source={{ uri: leaderboard[0].student_avatar }} style={styles.podiumAvatarImage} />
              ) : (
                <Avatar.Text size={64} label={leaderboard[0]?.student_name.charAt(0) || '?'} />
              )}
            </View>
            <Text style={[styles.podiumName, styles.firstPlaceName]} numberOfLines={1}>{leaderboard[0]?.student_name}</Text>
            <View style={styles.podiumScore}>
              <Text style={[styles.podiumScoreValue, styles.firstPlaceScore]}>{leaderboard[0]?.score}</Text>
            </View>
            <View style={[styles.podiumBase, styles.firstBase]} />
          </View>

          {/* Third Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.thirdPlace]}>
              {leaderboard[2]?.student_avatar ? (
                <Image source={{ uri: leaderboard[2].student_avatar }} style={styles.podiumAvatarImage} />
              ) : (
                <Avatar.Text size={56} label={leaderboard[2]?.student_name.charAt(0) || '?'} />
              )}
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2]?.student_name}</Text>
            <View style={styles.podiumScore}>
              <Text style={styles.podiumScoreValue}>{leaderboard[2]?.score}</Text>
            </View>
            <View style={[styles.podiumBase, styles.thirdBase]} />
          </View>
        </View>
      )}

      {/* Full Leaderboard List */}
      {leaderboard.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={leaderboard.slice(3)} // Skip top 3 since they're in podium
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.student_id}
          contentContainerStyle={styles.listContainer}
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
  appbar: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  scopeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  scopeChip: {
    backgroundColor: '#f1f5f9',
  },
  scopeChipSelected: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  scopeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    gap: 16,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  firstPlace: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderColor: '#fbbf24',
    borderWidth: 4,
  },
  secondPlace: {
    borderColor: '#94a3b8',
  },
  thirdPlace: {
    borderColor: '#b45309',
  },
  podiumAvatarImage: {
    width: '100%',
    height: '100%',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    maxWidth: 80,
    textAlign: 'center',
  },
  firstPlaceName: {
    fontSize: 13,
    fontWeight: '700',
  },
  podiumScore: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  podiumScoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  firstPlaceScore: {
    color: '#0f766e',
  },
  podiumBase: {
    height: 16,
    borderRadius: 8,
    marginTop: 8,
    width: 60,
  },
  firstBase: {
    height: 24,
    backgroundColor: '#fef3c7',
    width: 72,
  },
  secondBase: {
    backgroundColor: '#f1f5f9',
  },
  thirdBase: {
    backgroundColor: '#fef3c7',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: BorderRadius.l,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topThreeItem: {
    borderWidth: 2,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#0f766e',
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  badgeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  badgeCount: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  rareBadgeCount: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f766e',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LeaderboardScreen;
