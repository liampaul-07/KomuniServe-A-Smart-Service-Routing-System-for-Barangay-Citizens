import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, StatusBar, TextInput, Alert, KeyboardAvoidingView
} from 'react-native';
import { 
  MessageSquare, Send, ArrowLeft, MapPin, 
  Clock, FileText, ChevronRight, CheckCircle2 
} from 'lucide-react-native';
import { processRequest } from '../services/RuleEngine';
import { supabase } from '../services/supabase';

// ─── CONFIGURATIONS ──────────────────────────────────────────
const ACTION_CONFIG = {
  SCHEDULE:     { label: 'Book an Appointment', subLabel: 'Pick a date and time slot.', color: '#0038A8' },
  WALK_IN:      { label: 'Walk In', subLabel: 'No appointment needed. Go directly to the facility.', color: '#10B981' },
  SUBMIT_REPORT:{ label: 'Submit Report', subLabel: 'Provide details and submit your report.', color: '#F59E0B' },
};

const CATEGORY_COLORS = {
  Medical:   { bg: '#FEE2E2', text: '#DC2626' },
  Documents: { bg: '#D1FAE5', text: '#059669' },
  Complaint: { bg: '#FEF3C7', text: '#D97706' },
};

const PRIORITY_CONFIG = {
  HIGH:   { color: '#B71C1C', bg: '#FDECEA', border: '#EF9A9A', label: 'High Priority'   },
  MEDIUM: { color: '#C35A00', bg: '#FFF3E0', border: '#FFB347', label: 'Medium Priority' },
  LOW:    { color: '#1E6B1E', bg: '#EBF5EB', border: '#81C784', label: 'Low Priority'    },
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { service } = route.params;

  const categoryColor  = CATEGORY_COLORS[service.category] || { bg: '#F1F5F9', text: '#475569' };
  const priorityConfig = PRIORITY_CONFIG[service.priority] || PRIORITY_CONFIG.LOW;
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
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" />
      
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>SERVICE DETAILS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{service.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Identity card ── */}
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
                  <MessageSquare size={18} color="#94A3B8" strokeWidth={1.8} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputInCard}
                    placeholder="Describe your concern briefly..."
                    placeholderTextColor="#94A3B8"
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
                  <MessageSquare size={18} color="#94A3B8" strokeWidth={1.8} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputInCard}
                    placeholder="Describe your concern briefly..."
                    placeholderTextColor="#94A3B8"
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
                    activeOpacity={0.7}
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

          {/* ── Meta & Info Area (For Appts and Docs) ── */}
          {(!isReportOnly) && (
            <>
              <View style={styles.metaCard}>
                <View style={styles.metaRowItem}>
                  <View style={styles.metaIconBox}>
                    <MapPin size={18} color="#0038A8" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Facility</Text>
                    <Text style={styles.metaValue}>{service.facility}</Text>
                  </View>
                </View>
                
                <View style={styles.metaDivider} />
                
                <View style={styles.metaRowItem}>
                  <View style={[styles.priorityPill, { backgroundColor: priorityConfig.bg, borderColor: priorityConfig.border }]}>
                    <View style={[styles.priorityDot, { backgroundColor: priorityConfig.color }]} />
                    <Text style={[styles.priorityPillText, { color: priorityConfig.color }]}>
                      {priorityConfig.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Requirements */}
              {(service.requirements && service.requirements.length > 0) && (
                <View style={styles.infoCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardIconBox}>
                      <FileText size={16} color="#0038A8" strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>
                      {isBookingComplaint ? 'Bring these to your appointment' : 'Requirements'}
                    </Text>
                  </View>
                  <View style={styles.requirementsList}>
                    {service.requirements.map((req, i) => (
                      <View key={i} style={styles.requirementRow}>
                        <CheckCircle2 size={16} color="#0038A8" style={styles.reqIcon} />
                        <Text style={styles.requirementText}>{req}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Expectations (Only for Non-Complaint) */}
              {!isBookingComplaint && (
                <View style={styles.infoCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardIconBox}>
                      <MessageSquare size={16} color="#0038A8" strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>What to expect</Text>
                  </View>
                  <Text style={styles.expectText}>
                    {service.action === 'SCHEDULE'
                      ? 'You will need to book an appointment. Staff will review your request and confirm your schedule. Bring all requirements on your appointment date.'
                      : 'No appointment needed. Proceed directly to the facility during office hours and bring your requirements.'}
                  </Text>
                </View>
              )}

              {/* Office Hours */}
              <View style={styles.officeHoursCard}>
                <Clock size={18} color="#64748B" strokeWidth={2} />
                <Text style={styles.officeHoursText}>
                  Office hours: Monday – Friday, 8:00 AM – 5:00 PM
                </Text>
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {isReportOnly ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: '#0038A8' },
              !description.trim() && styles.actionBtnDisabled,
            ]}
            onPress={handleSubmitReport}
            disabled={!description.trim()}
            activeOpacity={0.85}
          >
            <Send size={18} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Submit Report</Text>
          </TouchableOpacity>
        ) : isBookingComplaint ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#0038A8' }]}
            onPress={handleBookAppointment}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>Book a Mediation</Text>
            <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: actionConfig.color }]}
            onPress={handleAction}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>{actionConfig.label}</Text>
            <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
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

// ─── STYLES ──────────────────────────────────────────────────
const NAVY = '#0038A8';
const BACKGROUND = '#F8FAFC';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BACKGROUND 
  },
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  backBtn: { 
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  content: { 
    padding: 20, 
    paddingBottom: 40 
  },
  identityCard: {
    flexDirection: 'row',
    backgroundColor: WHITE, 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.03, 
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 60, 
    height: 60, 
    borderRadius: 16, 
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16,
  },
  iconText: { 
    fontSize: 32 
  },
  identityBody: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryBadge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  categoryBadgeText: { 
    fontSize: 11, 
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceName: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0F172A', 
    marginBottom: 6 
  },
  serviceDesc: { 
    fontSize: 14, 
    color: '#64748B', 
    lineHeight: 20 
  },

  metaCard: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: WHITE, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaRowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metaDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  metaLabel: { 
    fontSize: 10, 
    color: '#94A3B8', 
    textTransform: 'uppercase', 
    fontWeight: '700',
    letterSpacing: 0.5, 
    marginBottom: 2 
  },
  metaValue: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  infoCard: {
    backgroundColor: WHITE, 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  requirementsList: {
    gap: 12,
  },
  requirementRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
  },
  reqIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  requirementText: { 
    fontSize: 14, 
    color: '#475569', 
    flex: 1, 
    lineHeight: 22 
  },
  expectText: { 
    fontSize: 14, 
    color: '#475569', 
    lineHeight: 22 
  },

  officeHoursCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent', 
    padding: 14,
    marginBottom: 16,
  },
  officeHoursText: { 
    fontSize: 13, 
    color: '#64748B',
    fontWeight: '500'
  },

  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#64748B', 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 10,
    marginTop: 6,
  },

  inputGroup: { gap: 12, marginTop: 4 },
  inputCard: {
    backgroundColor: WHITE, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    borderRadius: 14, 
    overflow: 'hidden',
  },
  inputCardBody: { 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 12 
  },
  inputIcon: { 
    marginTop: 2, 
    flexShrink: 0 
  },
  textInputInCard: {
    flex: 1, 
    fontSize: 16, 
    color: '#1E293B', 
    lineHeight: 22, 
    minHeight: 120,
  },
  inputHint: { 
    fontSize: 12, 
    color: '#94A3B8', 
    lineHeight: 18, 
    textAlign: 'center',
    marginTop: 4,
  },

  urgencyRow: { flexDirection: 'row', gap: 10 },
  urgencyChip: {
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center', 
    backgroundColor: WHITE,
  },
  urgencyChipActive:  { backgroundColor: NAVY, borderColor: NAVY },
  urgencyText:        { fontSize: 14, color: '#64748B', fontWeight: '700' },
  urgencyTextActive:  { color: WHITE, fontWeight: '700' },

  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: WHITE,
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0',
  },
  actionBtn: {
    flexDirection: 'row',
    height: 56, 
    borderRadius: 14, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12, 
    gap: 8,
    elevation: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  actionBtnDisabled: { 
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: { 
    color: WHITE, 
    fontWeight: '700', 
    fontSize: 16 
  },
  actionSubLabel: { 
    fontSize: 12, 
    color: '#94A3B8', 
    textAlign: 'center',
    lineHeight: 18,
  },
});