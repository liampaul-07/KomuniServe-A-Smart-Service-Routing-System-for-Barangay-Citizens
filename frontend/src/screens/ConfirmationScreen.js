import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Platform, StatusBar, ScrollView
} from 'react-native';
import { CheckCircle2, Home, CalendarSearch, Info } from 'lucide-react-native';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#B71C1C', bg: '#FDECEA', border: '#EF9A9A', label: 'High Priority'   },
  MEDIUM: { color: '#C35A00', bg: '#FFF3E0', border: '#FFB347', label: 'Medium Priority' },
  LOW:    { color: '#1E6B1E', bg: '#EBF5EB', border: '#81C784', label: 'Low Priority'    },
};

export default function ConfirmationScreen({ route, navigation }) {
  const { mode = 'appointment', category, subType, facility, date, time, priority } = route.params;
  const isReport = mode === 'report';
  const p = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8FAFC" barStyle="dark-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* Success Animation Area */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <CheckCircle2 size={48} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.pulseCircle} />
          </View>

          <Text style={styles.title}>
            {isReport ? 'Report Submitted' : 'Request Received'}
          </Text>
          <Text style={styles.subtitle}>
            {isReport
              ? 'Your report has been successfully submitted to the barangay. Staff will review and act on your concern shortly.'
              : 'Your appointment request has been submitted and is currently pending approval from barangay staff.'}
          </Text>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>DETAILS SUMMARY</Text>
            </View>
            
            <View style={styles.cardBody}>
              <Row label="Service Category" value={category} />
              {subType && (
                <Row label="Request Type" value={subType.replace(/_/g, ' ')} />
              )}
              <Row label="Target Facility" value={facility}  />
              <Row label="Schedule Date"   value={date}      />
              <Row label="Schedule Time"   value={time}      />
              
              <View style={styles.rowLast}>
                <Text style={styles.rowLabel}>Priority Level</Text>
                <View style={[styles.priorityPill, { backgroundColor: p.bg, borderColor: p.border }]}>
                  <Text style={[styles.priorityPillText, { color: p.color }]}>
                    {p.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.statusNote}>
            <Info size={18} color="#0038A8" style={{ marginRight: 10 }} />
            <Text style={styles.statusNoteText}>
              You will receive a notification once the staff updates the status of your request.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.replace('Decision')}
          activeOpacity={0.8}
        >
          <Home size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>

        {!isReport && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('AppointmentStatus')}
            activeOpacity={0.7}
          >
            <CalendarSearch size={20} color="#0038A8" style={{ marginRight: 8 }} />
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

// ─── STYLES ──────────────────────────────────────────────────
const NAVY = '#0038A8';
const BACKGROUND = '#F8FAFC';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1, 
    padding: 24,
    alignItems: 'center', 
    justifyContent: 'center',
  },
  
  // Icon & Animation
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 84, 
    height: 84, 
    borderRadius: 42,
    backgroundColor: '#10B981', // Success Green
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 2,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pulseCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D1FAE5',
    zIndex: 1,
  },

  title: {
    fontSize: 26, 
    fontWeight: '800', 
    color: '#0F172A',
    marginBottom: 12, 
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, 
    color: '#64748B', 
    textAlign: 'center',
    lineHeight: 22, 
    marginBottom: 32, 
    paddingHorizontal: 15,
  },

  // Details Card
  detailsCard: {
    width: '100%', 
    backgroundColor: WHITE,
    borderRadius: 20, 
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.04,
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  cardBody: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
  },
  rowLast: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingVertical: 15,
  },
  rowLabel: { 
    fontSize: 13, 
    fontWeight: '600',
    color: '#94A3B8' 
  },
  rowValue: {
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1E293B',
    flexShrink: 1, 
    textAlign: 'right', 
    marginLeft: 16,
  },
  priorityPill: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityPillText: { 
    fontSize: 12, 
    fontWeight: '800',
    textTransform: 'uppercase'
  },

  // Note box
  statusNote: {
    flexDirection: 'row',
    width: '100%', 
    backgroundColor: '#EFF6FF',
    borderRadius: 16, 
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statusNoteText: {
    flex: 1,
    fontSize: 13, 
    color: NAVY,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: WHITE,
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    height: 56,
    borderRadius: 16, 
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtnText: { 
    color: WHITE, 
    fontWeight: '700', 
    fontSize: 16 
  },
  secondaryBtn: {
    flexDirection: 'row',
    borderWidth: 2, 
    borderColor: NAVY,
    height: 54, 
    borderRadius: 16, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { 
    color: NAVY, 
    fontWeight: '700', 
    fontSize: 15 
  },
});