import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, StatusBar, TextInput, Alert
} from 'react-native';
import { MessageSquare, Send } from 'lucide-react-native';
import { processRequest } from '../services/RuleEngine';
import { supabase } from '../services/supabase';

const ACTION_CONFIG = {
  SCHEDULE:     { label: 'Book an Appointment', subLabel: 'Pick a date and time slot.', color: '#0047AB' },
  WALK_IN:      { label: 'Walk In', subLabel: 'No appointment needed. Go directly to the facility.', color: '#2E7D32' },
  SUBMIT_REPORT:{ label: 'Submit Report', subLabel: 'Provide details and submit your report.', color: '#E65100' },
};

const CATEGORY_COLORS = {
  Medical:   { bg: '#FFEBEE', text: '#C62828' },
  Documents: { bg: '#E8F5E9', text: '#2E7D32' },
  Complaint: { bg: '#FFF8E1', text: '#E65100' },
};

const PRIORITY_CONFIG = {
  HIGH:   { color: '#C62828', bg: '#FFEBEE', label: '🚨 High Priority'   },
  MEDIUM: { color: '#E65100', bg: '#FFF8E1', label: '⚠️ Medium Priority' },
  LOW:    { color: '#2E7D32', bg: '#E8F5E9', label: '✅ Low Priority'    },
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { service } = route.params;

  const categoryColor  = CATEGORY_COLORS[service.category];
  const priorityConfig = PRIORITY_CONFIG[service.priority];
  const actionConfig   = ACTION_CONFIG[service.action] ?? ACTION_CONFIG.SCHEDULE;

  const [description, setDescription] = useState('');

  const defaultUrgency =
    service.priority === 'HIGH'   ? 'High'   :
    service.priority === 'MEDIUM' ? 'Medium' : 'Low';
  const [urgency, setUrgency] = useState(defaultUrgency);

  const isReportOnly       = service.reportOnly === true;
  const isBookingComplaint = service.category === 'Complaint' && !isReportOnly;
  const showUrgency        = service.hasUrgency === true; // Other Concern only

  // ── Group A: submit report directly to DB ─────────────────
  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your concern before submitting.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { Alert.alert('Error', 'You must be logged in.'); return; }

      const subType = service.subType ?? service.name;
      const result  = processRequest({
        category:    service.category,
        subType,
        urgency:     defaultUrgency,
        description: description.trim(),
      });

      const { error } = await supabase.from('requests').insert({
        user_id:           session.user.id,
        category:          service.category,
        service_requested: subType,
        priority:          result.priority,
        intake_answers:    { ...result, subType, urgency: defaultUrgency, category: service.category, description: description.trim() },
        status:            'Pending',
        description:       description.trim(),
        submitted_at:      new Date().toISOString(),
      });

      if (error) throw error;

      navigation.replace('Confirmation', {
        mode:     'report',
        category: service.category,
        subType,
        facility: result.facility,
        priority: result.priority,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  // ── Group B: go to BookAppointment ────────────────────────
  const handleBookAppointment = () => {
    const subType = service.subType ?? service.name;
    const result  = processRequest({
      category:    service.category,
      subType,
      urgency,
      description: '',
    });
    navigation.navigate('BookAppointment', {
      result,
      category:    service.category,
      subType,
      urgency,
      description: '',
    });
  };

  // ── Medical / Documents: go through ResultScreen ──────────
  const handleAction = () => {
    const subType = service.subType ?? service.name;
    const result  = processRequest({
      category:    service.category,
      subType,
      urgency,
      description: '',
    });
    navigation.navigate('Result', {
      result,
      category:    service.category,
      subType,
      urgency,
      description: '',
    });
  };

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Identity card — always shown */}
        <View style={styles.identityCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{service.icon}</Text>
          </View>
          <View style={styles.identityBody}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryColor.text }]}>
                {service.category}
              </Text>
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDesc}>{service.description}</Text>
          </View>
        </View>

        {/* ── GROUP A: Noise + Infra — input only, no urgency ── */}
        {isReportOnly && !showUrgency && (
          <View style={styles.inputGroup}>
            <View style={styles.inputCard}>
              <View style={styles.inputCardBody}>
                <MessageSquare size={18} color="#8A94A6" strokeWidth={1.8} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInCard}
                  placeholder="Describe your concern briefly..."
                  placeholderTextColor="#B0B8C9"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
              </View>
            </View>
            <Text style={styles.inputHint}>
              Provide a concise description to help the barangay act on your report efficiently.
            </Text>
          </View>
        )}

        {/* ── OTHER CONCERN: input + urgency ── */}
        {isReportOnly && showUrgency && (
          <View style={styles.inputGroup}>
            <View style={styles.inputCard}>
              <View style={styles.inputCardBody}>
                <MessageSquare size={18} color="#8A94A6" strokeWidth={1.8} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputInCard}
                  placeholder="Describe your concern briefly..."
                  placeholderTextColor="#B0B8C9"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
              </View>
            </View>
            <Text style={styles.sectionTitle}>Urgency Level</Text>
            <View style={styles.urgencyRow}>
              {['Low', 'Medium', 'High'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[styles.urgencyChip, urgency === level && styles.urgencyChipActive]}
                  onPress={() => setUrgency(level)}
                >
                  <Text style={[styles.urgencyText, urgency === level && styles.urgencyTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputHint}>
              Provide a concise description to help the barangay act on your report efficiently.
            </Text>
          </View>
        )}

        {/* ── GROUP B: Property Dispute, Physical Threat, Domestic Issue — no input ── */}
        {isBookingComplaint && (
          <>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Facility</Text>
                <Text style={styles.metaValue}>📍 {service.facility}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
                <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                  {priorityConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bring these to your appointment</Text>
              <View style={styles.requirementsCard}>
                {(service.requirements ?? []).map((req, i) => (
                  <View key={i} style={styles.requirementRow}>
                    <View style={styles.requirementDot} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.officeHoursCard}>
              <Text style={styles.officeHoursIcon}>🕐</Text>
              <Text style={styles.officeHoursText}>
                Office hours: Monday – Friday, 8:00 AM – 5:00 PM
              </Text>
            </View>
          </>
        )}

        {/* ── MEDICAL / DOCUMENTS — no input ── */}
        {!isReportOnly && !isBookingComplaint && (
          <>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Facility</Text>
                <Text style={styles.metaValue}>📍 {service.facility}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
                <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                  {priorityConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <View style={styles.requirementsCard}>
                {(service.requirements ?? []).map((req, i) => (
                  <View key={i} style={styles.requirementRow}>
                    <View style={styles.requirementDot} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What to expect</Text>
              <View style={styles.expectCard}>
                <Text style={styles.expectText}>
                  {service.action === 'SCHEDULE'
                    ? 'You will need to book an appointment. Staff will review your request and confirm your schedule. Bring all requirements on your appointment date.'
                    : 'No appointment needed. Proceed directly to the facility during office hours and bring your requirements.'}
                </Text>
              </View>
            </View>

            <View style={styles.officeHoursCard}>
              <Text style={styles.officeHoursIcon}>🕐</Text>
              <Text style={styles.officeHoursText}>
                Office hours: Monday – Friday, 8:00 AM – 5:00 PM
              </Text>
            </View>
          </>
        )}

      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {isReportOnly ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: '#0047AB' },
              !description.trim() && styles.actionBtnDisabled,
            ]}
            onPress={handleSubmitReport}
            disabled={!description.trim()}
          >
            <Send size={16} color="#FFF" strokeWidth={2} style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Submit Report</Text>
          </TouchableOpacity>
        ) : isBookingComplaint ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#0047AB' }]}
            onPress={handleBookAppointment}
          >
            <Text style={styles.actionBtnText}>Book a Mediation Appointment</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: actionConfig.color }]}
            onPress={handleAction}
          >
            <Text style={styles.actionBtnText}>{actionConfig.label}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.actionSubLabel}>
          {isReportOnly
            ? 'Your report will be submitted to the barangay for action.'
            : isBookingComplaint
              ? 'Staff will mediate your concern on your scheduled date.'
              : actionConfig.subLabel}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 12, backgroundColor: '#0047AB',
  },
  backBtn:     { padding: 4 },
  backBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  headerTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  content: { padding: 20, paddingBottom: 40 },

  identityCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 14,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: '#F0F2F8',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  iconText:          { fontSize: 28 },
  identityBody:      {},
  categoryBadge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  categoryBadgeText: { fontSize: 12, fontWeight: '700' },
  serviceName:       { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  serviceDesc:       { fontSize: 14, color: '#777', lineHeight: 21 },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 1,
  },
  metaItem:      { flex: 1, marginRight: 10 },
  metaLabel:     { fontSize: 11, color: '#AAA', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  metaValue:     { fontSize: 13, fontWeight: '600', color: '#444' },
  priorityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  priorityText:  { fontSize: 12, fontWeight: '700' },

  section:      { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  requirementsCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  requirementRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  requirementDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0047AB', marginTop: 6, flexShrink: 0 },
  requirementText:{ fontSize: 14, color: '#333', flex: 1, lineHeight: 21 },

  expectCard: { backgroundColor: '#EEF3FF', borderRadius: 14, padding: 16 },
  expectText: { fontSize: 14, color: '#0047AB', lineHeight: 21 },

  officeHoursCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#EEE', marginBottom: 14,
  },
  officeHoursIcon: { fontSize: 16 },
  officeHoursText: { fontSize: 13, color: '#888' },

  inputSection: { marginTop: 6, marginBottom: 10 },
  textInput: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E4E9F2',
    borderRadius: 10, padding: 14, fontSize: 15, color: '#333',
    minHeight: 100, textAlignVertical: 'top',
  },

  // ── GuidedIntake-style input card (Group A) ──────────────
  inputGroup:   { gap: 12, marginTop: 4 },
  inputCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E9F2',
    borderRadius: 8, overflow: 'hidden',
  },
  inputCardBody: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  inputIcon:     { marginTop: 2, flexShrink: 0 },
  textInputInCard: {
    flex: 1, fontSize: 15, color: '#1A2340', lineHeight: 22, minHeight: 100,
  },
  inputHint: { fontSize: 12, color: '#8A94A6', lineHeight: 18, letterSpacing: 0.1 },

  urgencyRow: { flexDirection: 'row', gap: 10 },
  urgencyChip: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#E4E9F2', alignItems: 'center', backgroundColor: '#FFF',
  },
  urgencyChipActive:  { backgroundColor: '#0047AB', borderColor: '#0047AB' },
  urgencyText:        { fontSize: 14, color: '#666', fontWeight: '600' },
  urgencyTextActive:  { color: '#FFF', fontWeight: '600' },

  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  actionBtn: {
    padding: 18, borderRadius: 14, alignItems: 'center',
    marginBottom: 8, flexDirection: 'row', justifyContent: 'center',
  },
  actionBtnDisabled: { backgroundColor: '#B0B8C9' },
  actionBtnText:     { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  actionSubLabel:    { fontSize: 13, color: '#AAA', textAlign: 'center' },
});