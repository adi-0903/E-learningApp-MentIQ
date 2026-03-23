import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Text, Surface, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useParentStore } from '@/store/parentStore';
import { Colors, Typography, Spacing, AppShadows, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const ParentLinkChildScreen = ({ navigation }: any) => {
  const [studentId, setStudentId] = useState('');
  const { requestLink, linkRequests, fetchLinkRequests, isLoading } = useParentStore();

  useEffect(() => {
    fetchLinkRequests();
  }, []);

  const handleRequest = async () => {
    if (studentId.length < 5) {
      Alert.alert('Invalid ID', 'Please enter a valid student ID.');
      return;
    }

    const success = await requestLink(studentId);
    if (success) {
      Alert.alert('Success', 'Link request sent! Your child will need to approve it from their profile.');
      setStudentId('');
    } else {
      Alert.alert('Error', 'Could not find that student. Please check the ID and try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return Colors.light.success;
      case 'pending': return Colors.light.warning;
      case 'rejected': return Colors.light.error;
      default: return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'check-circle';
      case 'pending': return 'clock-outline';
      case 'rejected': return 'close-circle';
      default: return 'help-circle-outline';
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <Surface style={[styles.requestCard, AppShadows.small]}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestTitle}>Student ID: {item.student_id || 'N/A'}</Text>
        <Text style={styles.requestDate}>Sent on: {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
        <MaterialCommunityIcons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
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
          <Text style={styles.headerTitle}>Link a Child</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Surface style={styles.inputCard} elevation={2}>
          <Text style={styles.inputLabel}>Enter Child's Student ID</Text>
          <Text style={styles.inputSub}>Ask your child for their 8-digit unique ID shown on their profile.</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="account-search-outline" size={24} color="#94A3B8" />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 12600001"
              value={studentId}
              onChangeText={setStudentId}
              keyboardType="number-pad"
              maxLength={8}
            />
          </View>
          <TouchableOpacity 
            style={[styles.linkButton, (isLoading || !studentId) && styles.disabledButton]}
            onPress={handleRequest}
            disabled={isLoading || !studentId}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.linkButtonText}>Send Request</Text>
            )}
          </TouchableOpacity>
        </Surface>

        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {linkRequests.length === 0 ? (
            <View style={styles.emptyRequests}>
              <MaterialCommunityIcons name="history" size={48} color="#E2E8F0" />
              <Text style={styles.emptyRequestsText}>No request history</Text>
            </View>
          ) : (
            <FlatList
              data={linkRequests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
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
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginTop: -60,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  inputSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 24,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  linkButton: {
    backgroundColor: Colors.light.primary,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppShadows.small,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    elevation: 0,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  requestsSection: {
    flex: 1,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 24,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  requestDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  emptyRequests: {
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  emptyRequestsText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

export default ParentLinkChildScreen;
