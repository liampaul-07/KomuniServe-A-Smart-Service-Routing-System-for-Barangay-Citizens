import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#D32F2F', bg: '#FFEBEE', label: '🚨 High Priority' },
  MEDIUM: { color: '#F57C00', bg: '#FFF3E0', label: '⚠️ Medium Priority' },
  LOW:    { color: '#388E3C', bg: '#E8F5E9', label: '✅ Low Priority' },
};

const ACTION_LABELS = {
  SCHEDULE:      'Book an Appointment',
  WALK_IN:       'Proceed to Barangay Hall',
  SUBMIT_REPORT: 'Submit Report',
};

export default function ResultScreen({ route, navigation }) {
  const { result, category } = route.params;
  const config = PRIORITY_CONFIG[result.priority];

  const handleAction = () => {
    if (result.action === 'SCHEDULE') {
      // TODO: navigate to BookAppointment screen when built
      // navigation.navigate('BookAppointment', { category, result });
      console.log('Navigate to booking — not built yet');
    } else if (result.action === 'SUBMIT_REPORT') {
      // TODO: save report to Supabase when connected
      // await supabase.from('requests').insert({ ... });
      Alert.alert(
        'Report Submitted',
        'Your report has been logged. Barangay staff will be notified.',
        [{ text: 'OK', onPress: () => navigation.navigate('Decision') }]
      );
    } else {
      navigation.navigate('Decision');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Decision')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Hub</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>

        <Text style={styles.categoryLabel}>{category}</Text>
        <Text style={styles.title}>Service Assessment</Text>

        <View style={[styles.priorityBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.priorityText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        {/* Facility */}
        <View style={styles.facilityRow}>
          <Text style={styles.facilityIcon}>📍</Text>
          <Text style={styles.facilityText}>{result.facility}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsHeading}>What to do:</Text>
          <Text style={styles.instructionsText}>{result.instructions}</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: config.color }]}
          onPress={handleAction}
        >
          <Text style={styles.actionBtnText}>
            {ACTION_LABELS[result.action] ?? 'Proceed'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('GuidedPath')}
        >
          <Text style={styles.secondaryBtnText}>Start Over</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 10,
  },
  backBtn: { padding: 10, marginLeft: -10 },
  backBtnText: { color: '#0047AB', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 30, flex: 1, justifyContent: 'center' },
  categoryLabel: { fontSize: 14, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 24 },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  priorityText: { fontWeight: 'bold', fontSize: 15 },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  facilityIcon: { fontSize: 16 },
  facilityText: { fontSize: 15, color: '#555', fontWeight: '600' },
  instructionsCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  instructionsHeading: { fontSize: 13, fontWeight: 'bold', color: '#999', marginBottom: 8, textTransform: 'uppercase' },
  instructionsText: { fontSize: 17, color: '#333', lineHeight: 26 },
  actionBtn: { padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  secondaryBtn: { alignItems: 'center', padding: 12 },
  secondaryBtnText: { color: '#999', fontSize: 15 },
});