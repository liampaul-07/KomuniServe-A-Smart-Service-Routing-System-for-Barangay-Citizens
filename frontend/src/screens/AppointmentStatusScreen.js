import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { getMyRequests } from '../services/requestService';  // ← WIRED

const STATUS_CONFIG = {
  pending:   { bg: '#FFF8E1', text: '#92600A', dot: '#F9A825', message: 'Awaiting approval from barangay staff.' },
  approved:  { bg: '#E8F5E9', text: '#2E7D32', dot: '#43A047', message: 'Your appointment has been confirmed.'   },
  rejected:  { bg: '#FFEBEE', text: '#C62828', dot: '#E53935', message: 'Your appointment was not approved.'     },
  completed: { bg: '#E8F0FE', text: '#1A3EBF', dot: '#1A3EBF', message: 'This request has been completed.'      },
  cancelled: { bg: '#F5F5F5', text: '#757575', dot: '#9E9E9E', message: 'This request was cancelled.'            },
};

const PRIORITY_CONFIG = {
  high:   { bg: '#FFEBEE', text: '#C62828', label: 'High'   },
  medium: { bg: '#FFF8E1', text: '#E65100', label: 'Medium' },
  low:    { bg: '#E8F5E9', text: '#2E7D32', label: 'Low'    },
};

const FILTERS = ['All', 'pending', 'approved', 'rejected', 'completed'];

function formatSubmitted(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatAppointment(appt) {
  if (!appt) return null;
  const date = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
  return date.toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AppointmentStatusScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter]     = useState('All');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getMyRequests();
    if (err) {
      setError('Failed to load requests. Please try again.');
    } else {
      setRequests(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const filtered = requests.filter(r =>
    filter === 'All' || r.status === filter
  );

  const renderCard = ({ item }) => {
    const s = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const p = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium;
    const apptStr = formatAppointment(item.appointments?.[0]);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.cardService}>{item.category}</Text>
            <Text style={styles.cardSubType}>{item.service_requested?.replace(/_/g, ' ')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
            <Text style={[styles.statusText, { color: s.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={[styles.statusMessage, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusMessageText, { color: s.text }]}>{s.message}</Text>
        </View>

        {/* Appointment details if assigned */}
        {apptStr && (
          <View style={styles.apptBlock}>
            <Text style={styles.apptLabel}>📅 Appointment</Text>
            <Text style={styles.apptValue}>{apptStr}</Text>
            {item.appointments?.[0]?.staff_notes && (
              <Text style={styles.apptNotes}>Note: {item.appointments[0].staff_notes}</Text>
            )}
          </View>
        )}

        {/* Description snippet */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
            <Text style={[styles.priorityText, { color: p.text }]}>{p.label} Priority</Text>
          </View>
          <Text style={styles.submittedText}>
            Submitted {formatSubmitted(item.submitted_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <TouchableOpacity onPress={loadRequests} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.segmentedBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.segment, filter === f && styles.segmentActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.segmentText, filter === f && styles.segmentTextActive]}>
              {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRequests}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.countText}>
            {filtered.length} {filtered.length === 1 ? 'request' : 'requests'}
          </Text>
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No requests</Text>
                <Text style={styles.emptySubtitle}>
                  {filter === 'All'
                    ? "You haven't submitted any requests yet."
                    : `No ${filter} requests found.`}
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 12, backgroundColor: '#0047AB',
  },
  backBtn:      { padding: 4 },
  backBtnText:  { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  headerTitle:  { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  refreshBtn:   { padding: 4 },
  refreshText:  { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  segmentedBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: '#EAEDF5', borderRadius: 10, padding: 3,
  },
  segment:           { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  segmentActive:     { backgroundColor: '#FFF', elevation: 1 },
  segmentText:       { fontSize: 11, color: '#888', fontWeight: '500' },
  segmentTextActive: { color: '#0047AB', fontWeight: '700' },
  countText:         { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, color: '#AAA', fontSize: 12 },
  list:              { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitleGroup:   { flex: 1, marginRight: 10 },
  cardService:      { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  cardSubType:      { fontSize: 13, color: '#888', marginTop: 2 },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 5 },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  statusText:       { fontSize: 12, fontWeight: '700' },
  statusMessage:    { borderRadius: 10, padding: 10, marginBottom: 12 },
  statusMessageText:{ fontSize: 13, fontWeight: '600', textAlign: 'center' },
  apptBlock:        { backgroundColor: '#EEF3FF', borderRadius: 8, padding: 10, marginBottom: 10 },
  apptLabel:        { fontSize: 11, color: '#5570AA', fontWeight: '700', marginBottom: 3 },
  apptValue:        { fontSize: 13, color: '#1A2340', fontWeight: '600' },
  apptNotes:        { fontSize: 12, color: '#6678AA', marginTop: 4, fontStyle: 'italic' },
  description:      { fontSize: 13, color: '#666', marginBottom: 10, lineHeight: 18 },
  cardFooter:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  priorityBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityText:     { fontSize: 12, fontWeight: '700' },
  submittedText:    { fontSize: 11, color: '#BBB' },
  centered:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText:      { marginTop: 12, color: '#888', fontSize: 14 },
  errorText:        { color: '#C62828', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryBtn:         { backgroundColor: '#0047AB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText:        { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyBox:         { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIcon:        { fontSize: 40, marginBottom: 14 },
  emptyTitle:       { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle:    { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 20 },
});