import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ScrollView, Platform, StatusBar, Alert, Image,
  Animated, ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  Search, LayoutList, CalendarDays, UserCircle,
  ChevronRight, LogOut, Info, HelpCircle, ShieldCheck,
  CheckCircle2, Clock4, XCircle, AlertTriangle, Zap,
} from 'lucide-react-native';
import { useAuth } from '../lib/useAuth';                        // ← WIRED
import { getAllRequests } from '../services/requestService';      // ← WIRED
import { getServiceSchedules, updateSchedule } from '../services/appointmentService'; // ← WIRED

// ─── CONFIG ──────────────────────────────────────────────────
const CATEGORIES = ['All', 'Medical', 'Documents', 'Complaint'];
const STATUSES   = ['All', 'pending', 'approved', 'rejected', 'completed'];

const PRIORITY_CONFIG = {
  high:   { bg: '#FFF8E1', text: '#B8860B', border: '#F9C800', label: 'High'   },
  medium: { bg: '#FFF3E0', text: '#C35A00', border: '#FFB347', label: 'Medium' },
  low:    { bg: '#E8F4FD', text: '#1A5C8A', border: '#90CAF9', label: 'Low'    },
};

const STATUS_CONFIG = {
  pending:   { bg: '#FFFBEA', text: '#92600A', dot: '#F9C800', border: '#F9C800' },
  approved:  { bg: '#EBF5EB', text: '#1E6B1E', dot: '#2E8B57', border: '#81C784' },
  rejected:  { bg: '#FDECEA', text: '#B71C1C', dot: '#E53935', border: '#EF9A9A' },
  completed: { bg: '#E8EFFD', text: '#1A3EBF', dot: '#1A3EBF', border: '#C5D5F5' },
  cancelled: { bg: '#F5F5F5', text: '#757575', dot: '#9E9E9E', border: '#E0E0E0' },
};

const TAB_LABELS = { Requests: 'Requests', Slots: 'Slots', Account: 'Account' };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── EGOVPH CUSTOM SPINNER ───────────────────────────────────
function EGovSpinner({ size = 32 }) {
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();
    return () => rotation.stopAnimation();
  }, [rotation]);
  const rotateDeg = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r = (size / 2) - 4;
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = size * 0.14;
  function arcPath(startDeg, endDeg) {
    const toRad = (d) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }
  return (
    <Animated.View style={{ transform: [{ rotate: rotateDeg }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={strokeW} fill="none" />
        <Path d={arcPath(-90, 30)}  stroke="#0038A8" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
        <Path d={arcPath(42, 162)}  stroke="#CE1126" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
        <Path d={arcPath(174, 294)} stroke="#F9C800" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

function HeaderLogo() {
  return (
    <View style={styles.headerLogoCircle}>
      <Image source={require('../../assets/IconLogo.jpeg')} style={styles.headerLogoImage} resizeMode="cover" />
    </View>
  );
}

// ─── REQUESTS TAB ────────────────────────────────────────────
function RequestsTab({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [category, setCategory] = useState('All');
  const [status, setStatus]     = useState('All');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters = {};
    if (status   !== 'All') filters.status   = status;
    if (category !== 'All') filters.category = category;
    const { data, error: err } = await getAllRequests(filters);
    if (err) setError('Failed to load requests.');
    else setRequests(data ?? []);
    setLoading(false);
  }, [category, status]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const filtered = requests.filter(r =>
    (category === 'All' || r.category === category) &&
    (status   === 'All' || r.status   === status)
  );

  function StatusIcon({ s, size = 13 }) {
    if (s === 'approved')  return <CheckCircle2 size={size} color={STATUS_CONFIG.approved.dot} />;
    if (s === 'rejected')  return <XCircle      size={size} color={STATUS_CONFIG.rejected.dot} />;
    if (s === 'completed') return <CheckCircle2 size={size} color={STATUS_CONFIG.completed.dot} />;
    return <Clock4 size={size} color={STATUS_CONFIG.pending.dot} />;
  }

  function PriorityIcon({ priority, size = 11 }) {
    if (priority === 'high')   return <AlertTriangle size={size} color={PRIORITY_CONFIG.high.text} />;
    if (priority === 'medium') return <Zap           size={size} color={PRIORITY_CONFIG.medium.text} />;
    return <Info size={size} color={PRIORITY_CONFIG.low.text} />;
  }

  const renderCard = ({ item }) => {
    const p = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium;
    const s = STATUS_CONFIG[item.status]     ?? STATUS_CONFIG.pending;
    const residentName = item.users
      ? `${item.users.first_name} ${item.users.last_name}`
      : 'Unknown Resident';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RequestDetail', { request: item })}
        activeOpacity={0.75}
      >
        <View style={styles.cardGoldAccent} />
        <View style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={styles.cardNameRow}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{residentName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{residentName}</Text>
                <Text style={styles.cardSub}>
                  {item.category} · {item.service_requested?.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
              <StatusIcon s={item.status} />
              <Text style={[styles.statusText, { color: s.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          {item.description ? (
            <View style={styles.cardDescBox}>
              <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
            </View>
          ) : null}

          <View style={styles.cardBottom}>
            <View style={[styles.priorityBadge, { backgroundColor: p.bg, borderColor: p.border }]}>
              <PriorityIcon priority={item.priority} />
              <Text style={[styles.priorityText, { color: p.text }]}>{p.label}</Text>
            </View>
            <Text style={styles.cardTime}>{formatDate(item.submitted_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.categoryChip, category === c && styles.categoryChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.segmentedBar}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s} style={[styles.segment, status === s && styles.segmentActive]} onPress={() => setStatus(s)}>
            <Text style={[styles.segmentText, status === s && styles.segmentTextActive]}>
              {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color="#0038A8" />
        </View>
      ) : error ? (
        <View style={styles.centeredLoader}>
          <Text style={{ color: '#C62828' }}>{error}</Text>
          <TouchableOpacity onPress={loadRequests} style={{ marginTop: 10 }}>
            <Text style={{ color: '#0038A8', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.countText}>{filtered.length} {filtered.length === 1 ? 'request' : 'requests'} found</Text>
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <View style={styles.emptyIconBox}><LayoutList size={26} color="#9AA0B5" /></View>
                <Text style={styles.emptyText}>No requests found.</Text>
                <Text style={styles.emptySubText}>Try adjusting your filters.</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

// ─── SLOTS TAB ───────────────────────────────────────────────
const WEEK_DATES = (() => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
})();

function formatDayLabel(date) { return date.toLocaleDateString('en-PH', { weekday: 'short' }); }
function formatDayNumber(date) { return date.getDate().toString(); }
function formatFullDate(date)  { return date.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }); }
function dateKey(date)         { return date.toISOString().split('T')[0]; }

function SlotsTab() {
  const [selectedDate, setSelectedDate] = useState(WEEK_DATES[0]);
  const [schedules, setSchedules]       = useState([]);
  const [toggling, setToggling]         = useState(null); // schedule_id being toggled

  useEffect(() => {
    getServiceSchedules().then(({ data }) => {
      if (data) setSchedules(data);
    });
  }, []);

  const handleToggle = async (schedule) => {
    setToggling(schedule.id);
    const { error } = await updateSchedule({
      schedule_id: schedule.id,
      is_open: !schedule.is_open,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
    });
    if (error) {
      Alert.alert('Error', 'Failed to update schedule. Please try again.');
    } else {
      setSchedules(prev =>
        prev.map(s => s.id === schedule.id ? { ...s, is_open: !s.is_open } : s)
      );
    }
    setToggling(null);
  };

  const daySchedules = schedules.filter(s =>
    s.date === dateKey(selectedDate) ||
    s.day_of_week === selectedDate.getDay()
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={slotStyles.dateStripWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={slotStyles.dateStrip}>
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
                {isToday && <View style={[slotStyles.todayDot, isSelected && slotStyles.todayDotSelected]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={slotStyles.selectedDateBar}>
        <View>
          <Text style={slotStyles.selectedDateLabel}>SELECTED DATE</Text>
          <Text style={slotStyles.selectedDateText}>{formatFullDate(selectedDate)}</Text>
        </View>
        <View style={slotStyles.openCountBadge}>
          <Text style={slotStyles.openCountText}>
            {daySchedules.filter(s => s.is_open).length} open
          </Text>
        </View>
      </View>

      <View style={slotStyles.divider} />

      <ScrollView contentContainerStyle={slotStyles.slotList}>
        {daySchedules.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>
            No schedule data for this date.
          </Text>
        ) : (
          daySchedules.map(schedule => {
            const isOpen = schedule.is_open;
            const isLoading = toggling === schedule.id;
            const timeLabel = schedule.start_time
              ? schedule.start_time.substring(0, 5)
              : '--:--';

            return (
              <View key={schedule.id} style={[slotStyles.slotRow, isOpen && slotStyles.slotRowOpen]}>
                {isOpen && <View style={slotStyles.slotGoldAccent} />}
                <View style={[slotStyles.slotTimeBlock, isOpen && slotStyles.slotTimeBlockOpen]}>
                  <Text style={[slotStyles.slotTimeNum, isOpen && slotStyles.slotTimeNumOpen]}>
                    {timeLabel}
                  </Text>
                </View>
                <View style={slotStyles.slotLeft}>
                  <Text style={[slotStyles.slotStatus, { color: isOpen ? '#1A5C8A' : '#BDBDBD' }]}>
                    {isOpen ? 'Open for booking' : 'Closed'}
                  </Text>
                  <View style={[slotStyles.slotStatusPill, { backgroundColor: isOpen ? '#E8EFFD' : '#F2F2F2', borderColor: isOpen ? '#C5D5F5' : '#E0E0E0' }]}>
                    <View style={[slotStyles.slotStatusDot, { backgroundColor: isOpen ? '#0038A8' : '#BDBDBD' }]} />
                    <Text style={[slotStyles.slotStatusPillText, { color: isOpen ? '#0038A8' : '#BDBDBD' }]}>
                      {isOpen ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[slotStyles.toggleTrack, isOpen ? slotStyles.trackOn : slotStyles.trackOff]}
                  onPress={() => handleToggle(schedule)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading
                    ? <ActivityIndicator size="small" color="#FFF" style={{ alignSelf: 'center' }} />
                    : <View style={[slotStyles.toggleThumb, isOpen ? slotStyles.thumbOn : slotStyles.thumbOff]} />
                  }
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ─── ACCOUNT TAB ─────────────────────────────────────────────
function AccountTab({ navigation }) {
  const { profile, signOut } = useAuth();  // ← WIRED

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : 'Admin';

  return (
    <ScrollView style={styles.accountContainer} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.accountCard}>
        <View style={styles.accountCardGoldAccent} />
        <View style={styles.accountCardHeader}>
          <View style={styles.avatar}>
            <Image source={require('../../assets/IconLogo.jpeg')} style={styles.avatarImage} resizeMode="cover" />
          </View>
          <View style={styles.avatarBadge}>
            <ShieldCheck size={10} color="#0038A8" style={{ marginRight: 3 }} />
            <Text style={styles.avatarBadgeText}>STAFF</Text>
          </View>
        </View>
        <View style={styles.accountCardBody}>
          <Text style={styles.accountName}>{displayName}</Text>
          <Text style={styles.accountEmail}>{profile?.email ?? ''}</Text>
        </View>
      </View>

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionLabel}>System Information</Text>
        <View style={styles.accountItem}>
          <View style={styles.accountItemLeft}>
            <Info size={16} color="#8892AA" style={{ marginRight: 10 }} />
            <Text style={styles.accountItemLabel}>App Version</Text>
          </View>
          <View style={styles.accountItemValueBox}>
            <Text style={styles.accountItemValue}>1.0.0</Text>
          </View>
        </View>
        <View style={[styles.accountItem, { borderBottomWidth: 0 }]}>
          <View style={styles.accountItemLeft}>
            <ShieldCheck size={16} color="#8892AA" style={{ marginRight: 10 }} />
            <Text style={styles.accountItemLabel}>Role</Text>
          </View>
          <View style={styles.accountItemValueBox}>
            <Text style={styles.accountItemValue}>Barangay Staff</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={16} color="#C62828" style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Requests');

  const TAB_TITLES    = { Requests: 'Service Requests', Slots: 'Slot Management',         Account: 'My Account'           };
  const TAB_SUBTITLES = { Requests: 'Manage incoming requests', Slots: 'Set appointment availability', Account: 'Staff profile & settings' };
  const TAB_ICONS     = { Requests: LayoutList, Slots: CalendarDays, Account: UserCircle };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" translucent={false} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <HeaderLogo />
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{TAB_TITLES[activeTab]}</Text>
            <Text style={styles.headerSub}>{TAB_SUBTITLES[activeTab]}</Text>
          </View>
          {activeTab === 'Requests' && (
            <TouchableOpacity
              style={styles.searchIconBtn}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.7}
            >
              <Search size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'Requests' && <RequestsTab navigation={navigation} />}
        {activeTab === 'Slots'    && <SlotsTab />}
        {activeTab === 'Account'  && <AccountTab navigation={navigation} />}
      </View>

      <View style={styles.bottomBar}>
        {['Requests', 'Slots', 'Account'].map(tab => {
          const IconComp = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={styles.bottomTab} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
              {isActive && <View style={styles.bottomTabIndicator} />}
              <View style={[styles.bottomTabIconBox, isActive && styles.bottomTabIconBoxActive]}>
                <IconComp size={20} color={isActive ? '#0038A8' : '#9AA0B5'} strokeWidth={isActive ? 2.2 : 1.8} />
              </View>
              <Text style={[styles.bottomTabLabel, isActive && styles.bottomTabLabelActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES (preserved from original) ────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F8' },
  header:    { backgroundColor: '#0038A8', elevation: 4, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 10, paddingBottom: 14, gap: 12 },
  headerLogoCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  headerLogoImage: { width: 38, height: 38 },
  headerTextBlock: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  headerSub:   { color: '#A8C0F0', fontSize: 11, marginTop: 1 },
  searchIconBtn: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  categoryBar:     { backgroundColor: '#FFFFFF', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8EBF2' },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip:    { flexShrink: 0, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F2F4F8', borderWidth: 1, borderColor: '#E0E4EF' },
  categoryChipActive: { backgroundColor: '#0038A8', borderColor: '#0038A8' },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#555B70' },
  categoryChipTextActive: { color: '#FFFFFF' },
  segmentedBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 4, backgroundColor: '#E8EBF5', borderRadius: 9, padding: 3 },
  segment:      { flex: 1, paddingVertical: 8, borderRadius: 7, alignItems: 'center' },
  segmentActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segmentText:      { fontSize: 12, color: '#8892AA', fontWeight: '500' },
  segmentTextActive: { color: '#0038A8', fontWeight: '700' },
  countText:     { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 2, color: '#9AA0B5', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  listContent:   { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28 },
  centeredLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 10, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#E8EBF2' },
  cardGoldAccent: { height: 4, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  cardInner:  { flex: 1, padding: 14 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardNameRow:{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10, marginRight: 8 },
  cardAvatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#E8EFFD', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C5D5F5' },
  cardAvatarText: { color: '#0038A8', fontSize: 15, fontWeight: '700' },
  cardName:   { fontSize: 15, fontWeight: '700', color: '#1A1F36' },
  cardSub:    { fontSize: 12, color: '#8892AA', marginTop: 1 },
  cardDescBox:{ backgroundColor: '#F8F9FC', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8, borderLeftWidth: 2, borderLeftColor: '#C5D5F5' },
  cardDesc:   { fontSize: 12, color: '#7A82A0', fontStyle: 'italic' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTime:   { fontSize: 11, color: '#B0B8D0' },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, gap: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  priorityText:  { fontSize: 11, fontWeight: '700' },
  emptyBox:     { alignItems: 'center', marginTop: 72 },
  emptyIconBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E8EBF2', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyText:    { color: '#4A5270', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#B8C0D8', fontSize: 13, marginTop: 4 },
  accountContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  accountCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#E8EBF2' },
  accountCardGoldAccent: { height: 4, backgroundColor: '#F9C800', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  accountCardHeader: { backgroundColor: '#0038A8', paddingVertical: 24, alignItems: 'center' },
  avatar:      { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
  avatarImage: { width: 64, height: 64 },
  avatarBadge: { position: 'absolute', top: 12, right: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9C800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  avatarBadgeText: { color: '#0038A8', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  accountCardBody:  { paddingVertical: 18, alignItems: 'center' },
  accountName:      { fontSize: 20, fontWeight: '700', color: '#1A1F36' },
  accountEmail:     { fontSize: 13, color: '#8892AA', marginTop: 4 },
  accountSection:   { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, marginBottom: 14, elevation: 1, borderWidth: 1, borderColor: '#E8EBF2' },
  accountSectionLabel: { fontSize: 10, fontWeight: '700', color: '#9AA0B5', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 14, paddingBottom: 6 },
  accountItem:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F4F8' },
  accountItemLeft:  { flexDirection: 'row', alignItems: 'center' },
  accountItemLabel: { fontSize: 15, color: '#2C3250' },
  accountItemValueBox: { backgroundColor: '#F2F4F8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  accountItemValue: { fontSize: 13, color: '#5C6480', fontWeight: '600' },
  logoutBtn:     { flexDirection: 'row', backgroundColor: '#FFF0F0', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6, borderWidth: 1, borderColor: '#FFD0D0' },
  logoutBtnText: { color: '#C62828', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  bottomBar:     { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E8EBF2', paddingBottom: Platform.OS === 'ios' ? 20 : 8, elevation: 10, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  bottomTab:     { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 4, position: 'relative' },
  bottomTabIndicator: { position: 'absolute', top: 0, width: 28, height: 3, backgroundColor: '#F9C800', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  bottomTabIconBox: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#F2F4F8', justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  bottomTabIconBoxActive: { backgroundColor: '#E8EFFD' },
  bottomTabLabel: { fontSize: 10, color: '#9AA0B5', fontWeight: '500' },
  bottomTabLabelActive: { color: '#0038A8', fontWeight: '700' },
});

const slotStyles = StyleSheet.create({
  dateStripWrapper: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EBF2' },
  dateStrip:        { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  dateChip:         { flexShrink: 0, width: 54, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: '#F2F4F8', borderWidth: 1, borderColor: '#E0E4EF' },
  dateChipSelected: { backgroundColor: '#0038A8', borderColor: '#0038A8' },
  dateDayLabel:     { fontSize: 10, color: '#8892AA', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateDayNumber:    { fontSize: 20, fontWeight: '800', color: '#1A1F36', marginTop: 2 },
  dateLabelSelected:{ color: '#FFFFFF' },
  todayDot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F9C800', marginTop: 4 },
  todayDotSelected: { backgroundColor: '#FFFFFF' },
  selectedDateBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#F2F4F8' },
  selectedDateLabel:{ fontSize: 10, fontWeight: '700', color: '#9AA0B5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  selectedDateText: { fontSize: 15, fontWeight: '700', color: '#1A1F36' },
  openCountBadge:   { backgroundColor: '#E8EFFD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#C5D5F5' },
  openCountText:    { fontSize: 13, color: '#0038A8', fontWeight: '700' },
  divider:          { height: 1, backgroundColor: '#E8EBF2', marginHorizontal: 16 },
  slotList:         { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
  slotRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, borderWidth: 1, borderColor: '#E8EBF2', overflow: 'hidden' },
  slotRowOpen:      { borderColor: '#C5D5F5', backgroundColor: '#FAFCFF' },
  slotGoldAccent:   { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#F9C800' },
  slotTimeBlock:    { width: 62, paddingVertical: 18, alignItems: 'center', backgroundColor: '#F2F4F8', borderRightWidth: 1, borderRightColor: '#E8EBF2' },
  slotTimeBlockOpen:{ backgroundColor: '#E8EFFD', borderRightColor: '#C5D5F5' },
  slotTimeNum:      { fontSize: 14, fontWeight: '800', color: '#1A1F36' },
  slotTimeNumOpen:  { color: '#0038A8' },
  slotLeft:         { flex: 1, paddingHorizontal: 14, gap: 5 },
  slotStatus:       { fontSize: 13, fontWeight: '600' },
  slotStatusPill:   { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, gap: 5 },
  slotStatusDot:    { width: 5, height: 5, borderRadius: 3 },
  slotStatusPillText:{ fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  toggleTrack:      { width: 46, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3, marginRight: 14 },
  trackOn:          { backgroundColor: '#0038A8' },
  trackOff:         { backgroundColor: '#DDE1EC' },
  toggleThumb:      { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  thumbOn:          { alignSelf: 'flex-end' },
  thumbOff:         { alignSelf: 'flex-start' },
});