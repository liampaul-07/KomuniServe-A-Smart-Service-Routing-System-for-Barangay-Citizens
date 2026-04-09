import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Platform, StatusBar, TextInput
} from 'react-native';

// ─── SERVICE DIRECTORY ───────────────────────────────────────
// TODO: Replace with → supabase.from('services').select('*')
const SERVICES = [
  {
    id: 's1',
    category:     'Medical',
    name:         'Medical Consultation',
    description:  'Consult with a barangay health officer for physical concerns, checkups, or referrals.',
    icon:         '🏥',
    facility:     'Barangay Health Center',
    action:       'SCHEDULE',
    priority:     'MEDIUM',
    requirements: [
      'Valid ID',
      'PhilHealth ID (if available)',
      'Previous prescriptions (if applicable)',
    ],
  },
  {
    id: 's2',
    category:     'Documents',
    name:         'Barangay Clearance',
    description:  'Official clearance issued by the barangay for employment, business, or legal purposes.',
    icon:         '📋',
    facility:     'Barangay Hall — Records Office',
    action:       'SCHEDULE',
    priority:     'LOW',
    requirements: [
      'Valid ID',
      '2x2 ID picture',
      'Community Tax Certificate (Cedula)',
    ],
  },
  {
    id: 's3',
    category:     'Documents',
    name:         'Certificate of Indigency',
    description:  'Certifies that a resident is a low-income earner, used for government assistance applications.',
    icon:         '📋',
    facility:     'Barangay Hall — Records Office',
    action:       'SCHEDULE',
    priority:     'LOW',
    requirements: [
      'Valid ID',
      'Certificate of Residency',
      'Proof of income or affidavit of no income',
    ],
  },
  {
    id: 's4',
    category:     'Documents',
    name:         'Certificate of Residency',
    description:  'Confirms that a resident lives within the barangay.',
    icon:         '📋',
    facility:     'Barangay Hall — Records Office',
    action:       'SCHEDULE',
    priority:     'LOW',
    requirements: [
      'Valid ID',
      'Proof of address (utility bill or lease contract)',
    ],
  },
  {
    id: 's5',
    category:     'Documents',
    name:         'Good Moral Character',
    description:  'Certifies a resident\'s good standing in the community, often required for employment or school.',
    icon:         '📋',
    facility:     'Barangay Hall — Records Office',
    action:       'SCHEDULE',
    priority:     'LOW',
    requirements: [
      'Valid ID',
      '2x2 ID picture',
    ],
  },
  {
    id: 's6',
    category:     'Documents',
    name:         'Barangay Business Permit',
    description:  'Required clearance from the barangay before operating a business within its jurisdiction.',
    icon:         '📋',
    facility:     'Barangay Hall — Records Office',
    action:       'SCHEDULE',
    priority:     'LOW',
    requirements: [
      'Valid ID',
      'DTI or SEC registration',
      'Lease contract or proof of business address',
    ],
  },
  {
    id: 's7',
    category:     'Complaint',
    name:         'File a Complaint',
    description:  'Report a dispute, disturbance, or infrastructure problem to the barangay for mediation or action.',
    icon:         '⚖️',
    facility:     'Barangay Hall',
    action:       'SCHEDULE',
    priority:     'MEDIUM',
    requirements: [
      'Valid ID',
      'Brief description of the complaint',
      'Any supporting evidence (photos, documents) if available',
    ],
  },
];

const CATEGORY_FILTERS = ['All', 'Medical', 'Documents', 'Complaint'];

const CATEGORY_COLORS = {
  Medical:   { bg: '#FFEBEE', text: '#C62828' },
  Documents: { bg: '#E8F5E9', text: '#2E7D32' },
  Complaint: { bg: '#FFF8E1', text: '#E65100' },
};

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

  const renderService = ({ item }) => {
    const cc = CATEGORY_COLORS[item.category];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        activeOpacity={0.75}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: cc.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: cc.text }]}>
                {item.category}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.facilityText}>📍 {item.facility}</Text>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#AAA"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <View style={styles.filterBar}>
        {CATEGORY_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Result count */}
      <Text style={styles.countText}>
        {filtered.length} {filtered.length === 1 ? 'service' : 'services'}
        {search.trim() !== '' ? ` for "${search}"` : ''}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderService}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term or category.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

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

  // Search
  searchWrapper: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333', paddingVertical: 0 },
  clearBtn:    { paddingLeft: 8 },
  clearText:   { color: '#BBB', fontSize: 13, fontWeight: '600' },

  // Filter
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterChip: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F2F8',
  },
  filterChipActive:     { backgroundColor: '#0047AB' },
  filterChipText:       { fontSize: 13, fontWeight: '600', color: '#555' },
  filterChipTextActive: { color: '#FFF' },

  countText: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 2,
    color: '#AAA', fontSize: 12,
  },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30 },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLeft: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F2F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIcon:   { fontSize: 22 },
  cardBody:   { flex: 1 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  cardName:   { fontSize: 15, fontWeight: '700', color: '#1A1A2E', flex: 1, marginRight: 8 },
  cardDesc:   { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  facilityText:  { fontSize: 12, color: '#999', flex: 1 },
  arrowText:     { fontSize: 16, color: '#0047AB', fontWeight: 'bold' },

  categoryBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyBox:      { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIcon:     { fontSize: 40, marginBottom: 14 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 20 },
});