import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Platform, StatusBar, TextInput, ScrollView,
} from 'react-native';
import {
  ChevronLeft, Search, X, MapPin, ChevronRight,
  HeartPulse, FileText, Scale, Stethoscope, BookOpen,
  Home, ShieldAlert, Users, Construction, Droplets,
  Zap, Wrench, Volume2, MessageSquare, RoadCone, SearchX,
} from 'lucide-react-native';

// ─── Constants ────────────────────────────────────────────────────────────────
const NAVY       = '#0038A8';
const GOLD_LABEL = '#C8960C';

// ─── SERVICE DIRECTORY ───────────────────────────────────────
const SERVICES = [
  { id: 's1', category: 'Medical', name: 'Medical Consultation', subType: 'Checkup', description: 'Consult with a barangay health officer for physical concerns, checkups, or referrals.', facility: 'Barangay Health Center', action: 'SCHEDULE', priority: 'MEDIUM', requirements: ['Valid ID', 'PhilHealth ID (if available)', 'Previous prescriptions (if applicable)'] },
  { id: 's2', category: 'Documents', name: 'Barangay Clearance', subType: 'Clearance', description: 'Official clearance issued by the barangay for employment, business, or legal purposes.', facility: 'Barangay Hall — Records Office', action: 'SCHEDULE', priority: 'LOW', requirements: ['Valid ID', '2x2 ID picture', 'Community Tax Certificate (Cedula)'] },
  { id: 's3', category: 'Documents', name: 'Certificate of Indigency', subType: 'Indigency', description: 'Certifies that a resident is a low-income earner, used for government assistance applications.', facility: 'Barangay Hall — Records Office', action: 'SCHEDULE', priority: 'LOW', requirements: ['Valid ID', 'Certificate of Residency', 'Proof of income or affidavit of no income'] },
  { id: 's4', category: 'Documents', name: 'Certificate of Residency', subType: 'Residency', description: 'Confirms that a resident lives within the barangay.', facility: 'Barangay Hall — Records Office', action: 'SCHEDULE', priority: 'LOW', requirements: ['Valid ID', 'Proof of address (utility bill or lease contract)'] },
  { id: 's5', category: 'Documents', name: 'Good Moral Character', subType: 'Good_Moral', description: "Certifies a resident's good standing in the community, often required for employment or school.", facility: 'Barangay Hall — Records Office', action: 'SCHEDULE', priority: 'LOW', requirements: ['Valid ID', '2x2 ID picture'] },
  { id: 's6', category: 'Documents', name: 'Barangay Business Permit', subType: 'Business_Permit', description: 'Required clearance from the barangay before operating a business within its jurisdiction.', facility: 'Barangay Hall — Records Office', action: 'SCHEDULE', priority: 'LOW', requirements: ['Valid ID', 'DTI or SEC registration', 'Lease contract or proof of business address'] },
  { id: 'c1', category: 'Complaint', name: 'Noise or Public Disturbance', subType: 'Noise', description: 'Report excessive noise or public disturbances.', facility: 'Barangay Hall', priority: 'LOW', reportOnly: true, requirements: ['Valid ID', 'Brief description of the disturbance'] },
  { id: 'c2', category: 'Complaint', name: 'Property Dispute', subType: 'Property_Dispute', description: 'Report conflicts regarding property boundaries or ownership.', facility: 'Barangay Hall — Lupon', priority: 'MEDIUM', action: 'SCHEDULE', requirements: ['Valid ID', 'Brief description of the dispute', 'Property documents (title, photos, etc.)'] },
  { id: 'c3', category: 'Complaint', name: 'Physical Threat or Violence', subType: 'Physical_Threat', description: 'Report immediate physical threats or violence.', facility: 'Barangay Hall', priority: 'HIGH', action: 'SCHEDULE', requirements: ['Valid ID', 'Brief description of the incident', 'Any evidence (photos, messages, witness names)'] },
  { id: 'c4', category: 'Complaint', name: 'Domestic Issue', subType: 'Domestic_Issue', description: 'Report domestic abuse or household conflicts.', facility: 'Barangay Hall', priority: 'HIGH', action: 'SCHEDULE', requirements: ['Valid ID', 'Brief description of the situation'] },
  { id: 'c5', category: 'Complaint', name: 'Broken Water Pump', subType: 'Broken_Water_Pump', description: 'Report damaged barangay water facilities.', facility: 'Brgy. Infrastructure Office', priority: 'MEDIUM', reportOnly: true, requirements: ['Brief description', 'Location details'] },
  { id: 'c6', category: 'Complaint', name: 'Broken Electrical Wire', subType: 'Broken_Electrical_Wire', description: 'Report dangerous exposed or broken power lines.', facility: 'Brgy. Infrastructure Office', priority: 'HIGH', reportOnly: true, requirements: ['Brief description', 'Location details'] },
  { id: 'c7', category: 'Complaint', name: 'Eroded or Dangerous Road', subType: 'Eroded_Road', description: 'Report road hazards or severe damages.', facility: 'Brgy. Infrastructure Office', priority: 'HIGH', reportOnly: true, requirements: ['Brief description', 'Location details'] },
  { id: 'c8', category: 'Complaint', name: 'Other Infrastructure Issue', subType: 'Other_Infrastructure', description: 'Report other structural damages in the barangay.', facility: 'Brgy. Infrastructure Office', priority: 'MEDIUM', reportOnly: true, requirements: ['Brief description', 'Location details'] },
  { id: 'c9', category: 'Complaint', name: 'Other Concern', subType: 'Other', description: 'File a complaint not listed above.', facility: 'Barangay Hall', priority: 'LOW', reportOnly: true, hasUrgency: true, requirements: ['Valid ID', 'Brief description'] },
];

const CATEGORY_FILTERS = ['All', 'Medical', 'Documents', 'Complaint'];

const CATEGORY_COLORS = {
  Medical:   { bg: '#FFEBEE', text: '#C62828' },
  Documents: { bg: '#E8F5E9', text: '#2E7D32' },
  Complaint: { bg: '#FFF8E1', text: '#B45309' },
};

const PRIORITY_CONFIG = {
  HIGH:   { bg: '#FFF0EE', text: '#C0391B', label: 'HIGH' },
  MEDIUM: { bg: '#FFF8E1', text: '#B45309', label: 'MEDIUM' },
  LOW:    { bg: '#F0F4FF', text: '#3B5BBD', label: 'LOW' },
};

const SERVICE_ICONS = {
  Medical: HeartPulse, Checkup: Stethoscope, Clearance: BookOpen,
  Indigency: FileText, Residency: Home, Good_Moral: BookOpen,
  Business_Permit: FileText, Noise: Volume2, Property_Dispute: Home,
  Physical_Threat: ShieldAlert, Domestic_Issue: Users,
  Broken_Water_Pump: Droplets, Broken_Electrical_Wire: Zap,
  Eroded_Road: RoadCone, Other_Infrastructure: Construction,
  Other: MessageSquare, Documents: FileText, Complaint: Scale,
};

function getServiceIcon(item) {
  return SERVICE_ICONS[item.subType] || SERVICE_ICONS[item.category] || FileText;
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ item, onPress }) {
  const cc  = CATEGORY_COLORS[item.category] || { bg: '#F0F4FF', text: '#3B5BBD' };
  const pc  = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.LOW;
  const Icon = getServiceIcon(item);
  const isUrgent = item.priority === 'HIGH';

  return (
    <TouchableOpacity
      style={[styles.card, isUrgent && styles.cardUrgent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardInner}>
        {/* Icon box */}
        <View style={[styles.cardIconBox, isUrgent && styles.cardIconBoxUrgent]}>
          <Icon size={22} color={isUrgent ? '#C0391B' : NAVY} strokeWidth={1.8} />
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          {/* Top row: name + category badge */}
          <View style={styles.cardTopRow}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: cc.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: cc.text }]}>
                {item.category}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

          {/* Footer row: facility + priority */}
          <View style={styles.cardFooterRow}>
            <View style={styles.facilityRow}>
              <MapPin size={12} color="#A0ABBC" strokeWidth={2.2} />
              <Text style={styles.facilityText} numberOfLines={1}>{item.facility}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
              <Text style={[styles.priorityText, { color: pc.text }]}>{pc.label}</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <ChevronRight size={18} color="#C5D0E8" strokeWidth={2} style={styles.cardChevron} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DirectAccessScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = SERVICES.filter(s => {
    const matchesCategory = filter === 'All' || s.category === filter;
    const matchesSearch   = search.trim() === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>DIRECT ACCESS</Text>
          <Text style={styles.headerTitle}>Services</Text>
        </View>
        <View style={{ width: 64 }} />
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color="#8892AA" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a service or concern..."
            placeholderTextColor="#A0ABBC"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} activeOpacity={0.7}>
              <X size={16} color="#8892AA" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category filter chips ── */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORY_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Result count ── */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          <Text style={styles.countNumber}>{filtered.length}</Text>
          {' '}{filtered.length === 1 ? 'service' : 'services'} available
          {search.trim() !== '' ? ` for "${search}"` : ''}
        </Text>
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <ServiceCard
            item={item}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
          />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconBox}>
              <SearchX size={32} color="#8892AA" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find anything matching "{search}". Try a different term or category.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Slightly lighter, cleaner background
  },

  // ── Header ──────────────────────────────────────
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 16,
    paddingBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLabel: {
    color: GOLD_LABEL,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Search ──────────────────────────────────────
  searchWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F7',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E4E8F1',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1F36',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },

  // ── Filter chips ────────────────────────────────
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F7',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F4F8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: NAVY,
    elevation: 2,
    shadowColor: NAVY,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7A99',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // ── Count ───────────────────────────────────────
  countRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  countText: {
    fontSize: 13,
    color: '#8892AA',
    fontWeight: '500',
  },
  countNumber: {
    fontWeight: '700',
    color: NAVY,
  },

  // ── List ────────────────────────────────────────
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // ── Card ────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E8F1',
    borderLeftWidth: 4, 
    borderLeftColor: 'transparent', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardUrgent: {
    backgroundColor: '#FFFBF9',
    borderColor: '#FDE1D3',
    borderLeftColor: '#C0391B',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardIconBoxUrgent: {
    backgroundColor: '#FFE8D6',
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1F36',
    flex: 1,
    letterSpacing: 0.1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7A99',
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  facilityText: {
    fontSize: 12,
    color: '#8892AA',
    fontWeight: '500',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardChevron: {
    marginLeft: 2,
  },

  // ── Empty state ─────────────────────────────────
  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#EDF1F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7A99',
    textAlign: 'center',
    lineHeight: 22,
  },
});