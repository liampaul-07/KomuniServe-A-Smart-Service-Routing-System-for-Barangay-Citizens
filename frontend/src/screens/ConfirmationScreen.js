import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, StatusBar
} from 'react-native';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#C62828', bg: '#FFEBEE', label: '🚨 High Priority'   },
  MEDIUM: { color: '#E65100', bg: '#FFF8E1', label: '⚠️ Medium Priority' },
  LOW:    { color: '#2E7D32', bg: '#E8F5E9', label: '✅ Low Priority'    },
};

export default function ConfirmationScreen({ route, navigation }) {
  const { mode = 'appointment', category, subType, facility, date, time, priority } = route.params;
  const isReport = mode === 'report';
  const p = PRIORITY_CONFIG[priority];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>✓</Text>
        </View>

        <Text style={styles.title}>
          {isReport ? 'Report Submitted' : 'Appointment Submitted'}
        </Text>
        <Text style={styles.subtitle}>
          {isReport
            ? 'Your report has been successfully submitted to the barangay. Staff will review and act on your concern.'
            : 'Your appointment request has been submitted and is pending approval from barangay staff.'}
        </Text>

        <View style={styles.detailsCard}>
          <Row label="Service"  value={category} />
          {subType && (
            <Row label="Sub-Type" value={subType.replace(/_/g, ' ')} />
          )}
          <Row label="Facility" value={facility}  />
          <Row label="Date"     value={date}      />
          <Row label="Time"     value={time}      />
          <View style={styles.rowLast}>
            <Text style={styles.rowLabel}>Priority</Text>
            <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
              <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusNote}>
          <Text style={styles.statusNoteText}>
            You will be notified once the barangay staff approves or rejects your appointment.
          </Text>
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.replace('Decision')}
        >
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>

        {!isReport && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('AppointmentStatus')}
          >
            <Text style={styles.secondaryBtnText}>View My Appointments</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: {
    flex: 1, padding: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0047AB',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  iconText: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  title: {
    fontSize: 24, fontWeight: '800', color: '#1A1A2E',
    marginBottom: 10, textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, color: '#777', textAlign: 'center',
    lineHeight: 22, marginBottom: 28, paddingHorizontal: 10,
  },
  detailsCard: {
    width: '100%', backgroundColor: '#FFF',
    borderRadius: 16, paddingHorizontal: 16, marginBottom: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  rowLast: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 13,
  },
  rowLabel: { fontSize: 14, color: '#999' },
  rowValue: {
    fontSize: 14, fontWeight: '600', color: '#333',
    flexShrink: 1, textAlign: 'right', marginLeft: 16,
  },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityText:  { fontSize: 12, fontWeight: '700' },
  statusNote: {
    width: '100%', backgroundColor: '#EEF3FF',
    borderRadius: 12, padding: 14,
  },
  statusNoteText: {
    fontSize: 13, color: '#0047AB',
    textAlign: 'center', lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#0047AB',
    padding: 18, borderRadius: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: '#0047AB',
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  secondaryBtnText: { color: '#0047AB', fontWeight: '700', fontSize: 15 },
});