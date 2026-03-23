import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList, Image } from 'react-native';
import { Text, Surface, Avatar, Divider, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useParentStore } from '@/store/parentStore';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const ParentLinkApprovalScreen = ({ navigation }: any) => {
  const { pendingParentRequests, fetchPendingParentRequests, respondToParentRequest, isLoading } = useParentStore();
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingParentRequests();
  }, []);

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    setProcessingId(requestId);
    const success = await respondToParentRequest(requestId, action);
    setProcessingId(null);
    if (success) {
      Alert.alert('Success', `Link request ${action}ed.`);
    } else {
      Alert.alert('Error', 'Failed to process request. Please try again.');
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <Surface style={[styles.requestCard, AppShadows.medium]}>
      <View style={styles.requestHeader}>
        <Avatar.Text 
          size={50} 
          label={item.parent_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()} 
          style={{ backgroundColor: Colors.light.primaryLight }}
          labelStyle={{ color: Colors.light.primary, fontWeight: 'bold' }}
        />
        <View style={styles.parentInfo}>
          <Text style={styles.parentName}>{item.parent_name}</Text>
          <Text style={styles.parentEmail}>{item.parent_email}</Text>
        </View>
      </View>

      <Text style={styles.requestNote}>
        This user is requesting to link with your account to see your learning progress and weekly reports.
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleAction(item.id, 'reject')}
          disabled={processingId !== null}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#F43F5E" />
          ) : (
            <>
              <MaterialCommunityIcons name="close" size={20} color="#F43F5E" />
              <Text style={styles.rejectText}>Decline</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleAction(item.id, 'approve')}
          disabled={processingId !== null}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={styles.approveText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Parent Access</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Access Requests</Text>
          <Text style={styles.sectionSubtitle}>Manage who can monitor your learning progress</Text>
        </View>

        {isLoading && pendingParentRequests.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
        ) : pendingParentRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-check-outline" size={100} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>Secure & Private</Text>
            <Text style={styles.emptySub}>No pending access requests. You control who sees your data.</Text>
          </View>
        ) : (
          <FlatList
            data={pendingParentRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id.toString()}
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 24,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  parentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  parentEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  requestNote: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  approveButton: {
    backgroundColor: Colors.light.primary,
    ...AppShadows.small,
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  approveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  rejectText: {
    color: '#F43F5E',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 24,
  },
  emptySub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});

export default ParentLinkApprovalScreen;
