import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Platform, StatusBar
} from 'react-native';

// Scoring: how closely does the query match the name?
// Higher score = better match = appears first
function scoreMatch(name, query) {
  const n = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (n === q)           return 4; // exact
  if (n.startsWith(q))   return 3; // starts with
  if (n.includes(' ' + q)) return 2; // starts with any word
  if (n.includes(q))     return 1; // contains
  return 0;
}

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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SearchScreen({ route, navigation }) {
  const { requests } = route.params;
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  // Auto-focus the input when screen opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    const scored = requests
      .map(r => ({ ...r, score: scoreMatch(r.userName, q) }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);

    setResults(scored);
  }, [query]);

  const renderCard = ({ item }) => {
    const p = PRIORITY_CONFIG[item.priority];
    const s = STATUS_CONFIG[item.status];

    // Highlight matched portion of name
    const lowerName  = item.userName.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    const matchIndex = lowerName.indexOf(lowerQuery);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RequestDetail', { request: item })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          {/* Highlighted name */}
          <Text style={styles.cardName}>
            {matchIndex >= 0 ? (
              <>
                {item.userName.slice(0, matchIndex)}
                <Text style={styles.highlight}>
                  {item.userName.slice(matchIndex, matchIndex + query.trim().length)}
                </Text>
                {item.userName.slice(matchIndex + query.trim().length)}
              </>
            ) : (
              item.userName
            )}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
            <Text style={[styles.statusText, { color: s.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardSub}>
          {item.category} · {item.subType.replace(/_/g, ' ')}
        </Text>

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
    <SafeAreaView style={styles.container}>

      {/* Search bar header */}
      <View style={styles.header}>
        <View style={styles.inputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search by name..."
            placeholderTextColor="#AAA"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Results / empty states */}
      {query.trim() === '' ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Search residents</Text>
          <Text style={styles.emptySubtitle}>Type a name to find their requests.</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🤷</Text>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>No resident found matching "{query}".</Text>
        </View>
      ) : (
        <>
          <Text style={styles.countText}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </Text>
          <FlatList
            data={results}
            keyExtractor={i => i.id}
            renderItem={renderCard}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  input:      { flex: 1, fontSize: 15, color: '#333', paddingVertical: 0 },
  clearBtn:   { paddingLeft: 8 },
  clearText:  { color: '#BBB', fontSize: 13, fontWeight: '600' },
  cancelBtn:  { paddingVertical: 6 },
  cancelText: { color: '#0047AB', fontWeight: '700', fontSize: 15 },

  // Empty states
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60,
  },
  emptyIcon:     { fontSize: 40, marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', paddingHorizontal: 40 },

  countText: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
    color: '#AAA', fontSize: 12,
  },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  // Card
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    marginBottom: 10, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardName:   { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  highlight:  { color: '#0047AB', backgroundColor: '#EEF3FF' },
  cardSub:    { fontSize: 13, color: '#777', marginBottom: 5 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  cardTime:   { fontSize: 12, color: '#BBB' },

  statusBadge:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 5 },
  statusDot:     { width: 6, height: 6, borderRadius: 3 },
  statusText:    { fontSize: 12, fontWeight: '700' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityText:  { fontSize: 12, fontWeight: '700' },
});