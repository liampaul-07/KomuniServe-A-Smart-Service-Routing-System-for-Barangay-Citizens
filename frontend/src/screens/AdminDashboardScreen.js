import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ScrollView, Platform, StatusBar, Alert, Image, Animated,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  Search, LayoutList, CalendarDays, UserCircle,
  ChevronRight, LogOut, Info, HelpCircle, ShieldCheck,
  CheckCircle2, Clock4, XCircle, AlertTriangle, Zap,
  Inbox
} from 'lucide-react-native';

import { supabase } from '../services/supabase';

// ─── SLOT HELPERS ────────────────────────────────────────────
const DEFAULT_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM',  '4:00 PM',
];

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

function formatDayLabel(date) {
  return date.toLocaleDateString('en-PH', { weekday: 'short' });
}
function formatDayNumber(date) {
  return date.getDate().toString();
}
function formatFullDate(date) {
  return date.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
}
function dateKey(date) {
  return date.toISOString().split('T')[0];
}

function formatTimeForDisplay(dbTime) {
  const [hourStr, minuteStr] = dbTime.split(':');
  const hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${ampm}`;
}

function formatTimeForDB(displayTime) {
  const [time, ampm] = displayTime.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr);
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minuteStr}:00`;
}

// ─── CONFIG ──────────────────────────────────────────────────
const CATEGORIES = ['All', 'Medical', 'Documents', 'Complaint'];
const STATUSES   = ['All', 'Pending', 'Approved', 'Rejected'];

const PRIORITY_CONFIG = {
  HIGH:   { bg: '#FDECEA', text: '#B71C1C', border: '#EF9A9A', label: 'High'   },
  MEDIUM: { bg: '#FFF3E0', text: '#C35A00', border: '#FFD180', label: 'Medium' },
  LOW:    { bg: '#EBF5EB', text: '#1E6B1E', border: '#A5D6A7', label: 'Low'    },
};

const STATUS_CONFIG = {
  Pending:  { bg: '#FFF3E0', text: '#C35A00', dot: '#C35A00', border: '#FFD180' },
  Approved: { bg: '#EBF5EB', text: '#1E6B1E', dot: '#1E6B1E', border: '#A5D6A7' },
  Rejected: { bg: '#FDECEA', text: '#B71C1C', dot: '#B71C1C', border: '#EF9A9A' },
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
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();
    return () => rotation.stopAnimation();
  }, [rotation]);

  const rotateDeg = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(0,56,168,0.1)" strokeWidth={strokeW} fill="none" />
        <Path d={arcPath(-90, 30)}  stroke="#0038A8" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
        <Path d={arcPath(42, 162)}  stroke="#CE1126" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
        <Path d={arcPath(174, 294)} stroke="#F9C800" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

// ─── HEADER LOGO ─────────────────────────────────────────────
function HeaderLogo() {
  return (
    <View style={styles.headerLogoCircle}>
      <Image
        source={require('../../assets/IconLogo.jpeg')}
        style={styles.headerLogoImage}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── REQUESTS TAB ────────────────────────────────────────────
function RequestsTab({ navigation, requests, setRequests }) {
  const [category, setCategory] = useState('All');
  const [status,   setStatus]   = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id, category, service_requested, priority, status, description, submitted_at, user_id, intake_answers,
          users(first_name, last_name)
        `)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;

      const formatted = data.map(r => ({
        id: r.id.toString(),
        user_id: r.user_id,
        userName: r.users ? `${r.users.first_name} ${r.users.last_name}` : 'Unknown',
        category: r.category ?? '',
        subType: r.service_requested ?? '',
        priority: r.priority ?? 'LOW',
        status: r.status ?? 'Pending',
        description: r.description ?? '',
        timestamp: r.submitted_at,
        facility: '',
        action: 'SCHEDULE',
      }));

      setRequests(formatted);
    } catch (error) {
      console.log('Error fetching requests:', error.message);
      Alert.alert('Error', 'Failed to load requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = requests.filter(r =>
    (category === 'All' || r.category === category) &&
    (status   === 'All' || r.status   === status)
  );

  function StatusIcon({ status: s, size = 12 }) {
    if (s === 'Approved') return <CheckCircle2 size={size} color={STATUS_CONFIG.Approved.dot} style={{marginRight:4}}/>;
    if (s === 'Rejected') return <XCircle      size={size} color={STATUS_CONFIG.Rejected.dot} style={{marginRight:4}}/>;
    return <Clock4 size={size} color={STATUS_CONFIG.Pending.dot} style={{marginRight:4}}/>;
  }

  function PriorityIcon({ priority, size = 11 }) {
    if (priority === 'HIGH')   return <AlertTriangle size={size} color={PRIORITY_CONFIG.HIGH.text}   />;
    if (priority === 'MEDIUM') return <Zap           size={size} color={PRIORITY_CONFIG.MEDIUM.text} />;
    return <Info size={size} color={PRIORITY_CONFIG.LOW.text} />;
  }

  const renderCard = ({ item }) => {
    const p = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.LOW;
    const s = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.Pending;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RequestDetail', { request: item })}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={styles.cardNameRow}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>{item.userName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.userName}</Text>
                <Text style={styles.cardSub}>
                  {item.category} · {item.subType.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
              <StatusIcon status={item.status} />
              <Text style={[styles.statusText, { color: s.text }]}>{item.status}</Text>
            </View>
          </View>

          {item.description !== '' && (
            <View style={styles.cardDescBox}>
              <Text style={styles.cardDesc} numberOfLines={1}>"{item.description}"</Text>
            </View>
          )}

          <View style={styles.cardBottom}>
            <View style={[styles.priorityBadge, { backgroundColor: p.bg, borderColor: p.border }]}>
              <PriorityIcon priority={item.priority} />
              <Text style={[styles.priorityText, { color: p.text }]}>{p.label}</Text>
            </View>
            <Text style={styles.cardTime}>{formatDate(item.timestamp)}</Text>
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
            <TouchableOpacity key={c} style={[styles.categoryChip, category === c && styles.categoryChipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.categoryChipText, category === c && styles.categoryChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.segmentedBar}>
        {STATUSES.map(s => (
          <TouchableOpacity key={s} style={[styles.segment, status === s && styles.segmentActive]} onPress={() => setStatus(s)}>
            <Text style={[styles.segmentText, status === s && styles.segmentTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>
        {filtered.length} {filtered.length === 1 ? 'Record' : 'Records'} Found
      </Text>
      
      {loading ? (
        <View style={styles.emptyBox}>
          <EGovSpinner size={36} />
          <Text style={[styles.emptyText, { marginTop: 14 }]}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          onRefresh={() => fetchRequests(true)}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Inbox size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyText}>No requests found.</Text>
              <Text style={styles.emptySubText}>Try adjusting your filters.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── SLOTS TAB ───────────────────────────────────────────────
function SlotsTab() {
  const [selectedDate, setSelectedDate] = useState(WEEK_DATES[0]);
  const [slotData, setSlotData]     = useState({});
  const [loading, setLoading]      = useState(false);

  const key        = dateKey(selectedDate);
  const todaySlots = slotData[key] ?? {};
  const openCount  = DEFAULT_TIMES.filter(t => todaySlots[t] !== false).length;

  useEffect(() => {
    fetchSlotsForDate(selectedDate);
  }, [selectedDate]);

  const fetchSlotsForDate = async (date) => {
    const dk = dateKey(date);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('slot_time, is_available')
        .eq('slot_date', dk);
      
      if (error) throw error;

      const map = {};
      data.forEach(row =>{
        const display = formatTimeForDisplay(row.slot_time);
        map[display] = row.is_available;
      });
      setSlotData(prev => ({ ...prev, [dk]: map }));
    } catch (error) {
      console.log('Error fetching slots:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = async (time) => {
    const dk = dateKey(selectedDate);
    const current = slotData[dk]?.[time] !== false;
    const newVal = !current;

    setSlotData(prev => ({ ...prev, [dk]: { ...prev[dk], [time]: newVal } }));

    try {
      const { error } = await supabase 
        .from('time_slots')
        .upsert({ slot_date: dk, slot_time: formatTimeForDB(time), is_available: newVal }, { onConflict: 'slot_date,slot_time' });

      if (error) throw error;
    } catch (error) {
      setSlotData(prev => ({ ...prev, [dk]: { ...prev[dk], [time]: current } }));
      Alert.alert('Error', 'Failed to update slot. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={slotStyles.dateStripWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={slotStyles.dateStrip}>
          {WEEK_DATES.map((date, i) => {
            const isSelected = dateKey(date) === dateKey(selectedDate);
            const isToday    = dateKey(date) === dateKey(new Date());
            return (
              <TouchableOpacity key={i} style={[slotStyles.dateChip, isSelected && slotStyles.dateChipSelected]} onPress={() => setSelectedDate(date)} activeOpacity={0.7}>
                <Text style={[slotStyles.dateDayLabel, isSelected && slotStyles.dateLabelSelected]}>{formatDayLabel(date)}</Text>
                <Text style={[slotStyles.dateDayNumber, isSelected && slotStyles.dateLabelSelected]}>{formatDayNumber(date)}</Text>
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
          <Text style={slotStyles.openCountText}>{openCount} open</Text>
        </View>
      </View>

      <View style={slotStyles.divider} />

      {loading ? (
        <View style={[styles.emptyBox, { marginTop: 40 }]}>
          <EGovSpinner size={36} />
          <Text style={[styles.emptySubText, { marginTop: 14 }]}>Loading slots...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={slotStyles.slotList} showsVerticalScrollIndicator={false}>
          {DEFAULT_TIMES.map(time => {
            const isOpen = todaySlots[time] ?? true;
            const period = time.includes('AM') ? 'AM' : 'PM';
            const timeNum = time.replace(' AM','').replace(' PM','');
            return (
              <View key={time} style={[slotStyles.slotRow, isOpen && slotStyles.slotRowOpen]}>
                <View style={[slotStyles.slotTimeBlock, isOpen && slotStyles.slotTimeBlockOpen]}>
                  <Text style={[slotStyles.slotTimeNum, isOpen && slotStyles.slotTimeNumOpen]}>{timeNum}</Text>
                  <Text style={[slotStyles.slotTimePeriod, isOpen && slotStyles.slotTimePeriodOpen]}>{period}</Text>
                </View>

                <View style={slotStyles.slotLeft}>
                  <Text style={[slotStyles.slotStatus, { color: isOpen ? '#0F172A' : '#94A3B8' }]}>
                    {isOpen ? 'Open for booking' : 'Closed'}
                  </Text>
                </View>

                {/* Custom iOS-like switch */}
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
      )}
    </View>
  );
}

// ─── ACCOUNT TAB ─────────────────────────────────────────────
function AccountTab({ navigation }) {
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => { 
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', session.user.id)
          .single();
        if (!error && data) setAdminProfile(data);
      } catch (error) {
        console.log('Error fetching profile:', error.message);
      }
    };
    fetchProfile();
  }, []);

  const displayName = adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name}` : 'Admin';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.accountContainer} contentContainerStyle={styles.accountContent}>
      <View style={styles.accountCard}>
        <View style={styles.accountCardHeader}>
          <View style={styles.avatar}>
            <Image source={require('../../assets/IconLogo.jpeg')} style={styles.avatarImage} resizeMode="cover" />
          </View>
          <View style={styles.avatarBadge}>
            <ShieldCheck size={12} color="#0038A8" style={{ marginRight: 4 }} />
            <Text style={styles.avatarBadgeText}>ADMIN</Text>
          </View>
        </View>
        <View style={styles.accountCardBody}>
          <Text style={styles.accountName}>{displayName}</Text>
          <Text style={styles.accountEmail}>{adminProfile?.email ?? 'admin@komuniserve.com'}</Text>
        </View>
      </View>

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionLabel}>SYSTEM INFORMATION</Text>
        <View style={styles.accountItem}>
          <View style={styles.accountItemLeft}>
            <Info size={18} color="#64748B" style={{ marginRight: 12 }} />
            <Text style={styles.accountItemLabel}>App Version</Text>
          </View>
          <Text style={styles.accountItemValue}>7.12.0</Text>
        </View>
        <View style={[styles.accountItem, { borderBottomWidth: 0 }]}>
          <View style={styles.accountItemLeft}>
            <ShieldCheck size={18} color="#64748B" style={{ marginRight: 12 }} />
            <Text style={styles.accountItemLabel}>Role</Text>
          </View>
          <Text style={styles.accountItemValue}>Barangay Admin</Text>
        </View>
      </View>

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionLabel}>SUPPORT</Text>
        <TouchableOpacity style={styles.accountItem}>
          <View style={styles.accountItemLeft}>
            <HelpCircle size={18} color="#64748B" style={{ marginRight: 12 }} />
            <Text style={styles.accountItemLabel}>Help Center</Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.accountItem, { borderBottomWidth: 0 }]}>
          <View style={styles.accountItemLeft}>
            <ShieldCheck size={18} color="#64748B" style={{ marginRight: 12 }} />
            <Text style={styles.accountItemLabel}>Terms & Privacy</Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function AdminDashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Requests');
  const [requests, setRequests] = useState([]);

  const TAB_TITLES = {
    Requests: 'Service Requests',
    Slots:    'Slot Management',
    Account:  'My Account',
  };
  const TAB_SUBTITLES = {
    Requests: 'Manage incoming requests',
    Slots:    'Set appointment availability',
    Account:  'Admin profile & settings',
  };
  const TAB_ICONS = {
    Requests: LayoutList,
    Slots:    CalendarDays,
    Account:  UserCircle,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <HeaderLogo />
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{TAB_TITLES[activeTab]}</Text>
            <Text style={styles.headerSub}>{TAB_SUBTITLES[activeTab]}</Text>
          </View>
          {activeTab === 'Requests' && (
            <TouchableOpacity style={styles.searchIconBtn} onPress={() => navigation.navigate('Search', { requests })} activeOpacity={0.7}>
              <Search size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Requests' && <RequestsTab navigation={navigation} requests={requests} setRequests={setRequests} />}
        {activeTab === 'Slots'    && <SlotsTab />}
        {activeTab === 'Account'  && <AccountTab navigation={navigation} />}
      </View>

      {/* Floating iOS-Like Bottom Tab Bar */}
      <View style={styles.floatingTabBar}>
        {['Requests', 'Slots', 'Account'].map(tab => {
          const IconComp = TAB_ICONS[tab];
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={styles.floatingTabItem} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
              <View style={[styles.floatingTabIconBox, isActive && styles.floatingTabIconBoxActive]}>
                <IconComp size={22} color={isActive ? '#FFFFFF' : '#64748B'} strokeWidth={isActive ? 2.5 : 2} />
              </View>
              {isActive && <Text style={styles.floatingTabLabel}>{TAB_LABELS[tab]}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── SHARED & RECONSTRUCTED STYLES ───────────────────────────
const NAVY = '#0038A8';
const BACKGROUND = '#F8FAFC';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    backgroundColor: NAVY,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    gap: 14,
  },
  headerLogoCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: WHITE,
    justifyContent: 'center', alignItems: 'center',
  },
  headerLogoImage: { width: 44, height: 44, borderRadius: 22 },
  headerTextBlock: { flex: 1 },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#BFDBFE', fontSize: 12, marginTop: 2 },
  searchIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  categoryBar: { backgroundColor: WHITE, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: BACKGROUND, borderWidth: 1, borderColor: '#E2E8F0',
  },
  categoryChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  categoryChipTextActive: { color: WHITE },

  segmentedBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4,
  },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: WHITE, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  segmentText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  segmentTextActive: { color: NAVY, fontWeight: '700' },

  countText: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, color: '#94A3B8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // Padding bottom 100px para di matakpan ng Floating Tab
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }, 

  card: {
    backgroundColor: WHITE, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  cardInner: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12, marginRight: 8 },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarText: { color: NAVY, fontSize: 16, fontWeight: '800' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  cardDescBox: {
    backgroundColor: BACKGROUND, borderRadius: 8, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  cardDesc: { fontSize: 13, color: '#475569', fontStyle: 'italic' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cardTime: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  priorityText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { color: '#1E293B', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySubText: { color: '#64748B', fontSize: 14, textAlign: 'center' },

  // --- FLOATING TAB BAR ---
  floatingTabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20, right: 20,
    backgroundColor: WHITE,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  floatingTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  floatingTabIconBox: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  floatingTabIconBoxActive: { backgroundColor: NAVY },
  floatingTabLabel: { marginLeft: 8, color: NAVY, fontWeight: '700', fontSize: 13 },

  // --- ACCOUNT TAB STYLES ---
  accountContainer: { flex: 1 },
  accountContent: { padding: 20, paddingBottom: 100 },
  accountCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  accountCardHeader: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', marginBottom: -12, zIndex: 1, borderWidth: 4, borderColor: WHITE },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, zIndex: 2 },
  avatarBadgeText: { fontSize: 10, fontWeight: '800', color: NAVY, textTransform: 'uppercase' },
  accountCardBody: { alignItems: 'center', marginTop: 8 },
  accountName: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  accountEmail: { fontSize: 14, color: '#64748B', marginTop: 4 },
  
  accountSection: { marginBottom: 24 },
  accountSectionLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 8, marginLeft: 8, letterSpacing: 0.5 },
  accountItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: WHITE, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  accountItemLeft: { flexDirection: 'row', alignItems: 'center' },
  accountItemLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
  accountItemValue: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  
  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutBtnText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
});

const slotStyles = StyleSheet.create({
  dateStripWrapper: { backgroundColor: WHITE, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dateStrip: { paddingHorizontal: 16, gap: 12 },
  dateChip: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: BACKGROUND, borderWidth: 1, borderColor: '#E2E8F0' },
  dateChipSelected: { backgroundColor: NAVY, borderColor: NAVY, elevation: 4, shadowColor: '#0038A8', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
  dateDayLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  dateDayNumber: { fontSize: 20, color: '#0F172A', fontWeight: '800' },
  dateLabelSelected: { color: WHITE },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginTop: 6 },
  todayDotSelected: { backgroundColor: WHITE },

  selectedDateBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  selectedDateLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  selectedDateText: { fontSize: 16, color: '#0F172A', fontWeight: '700' },
  openCountBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  openCountText: { color: NAVY, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20 },

  slotList: { padding: 20, paddingBottom: 100 }, // Para sa Floating Tab
  slotRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  slotRowOpen: { backgroundColor: WHITE, borderColor: '#CBD5E1', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  slotTimeBlock: { alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 16 },
  slotTimeBlockOpen: { backgroundColor: '#EFF6FF' },
  slotTimeNum: { fontSize: 18, fontWeight: '800', color: '#94A3B8' },
  slotTimeNumOpen: { color: NAVY },
  slotTimePeriod: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
  slotTimePeriodOpen: { color: NAVY },
  
  slotLeft: { flex: 1 },
  slotStatus: { fontSize: 15, fontWeight: '700' },

  // Custom Toggle Switch 
  toggleTrack: { width: 50, height: 30, borderRadius: 15, padding: 2, justifyContent: 'center' },
  trackOn: { backgroundColor: '#22C55E' }, // Green for open
  trackOff: { backgroundColor: '#E2E8F0' },
  toggleThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: WHITE, elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  thumbOn: { alignSelf: 'flex-end' },
  thumbOff: { alignSelf: 'flex-start' },
});