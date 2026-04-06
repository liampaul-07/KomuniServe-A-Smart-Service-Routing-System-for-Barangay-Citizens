import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ScrollView, Platform, StatusBar
} from 'react-native';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#D32F2F', bg: '#FFEBEE', label: '🚨 High Priority' },
  MEDIUM: { color: '#F57C00', bg: '#FFF3E0', label: '⚠️ Medium Priority' },
  LOW:    { color: '#388E3C', bg: '#E8F5E9', label: '✅ Low Priority' },
};

const STATUS_COLORS = {
  Pending:  { bg: '#FFF8E1', text: '#F9A825' },
  Approved: { bg: '#E8F5E9', text: '#388E3C' },
  Rejected: { bg: '#FFEBEE', text: '#D32F2F' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function RequestDetailScreen({ route, navigation }) {
  const { request } = route.params;
  const [status, setStatus] = useState(request.status);

  const priority = PRIORITY_CONFIG[request.priority];
  const statusColor = STATUS_COLORS[status];

  const handleApprove = () => {
    Alert.alert('Approve Request', `Approve ${request.userName}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          // TODO: await supabase.from('requests').update({ status: 'Approved' }).eq('id', request.id);
          setStatus('Approved');
          Alert.alert('Done', 'Request has been approved.');
        }
      }
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Request', `Reject ${request.userName}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          // TODO: await supabase.from('requests').update({ status: 'Rejected' }).eq('id', request.id);
          setStatus('Rejected');
          Alert.alert('Done', 'Request has been rejected.');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Resident Name */}
        <Text style={styles.nameLabel}>Resident</Text>
        <Text style={styles.nameText}>{request.userName}</Text>

        {/* Status + Priority Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>{status}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Row label="Category" value={request.category} />
          <Row label="Type" value={request.subType.replace(/_/g, ' ')} />
          <Row label="Facility" value={request.facility} />
          <Row label="Action" value={request.action.replace(/_/g, ' ')} />
          <Row label="Submitted" value={formatDate(request.timestamp)} />
        </View>

        {/* Description if present */}
        {request.description !== '' && (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>Resident's Description</Text>
            <Text style={styles.descText}>{request.description}</Text>
          </View>
        )}

        {/* Action Buttons — only show if still Pending */}
        {status === 'Pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {status !== 'Pending' && (
          <View style={[styles.resolvedBanner, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.resolvedText, { color: statusColor.text }]}>
              This request has been {status.toLowerCase()}.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { color: '#999', fontSize: 14 },
  value: { color: '#333', fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 12,
    backgroundColor: '#0047AB',
  },
  backBtn: { padding: 4 },
  backBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  headerTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  content: { padding: 20, paddingBottom: 40 },
  nameLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: 8 },
  nameText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontWeight: 'bold', fontSize: 13 },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  descCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  descLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  descText: { fontSize: 15, color: '#333', lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  approveBtn: {
    flex: 1, backgroundColor: '#388E3C', padding: 16,
    borderRadius: 14, alignItems: 'center',
  },
  approveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  rejectBtn: {
    flex: 1, borderWidth: 2, borderColor: '#D32F2F', padding: 16,
    borderRadius: 14, alignItems: 'center',
  },
  rejectBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },
  resolvedBanner: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  resolvedText: { fontWeight: 'bold', fontSize: 15 },
});