import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Platform, StatusBar
} from 'react-native';

// TODO: Replace with Supabase fetch:
// const { data } = await supabase
//   .from('appointments')
//   .select(`
//     *,
//     requests (
//       service_requested,
//       priority,
//       description,
//       status,
//       submitted_at
//     )
//   `)
//   .eq('requests.user_id', currentUser.id)
//   .order('created_at', { ascending: false });
const MOCK_APPOINTMENTS = [
  {
    id: 'a1',
    service:    'Medical',
    subType:    'Physical',
    facility:   'Barangay Health Center',
    date:       'Wednesday, April 9, 2026',
    time:       '9:00 AM',
    priority:   'HIGH',
    status:     'Pending',
    submittedAt: '2026-04-06T08:00:00.000Z',
  },
  {
    id: 'a2',
    service:    'Documents',
    subType:    'Clearance',
    facility:   'Barangay Hall — Records Office',
    date:       'Thursday, April 10, 2026',
    time:       '10:00 AM',
    priority:   'LOW',
    status:     'Approved',
    submittedAt: '2026-04-05T09:00:00.000Z',
  },
  {
    id: 'a3',
    service:    'Complaint',
    subType:    'Noise',
    facility:   'Barangay Hall — Lupon Tagapamayapa',
    date:       'Friday, April 11, 2026',
    time:       '2:00 PM',
    priority:   'MEDIUM',
    status:     'Rejected',
    submittedAt: '2026-04-04T14:00:00.000Z',
  },
];

const STATUS_CONFIG = {
  Pending:  { bg: '#FFF8E1', text: '#F9A825', dot: '#F9A825', message: 'Awaiting approval from barangay staff.' },
  Approved: { bg: '#E8F5E9', text: '#2E7D32', dot: '#43A047', message: 'Your appointment has been confirmed.'    },
  Rejected: { bg: '#FFEBEE', text: '#C62828', dot: '#E53935', message: 'Your appointment was not approved.'      },
};

const PRIORITY_CONFIG = {
  HIGH:   { bg: '#FFEBEE', text: '#C62828', label: '🚨 High'   },
  MEDIUM: { bg: '#FFF8E1', text: '#E65100', label: '⚠️ Medium' },
  LOW:    { bg: '#E8F5E9', text: '#2E7D32', label: '✅ Low'    },
};

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

function formatSubmitted(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AppointmentStatusScreen({ navigation }) {
  const [filter, setFilter] = useState('All');

  const filtered = MOCK_APPOINTMENTS.filter(a =>
    filter === 'All' || a.status === filter
  );

  const renderCard = ({ item }) => {
    const s = STATUS_CONFIG[item.status];
    const p = PRIORITY_CONFIG[item.priority];

    return (
      <View style={styles.card}>
        {/* Card header */}
        <View style={styles.cardTop}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.cardService}>{item.service}</Text>
            <Text style={styles.cardSubType}>{item.subType.replace(/_/g, ' ')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
            <Text style={[styles.statusText, { color: s.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* Status message */}
        <View style={[styles.statusMessage, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusMessageText, { color: s.text }]}>{s.message}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsBlock}>
          <DetailRow icon="📍" value={item.facility}       />
          <DetailRow icon="📅" value={item.date}           />
          <DetailRow icon="🕐" value={item.time}           />
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
            <Text style={[styles.priorityText, { color: p.text }]}>{p.label}</Text>
          </View>
          <Text style={styles.submittedText}>
            Submitted {formatSubmitted(item.submittedAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filter segmented control */}
      <View style={styles.segmentedBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.segment, filter === f && styles.segmentActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.segmentText, filter === f && styles.segmentTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>
        {filtered.length} {filtered.length === 1 ? 'appointment' : 'appointments'}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'All'
                ? "You haven't submitted any appointments yet."
                : `No ${filter.toLowerCase()} appointments found.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function DetailRow({ icon, value }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.icon}>{icon}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  icon:  { fontSize: 13 },
  value: { fontSize: 13, color: '#555', flexShrink: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 12,
    backgroundColor: '#0047AB',
  },
  backBtn:     { padding: 4 },
  backBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  headerTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },

  // Segmented control
  segmentedBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: '#EAEDF5',
    borderRadius: 10,
    padding: 3,
  },
  segment:           { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  segmentActive:     { backgroundColor: '#FFF', elevation: 1 },
  segmentText:       { fontSize: 12, color: '#888', fontWeight: '500' },
  segmentTextActive: { color: '#0047AB', fontWeight: '700' },

  countText: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4,
    color: '#AAA', fontSize: 12,
  },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleGroup: { flex: 1, marginRight: 10 },
  cardService:    { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  cardSubType:    { fontSize: 13, color: '#888', marginTop: 2 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, gap: 5,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },

  statusMessage: {
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  statusMessageText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  detailsBlock: { marginBottom: 12 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  priorityBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityText:   { fontSize: 12, fontWeight: '700' },
  submittedText:  { fontSize: 11, color: '#BBB' },

  // Empty state
  emptyBox: {
    alignItems: 'center', marginTop: 60, paddingHorizontal: 40,
  },
  emptyIcon:     { fontSize: 40, marginBottom: 14 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 20 },
});