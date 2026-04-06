import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, SectionList, ScrollView, Platform, StatusBar, Alert
} from 'react-native';

// ─── MOCK DATA ───────────────────────────────────────────────
// TODO: Replace with → supabase.from('requests').select('*, users(name)')
const MOCK_REQUESTS = [
  { id: '1', userName: 'Juan Dela Cruz',  category: 'Medical',   subType: 'Physical',               priority: 'HIGH',   status: 'Pending',  facility: 'Barangay Health Center',                action: 'WALK_IN',       description: '',                                            timestamp: '2026-04-06T08:00:00.000Z' },
  { id: '2', userName: 'Maria Santos',    category: 'Documents', subType: 'Clearance',              priority: 'LOW',    status: 'Pending',  facility: 'Barangay Hall — Records Office',         action: 'SCHEDULE',      description: '',                                            timestamp: '2026-04-06T09:00:00.000Z' },
  { id: '3', userName: 'Pedro Reyes',     category: 'Complaint', subType: 'Noise',                  priority: 'MEDIUM', status: 'Approved', facility: 'Barangay Hall — Lupon Tagapamayapa',    action: 'SCHEDULE',      description: 'Loud music from neighboring house past midnight.', timestamp: '2026-04-05T14:00:00.000Z' },
  { id: '4', userName: 'Ana Gonzales',    category: 'Medical',   subType: 'Checkup',                priority: 'LOW',    status: 'Approved', facility: 'Barangay Health Center',                action: 'SCHEDULE',      description: '',                                            timestamp: '2026-04-05T10:00:00.000Z' },
  { id: '5', userName: 'Rico Manalo',     category: 'Complaint', subType: 'Broken_Electrical_Wire', priority: 'HIGH',   status: 'Rejected', facility: 'Barangay Hall — Infrastructure Office',  action: 'SUBMIT_REPORT', description: 'Exposed wire near the basketball court.',     timestamp: '2026-04-04T16:00:00.000Z' },
  { id: '6', userName: 'Lita Cruz',       category: 'Documents', subType: 'Indigency',              priority: 'LOW',    status: 'Rejected', facility: 'Barangay Hall — Records Office',         action: 'SCHEDULE',      description: '',                                            timestamp: '2026-04-04T11:00:00.000Z' },
];

// ─── SLOT HELPERS ────────────────────────────────────────────
const DEFAULT_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM',  '4:00 PM',
];

function generateWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDayLabel(date) {
  return date.toLocaleDateString('en-PH', { weekday: 'short' });
}

function formatDayNumber(date) {
  return date.getDate().toString();
}

function formatFullDate(date) {
  return date.toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function dateKey(date) {
  return date.toISOString().split('T')[0];
}

// ─── CONFIG ──────────────────────────────────────────────────
const CATEGORIES = ['All', 'Medical', 'Documents', 'Complaint'];
const STATUSES   = ['All', 'Pending', 'Approved', 'Rejected'];

const PRIORITY_CONFIG = {
  HIGH:   { bg: '#FFEBEE', text: '#C62828', label: '🚨 High'   },
  MEDIUM: { bg: '#FFF8E1', text: '#E65100', label: '⚠️ Medium' },
  LOW:    { bg: '#E8F5E9', text: '#2E7D32', label: '✅ Low'    },
};

const STATUS_CONFIG = {
  Pending:  { bg: '#FFF8E1', text: '#F9A825', dot: '#F9A825' },
  Approved: { bg: '#E8F5E9', text: '#2E7D32', dot: '#43A047' },
  Rejected: { bg: '#FFEBEE', text: '#C62828', dot: '#E53935' },
};

const TAB_ICONS = { Requests: '📋', Slots: '🗓️', Account: '👤' };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── REQUESTS TAB ────────────────────────────────────────────
function RequestsTab({ navigation }) {
  const [category, setCategory] = useState('All');
  const [status,   setStatus]   = useState('All');

  const filtered = MOCK_REQUESTS.filter(r =>
    (category === 'All' || r.category === category) &&
    (status   === 'All' || r.status   === status)
  );

  const renderCard = ({ item }) => {
    const p = PRIORITY_CONFIG[item.priority];
    const s = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RequestDetail', { request: item })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{item.userName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
            <Text style={[styles.statusText, { color: s.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardSub}>
          {item.category} · {item.subType.replace(/_/g, ' ')}
        </Text>
        {item.description !== '' && (
          <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={styles.cardBottom}>
          <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
            <Text style={[styles.priorityText, { color: p.text }]}>{p.label}</Text>
          </View>
          <Text style={styles.cardTime}>{formatDate(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Category chips */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Status segmented control */}
      <View style={styles.segmentedBar}>
        {STATUSES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.segment, status === s && styles.segmentActive]}
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.segmentText, status === s && styles.segmentTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>
        {filtered.length} {filtered.length === 1 ? 'request' : 'requests'}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No requests found.</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── SLOTS TAB ───────────────────────────────────────────────
const WEEK_DATES = generateWeekDates();

function SlotsTab() {
  const [selectedDate, setSelectedDate] = useState(WEEK_DATES[0]);

  // slotData shape: { [dateKey]: { [time]: boolean } }
  // Starts empty — admin explicitly opens slots per specific date
  // TODO: on selectedDate change, fetch from:
  // supabase.from('time_slots').select('*').eq('slot_date', dateKey(selectedDate))
  // Then hydrate slotData[key] from results
  const [slotData, setSlotData] = useState({});

  const key       = dateKey(selectedDate);
  const todaySlots = slotData[key] ?? {};
  const openCount  = Object.values(todaySlots).filter(Boolean).length;

  const toggleSlot = (time) => {
    // TODO: Replace local state update with Supabase upsert:
    // await supabase.from('time_slots').upsert({
    //   slot_date:    key,
    //   slot_time:    time,
    //   is_available: !(todaySlots[time] ?? false),
    // }, { onConflict: 'slot_date,slot_time' });
    setSlotData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [time]: !(prev[key]?.[time] ?? false),
      },
    }));
  };

  return (
    <View style={{ flex: 1 }}>

      {/* 14-day date strip */}
      <View style={slotStyles.dateStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={slotStyles.dateStrip}
        >
          {WEEK_DATES.map((date, i) => {
            const isSelected = dateKey(date) === dateKey(selectedDate);
            const isToday    = dateKey(date) === dateKey(new Date());
            return (
              <TouchableOpacity
                key={i}
                style={[slotStyles.dateChip, isSelected && slotStyles.dateChipSelected]}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.7}
              >
                <Text style={[slotStyles.dateDayLabel, isSelected && slotStyles.dateLabelSelected]}>
                  {formatDayLabel(date)}
                </Text>
                <Text style={[slotStyles.dateDayNumber, isSelected && slotStyles.dateLabelSelected]}>
                  {formatDayNumber(date)}
                </Text>
                {isToday && (
                  <View style={[slotStyles.todayDot, isSelected && slotStyles.todayDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected date header */}
      <View style={slotStyles.selectedDateBar}>
        <Text style={slotStyles.selectedDateText}>{formatFullDate(selectedDate)}</Text>
        <Text style={slotStyles.openCountText}>
          {openCount} slot{openCount !== 1 ? 's' : ''} open
        </Text>
      </View>

      {/* Slot list */}
      <ScrollView contentContainerStyle={slotStyles.slotList}>
        {DEFAULT_TIMES.map(time => {
          const isOpen = todaySlots[time] ?? false; //
          return (
            <View key={time} style={slotStyles.slotRow}>
              <View style={slotStyles.slotLeft}>
                <Text style={slotStyles.slotTime}>{time}</Text>
                <Text style={[slotStyles.slotStatus, { color: isOpen ? '#2E7D32' : '#BDBDBD' }]}>
                  {isOpen ? 'Open for booking' : 'Closed'}
                </Text>
              </View>
              <TouchableOpacity
                style={[slotStyles.toggleTrack, isOpen ? slotStyles.trackOn : slotStyles.trackOff]}
                onPress={() => toggleSlot(time)}
                activeOpacity={0.8}
              >
                <View style={[slotStyles.toggleThumb, isOpen ? slotStyles.thumbOn : slotStyles.thumbOff]} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

    </View>
  );
}

// ─── ACCOUNT TAB ─────────────────────────────────────────────
function AccountTab({ navigation }) {
  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          // TODO: await supabase.auth.signOut();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <View style={styles.accountContainer}>
      <View style={styles.accountCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <Text style={styles.accountName}>Admin</Text>
        <Text style={styles.accountEmail}>admin@komuniserve.com</Text>
      </View>

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionLabel}>System</Text>
        <View style={styles.accountItem}>
          <Text style={styles.accountItemLabel}>App Version</Text>
          <Text style={styles.accountItemValue}>1.0.0</Text>
        </View>
        <View style={[styles.accountItem, { borderBottomWidth: 0 }]}>
          <Text style={styles.accountItemLabel}>Role</Text>
          <Text style={styles.accountItemValue}>Barangay Admin</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Requests');

  const TAB_TITLES = {
    Requests: 'Requests',
    Slots:    'Slot Management',
    Account:  'Account',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{TAB_TITLES[activeTab]}</Text>
        <Text style={styles.headerSub}>KomuniServe Admin</Text>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'Requests' && <RequestsTab navigation={navigation} />}
        {activeTab === 'Slots'    && <SlotsTab />}
        {activeTab === 'Account'  && <AccountTab navigation={navigation} />}
      </View>

      {/* Bottom tab bar */}
      <View style={styles.bottomBar}>
        {['Requests', 'Slots', 'Account'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.bottomTab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={styles.bottomTabIcon}>{TAB_ICONS[tab]}</Text>
            <Text style={[styles.bottomTabLabel, activeTab === tab && styles.bottomTabLabelActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.bottomTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── SHARED STYLES ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
    paddingBottom: 14,
    backgroundColor: '#0047AB',
  },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  headerSub:   { color: '#BDD4FF', fontSize: 12, marginTop: 1 },

  // Category bar
  categoryBar:     { backgroundColor: '#FFF', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F2F8',
  },
  categoryChipActive:     { backgroundColor: '#0047AB' },
  categoryChipText:       { fontSize: 14, fontWeight: '600', color: '#555' },
  categoryChipTextActive: { color: '#FFF' },

  // Segmented control
  segmentedBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#EAEDF5',
    borderRadius: 10,
    padding: 3,
  },
  segment:          { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  segmentActive:    { backgroundColor: '#FFF', elevation: 1 },
  segmentText:      { fontSize: 13, color: '#888', fontWeight: '500' },
  segmentTextActive:{ color: '#0047AB', fontWeight: '700' },

  countText: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 2, color: '#AAA', fontSize: 12 },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardName:   { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  cardSub:    { fontSize: 13, color: '#777', marginBottom: 5 },
  cardDesc:   { fontSize: 12, color: '#AAA', fontStyle: 'italic', marginBottom: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardTime:   { fontSize: 12, color: '#BBB' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 5 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 12, fontWeight: '700' },

  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityText:  { fontSize: 12, fontWeight: '700' },

  emptyBox:  { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#CCC', fontSize: 16 },

  // Account
  accountContainer: { flex: 1, padding: 20 },
  accountCard: {
    backgroundColor: '#FFF', borderRadius: 16,
    padding: 24, alignItems: 'center', marginBottom: 20, elevation: 1,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#0047AB', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText:   { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  accountName:  { fontSize: 20, fontWeight: 'bold', color: '#1A1A2E' },
  accountEmail: { fontSize: 14, color: '#888', marginTop: 4 },
  accountSection: {
    backgroundColor: '#FFF', borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 20, elevation: 1,
  },
  accountSectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#AAA',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingTop: 14, paddingBottom: 4,
  },
  accountItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  accountItemLabel: { fontSize: 15, color: '#444' },
  accountItemValue: { fontSize: 15, color: '#888' },
  logoutBtn: { backgroundColor: '#FFEBEE', padding: 16, borderRadius: 14, alignItems: 'center' },
  logoutBtnText: { color: '#C62828', fontWeight: 'bold', fontSize: 16 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    elevation: 8,
  },
  bottomTab:           { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 4, position: 'relative' },
  bottomTabIcon:       { fontSize: 20 },
  bottomTabLabel:      { fontSize: 11, color: '#AAA', marginTop: 3, fontWeight: '500' },
  bottomTabLabelActive:{ color: '#0047AB', fontWeight: '700' },
  bottomTabIndicator:  {
    position: 'absolute', top: 0, width: 32, height: 3,
    backgroundColor: '#0047AB', borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
  },
});

// ─── SLOT STYLES ─────────────────────────────────────────────
const slotStyles = StyleSheet.create({
  dateStripWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dateStrip:        { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  dateChip: {
    flexShrink: 0, width: 52, alignItems: 'center',
    paddingVertical: 8, borderRadius: 12, backgroundColor: '#F0F2F8',
  },
  dateChipSelected:  { backgroundColor: '#0047AB' },
  dateDayLabel:      { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  dateDayNumber:     { fontSize: 18, fontWeight: '800', color: '#333', marginTop: 2 },
  dateLabelSelected: { color: '#FFF' },
  todayDot:          { width: 5, height: 5, borderRadius: 3, backgroundColor: '#0047AB', marginTop: 4 },
  todayDotSelected:  { backgroundColor: '#FFF' },

  selectedDateBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F5F6FA',
  },
  selectedDateText: { fontSize: 14, fontWeight: '600', color: '#444' },
  openCountText:    { fontSize: 13, color: '#0047AB', fontWeight: '700' },

  slotList: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  slotRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  slotLeft:   { flex: 1 },
  slotTime:   { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  slotStatus: { fontSize: 12, marginTop: 2 },

  toggleTrack: {
    width: 46, height: 26, borderRadius: 13,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  trackOn:     { backgroundColor: '#0047AB' },
  trackOff:    { backgroundColor: '#DDD' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', elevation: 1 },
  thumbOn:     { alignSelf: 'flex-end' },
  thumbOff:    { alignSelf: 'flex-start' },
});