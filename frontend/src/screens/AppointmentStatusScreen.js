import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Platform, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { 
  ArrowLeft, MapPin, CalendarDays, Clock, 
  Inbox, AlertCircle, CheckCircle2, Clock3 
} from 'lucide-react-native';
import { supabase } from '../services/supabase';

function formatTimeForDisplay(dbTime)  {
  if (!dbTime) return '';
  const [hourStr, minuteStr] = dbTime.split(':');
  const hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${ampm}`;
}

// Updated Configuration Colors to match the new theme
const STATUS_CONFIG = {
  Pending:  { bg: '#FFF3E0', text: '#C35A00', border: '#FFD180', message: 'Awaiting approval from barangay staff.', icon: Clock3 },
  Approved: { bg: '#EBF5EB', text: '#1E6B1E', border: '#A5D6A7', message: 'Your appointment has been confirmed.', icon: CheckCircle2 },
  Rejected: { bg: '#FDECEA', text: '#B71C1C', border: '#EF9A9A', message: 'Your appointment was not approved.', icon: AlertCircle },
};

const PRIORITY_CONFIG = {
  HIGH:   { bg: '#FDECEA', text: '#B71C1C', label: 'High'   },
  MEDIUM: { bg: '#FFF3E0', text: '#C35A00', label: 'Medium' },
  LOW:    { bg: '#EBF5EB', text: '#1E6B1E', label: 'Low'    },
};

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

function formatSubmitted(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AppointmentStatusScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  } , []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          appointment_status,
          created_at,
          requests(
            category,
            service_requested,
            priority,
            description,
            submitted_at,
            intake_answers
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const formatted = data.map(a => ({
        id:           a.id.toString(),
        service:      a.requests?.category                  ?? 'Unknown',
        subType:      a.requests?.intake_answers?.subType ?? a.requests?.service_requested ?? '',
        facility:     a.requests.intake_answers?.facility   ?? '',
        date:         new Date(a.scheduled_date).toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric'}),
        time:         formatTimeForDisplay(a.scheduled_time),
        priority:     a.requests?.priority                  ?? 'LOW',
        status:       a.appointment_status                  ?? 'Pending',
        submittedAt:  a.requests?.submitted_at              ?? a.created_at,
      }));

      setAppointments(formatted);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = appointments.filter(a =>
    filter === 'All' || a.status === filter
  );

  const renderCard = ({ item }) => {
    const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.Pending;
    const p = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.LOW;
    const StatusIcon = s.icon;

    return (
      <View style={styles.card}>
        {/* Card header */}
        <View style={styles.cardTop}>
          <View style={styles.cardTitleGroup}>
            <Text style={styles.cardService}>{item.subType.replace(/_/g, ' ')}</Text>
            <Text style={styles.cardSubType}>{item.service}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
            <StatusIcon size={12} color={s.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: s.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* Status message */}
        <View style={[styles.statusMessage, { backgroundColor: s.bg, borderColor: s.border }]}>
          <Text style={[styles.statusMessageText, { color: s.text }]}>{s.message}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsBlock}>
          <DetailRow Icon={MapPin} value={item.facility} />
          <DetailRow Icon={CalendarDays} value={item.date} />
          <DetailRow Icon={Clock} value={item.time} />
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.priorityGroup}>
            <Text style={styles.footerLabel}>Priority</Text>
            <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
              <Text style={[styles.priorityText, { color: p.text }]}>{p.label}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.footerLabel}>Submitted</Text>
            <Text style={styles.submittedText}>{formatSubmitted(item.submittedAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>HISTORY</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>My Appointments</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter segmented control */}
      <View style={styles.segmentedBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.segment, filter === f && styles.segmentActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, filter === f && styles.segmentTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.countText}>
          {filtered.length} {filtered.length === 1 ? 'Record' : 'Records'} Found
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        onRefresh={fetchAppointments}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Inbox size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No appointments yet</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'All'
                  ? "You haven't requested any appointments so far."
                  : `There are no ${filter.toLowerCase()} appointments at the moment.`}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function DetailRow({ Icon, value }) {
  if (!value) return null;
  return (
    <View style={detailStyles.row}>
      <Icon size={14} color="#64748B" style={detailStyles.icon} />
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const NAVY = '#0038A8';
const BACKGROUND = '#F8FAFC';
const WHITE = '#FFFFFF';

const detailStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon:  { marginRight: 8, marginTop: 2 },
  value: { fontSize: 13, color: '#475569', flexShrink: 1, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  // Header
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  backBtn: { 
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  // Segmented control
  segmentedBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  segment: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  segmentActive: { 
    backgroundColor: WHITE, 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentText: { 
    fontSize: 13, 
    color: '#64748B', 
    fontWeight: '600' 
  },
  segmentTextActive: { 
    color: NAVY, 
    fontWeight: '700' 
  },

  listHeader: {
    paddingHorizontal: 20, 
    paddingBottom: 8,
    paddingTop: 8,
  },
  countText: {
    color: '#94A3B8', 
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleGroup: { flex: 1, marginRight: 12 },
  cardService:    { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSubType:    { fontSize: 13, color: '#64748B', fontWeight: '500' },

  statusBadge: {
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 10, 
    paddingVertical: 4,
    borderRadius: 10, 
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  statusMessage: {
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 16,
    borderWidth: 1,
  },
  statusMessageText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  detailsBlock: { 
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priorityGroup: {
    alignItems: 'flex-start',
  },
  priorityBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText:   { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  submittedText:  { fontSize: 12, color: '#475569', fontWeight: '600' },

  // Empty state
  emptyBox: {
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 60, 
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle:    { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});