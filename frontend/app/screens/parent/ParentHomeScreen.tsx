import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { Text, ActivityIndicator, Surface, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useParentStore } from '@/store/parentStore';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const ParentHomeScreen = ({ navigation }: any) => {
  const { children, isLoading, fetchChildren, profile, fetchProfile } = useParentStore();

  useEffect(() => {
    fetchProfile();
    fetchChildren();
  }, []);

  const renderChildCard = ({ item }: { item: any }) => (
    <Surface style={[styles.childCard, AppShadows.medium]}>
      <TouchableOpacity 
        style={styles.childCardContent}
        onPress={() => navigation.navigate('ChildDetail', { studentId: item.id, name: item.name })}
      >
        <View style={styles.childHeader}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.childAvatar} />
          ) : (
            <Avatar.Text 
              size={50} 
              label={item.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()} 
              style={{ backgroundColor: Colors.light.primaryLight }}
            />
          )}
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{item.name}</Text>
            <Text style={styles.childId}>ID: {item.student_id}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
        </View>

        {item.latest_stats ? (
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.latest_stats.average_quiz_score}%</Text>
              <Text style={styles.statLabel}>Avg. Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.latest_stats.attendance_rate}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.latest_stats.badges_earned}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noStatsContainer}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#64748B" />
            <Text style={styles.noStatsText}>No weekly report generated yet</Text>
          </View>
        )}
      </TouchableOpacity>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Parent Dashboard</Text>
            <Text style={styles.parentName}>Hello, {profile?.user_name || 'Parent'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('LinkChild')}>
            <View style={styles.addButton}>
              <MaterialCommunityIcons name="account-plus-outline" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <Surface style={styles.summaryCard} elevation={1}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{children.length}</Text>
            <Text style={styles.summaryLabel}>Children Linked</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={Colors.light.primary} />
            <Text style={styles.summaryLabel}>Next Report: Monday</Text>
          </View>
        </Surface>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Children</Text>
          <TouchableOpacity onPress={fetchChildren}>
            <MaterialCommunityIcons name="refresh" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {isLoading && children.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
        ) : children.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={80} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>No children linked yet</Text>
            <Text style={styles.emptySub}>Connect with your child's student account to monitor their progress.</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('LinkChild')}
            >
              <Text style={styles.emptyButtonText}>Link a Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={children}
            renderItem={renderChildCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  parentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    position: 'absolute',
    bottom: -40,
    left: 24,
    right: 24,
    ...AppShadows.medium,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  listContainer: {
    paddingBottom: 24,
  },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  childCardContent: {
    padding: 20,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
  },
  childInfo: {
    flex: 1,
    marginLeft: 16,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  childId: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  noStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    gap: 8,
  },
  noStatsText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 24,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 32,
    ...AppShadows.small,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ParentHomeScreen;
