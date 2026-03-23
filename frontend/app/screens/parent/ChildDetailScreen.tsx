import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { Text, Surface, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useParentStore } from '@/store/parentStore';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const ChildDetailScreen = ({ route, navigation }: any) => {
  const { studentId, name } = route.params;
  const { fetchChildReports, isLoading } = useParentStore();
  const [reports, setReports] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    setRefreshing(true);
    const data = await fetchChildReports(studentId);
    setReports(data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadReports();
  }, [studentId]);

  const renderReportItem = ({ item }: { item: any }) => (
    <Surface style={[styles.reportCard, AppShadows.small]}>
      <TouchableOpacity 
        style={styles.reportHeader}
        // onPress={() => navigation.navigate('ReportDetail', { report: item })}
      >
        <View style={styles.calendarIcon}>
          <MaterialCommunityIcons name="calendar-range" size={24} color={Colors.light.primary} />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>Weekly Report</Text>
          <Text style={styles.reportDate}>{new Date(item.week_start_date).toLocaleDateString()} - {new Date(item.week_end_date).toLocaleDateString()}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
      </TouchableOpacity>

      <Divider style={styles.divider} />

      <View style={styles.reportSummary}>
        <Text style={styles.aiSummary} numberOfLines={3}>{item.ai_summary}</Text>
      </View>

      <View style={styles.quickStatsGrid}>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{item.average_quiz_score}%</Text>
          <Text style={styles.miniStatLabel}>Score</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{item.attendance_rate}%</Text>
          <Text style={styles.miniStatLabel}>Atten.</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{item.badges_earned}</Text>
          <Text style={styles.miniStatLabel}>Badges</Text>
        </View>
        <View style={styles.miniStat}>
          <Text style={styles.miniStatValue}>{Math.round(item.time_spent_seconds / 3600)}h</Text>
          <Text style={styles.miniStatLabel}>Study</Text>
        </View>
      </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primaryDark, Colors.light.primary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}'s Progress</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Reports</Text>
          <Text style={styles.sectionCount}>{reports.length} available</Text>
        </View>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
        ) : reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={80} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptySub}>The first report for {name} will be generated next Monday.</Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadReports} colors={[Colors.light.primary]} />
            }
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
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sectionCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 24,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 16,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  reportDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    backgroundColor: '#F1F5F9',
    height: 1,
  },
  reportSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  aiSummary: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  miniStatLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
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
    paddingHorizontal: 32,
  },
});

export default ChildDetailScreen;
