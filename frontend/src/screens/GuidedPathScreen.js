import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Platform, StatusBar, TextInput, KeyboardAvoidingView, ScrollView,
  Image, Alert
} from 'react-native';
import { processRequest } from '../services/RuleEngine';
import { supabase } from '../services/supabase';

import {
  HeartPulse,
  FileText,
  Scale,
  ChevronLeft,
  AlertTriangle,
  Stethoscope,
  Brain,
  ClipboardList,
  BookOpen,
  Home,
  ShieldAlert,
  Users,
  Construction,
  Droplets,
  Zap,
  RoadCone,
  Wrench,
  Volume2,
  MessageSquare,
  ChevronRight,
  Send,
  Calendar,
} from 'lucide-react-native';

const ICON_MAP = {
  Medical: HeartPulse,
  Documents: FileText,
  Complaint: Scale,
  Physical: Stethoscope,
  Psychological: Brain,
  Checkup: ClipboardList,
  High: AlertTriangle,
  Low: ClipboardList,
  Clearance: BookOpen,
  Indigency: BookOpen,
  Residency: Home,
  Good_Moral: BookOpen,
  Business_Permit: FileText,
  Noise: Volume2,
  Property_Dispute: Home,
  Physical_Threat: ShieldAlert,
  Domestic_Issue: Users,
  Infrastructure: Construction,
  Other: MessageSquare,
  Broken_Water_Pump: Droplets,
  Broken_Electrical_Wire: Zap,
  Eroded_Road: RoadCone,
  Other_Infrastructure: Wrench,
};

const URGENCY_VALUES = ['High'];

const COMPLAINT_BOOKING_REQUIREMENTS = {
  Property_Dispute: ['Valid ID', 'Brief description of the dispute', 'Property documents (title, photos, etc.)'],
  Physical_Threat: ['Valid ID', 'Brief description of the incident', 'Any evidence (photos, messages, witness names)'],
  Domestic_Issue: ['Valid ID', 'Brief description of the situation'],
};

const tree = {
  START: {
    question: "What do you need help with?",
    options: [
      { label: "Medical Assistance", value: "Medical", next: "MEDICAL_TYPE" },
      { label: "Document Request", value: "Documents", next: "DOC_TYPE" },
      { label: "File a Complaint", value: "Complaint", next: "COMPLAINT_TYPE" },
    ]
  },
  MEDICAL_TYPE: {
    question: "What kind of medical concern?",
    options: [
      { label: "Physical Condition", value: "Physical", next: "MEDICAL_URGENCY" },
      { label: "Psychological / Mental Health", value: "Psychological", next: "FINISH" },
      { label: "Checkup or Routine Visit", value: "Checkup", next: "FINISH" },
    ]
  },
  MEDICAL_URGENCY: {
    question: "How urgent is your physical concern?",
    options: [
      { label: "Urgent — Needs Immediate Attention", value: "High", next: "FINISH" },
      { label: "Routine — Can Wait for Appointment", value: "Low", next: "FINISH" },
    ]
  },
  DOC_TYPE: {
    question: "Which document do you need?",
    options: [
      { label: "Barangay Clearance", value: "Clearance", next: "FINISH" },
      { label: "Certificate of Indigency", value: "Indigency", next: "FINISH" },
      { label: "Certificate of Residency", value: "Residency", next: "FINISH" },
      { label: "Good Moral Character Certificate", value: "Good_Moral", next: "FINISH" },
      { label: "Barangay Business Permit", value: "Business_Permit", next: "FINISH" },
    ]
  },
  COMPLAINT_TYPE: {
    question: "What type of complaint?",
    options: [
      { label: "Noise or Public Disturbance", value: "Noise", urgency: "Low", next: "COMPLAINT_INPUT" },
      { label: "Property Dispute", value: "Property_Dispute", urgency: "Medium", next: "COMPLAINT_BOOKING_INFO" },
      { label: "Physical Threat or Violence", value: "Physical_Threat", urgency: "High", next: "COMPLAINT_BOOKING_INFO" },
      { label: "Domestic Issue", value: "Domestic_Issue", urgency: "High", next: "COMPLAINT_BOOKING_INFO" },
      { label: "Street / Infrastructure Problem", value: "Infrastructure", next: "COMPLAINT_INFRA" },
      { label: "Other Concern", value: "Other", urgency: "Low", next: "COMPLAINT_INPUT" },
    ]
  },
  COMPLAINT_BOOKING_INFO: {
    type: 'booking_info',
    question: 'Book a Mediation Appointment',
  },
  COMPLAINT_INFRA: {
    question: "What kind of infrastructure problem?",
    options: [
      { label: "Broken Water Pump", value: "Broken_Water_Pump", urgency: "Medium", next: "COMPLAINT_INPUT" },
      { label: "Broken Electrical Wire", value: "Broken_Electrical_Wire", urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "Eroded or Dangerous Road", value: "Eroded_Road", urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "Other Infrastructure Issue", value: "Other_Infrastructure", urgency: "Medium", next: "COMPLAINT_INPUT" },
    ]
  },
  COMPLAINT_INPUT: {
    type: 'text_input',
    question: "Briefly describe your concern:",
    placeholder: "e.g. There is a broken street light near the covered court...",
    next: "FINISH",
  },
};

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const MAX_STEPS = 4;
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: MAX_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current - 1
              ? styles.dotActive
              : i < current - 1
                ? styles.dotDone
                : styles.dotIdle,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GuidedPathScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState('START');
  const [history, setHistory]         = useState([]);
  const [selections, setSelections]   = useState({
    category: '',
    subType: '',
    urgency: 'Low',
    description: '',
  });
  const [inputText, setInputText] = useState('');

  const handleSelection = (option) => {
    const updated = { ...selections };

    if (currentStep === 'START')            updated.category = option.value;
    if (currentStep === 'MEDICAL_TYPE')     updated.subType  = option.value;
    if (currentStep === 'MEDICAL_URGENCY')  updated.urgency  = option.value;
    if (currentStep === 'DOC_TYPE')         updated.subType  = option.value;

    if (currentStep === 'COMPLAINT_TYPE') {
      updated.subType = option.value;
      if (option.urgency) updated.urgency = option.urgency;
    }

    if (currentStep === 'COMPLAINT_INFRA') {
      updated.subType = option.value;
      if (option.urgency) updated.urgency = option.urgency;
    }

    setSelections(updated);

    if (option.next === 'FINISH') {
      const result = processRequest(updated);
      navigation.navigate('Result', { 
        result, 
        category: updated.category,
        subType: updated.subType,
        urgency: updated.urgency,
        description: updated.description,
      });
    } else {
      setHistory([...history, currentStep]);
      setCurrentStep(option.next);
    }
  };

  const handleBookComplaint = () => {
    const result = processRequest(selections);
    navigation.navigate('BookAppointment', {
      result,
      category: selections.category,
      subType:  selections.subType,
      urgency:  selections.urgency,
      description: '',
    });
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) {
      Alert.alert('Required', 'Please enter a description before submitting.');
      return;
    }

    const updated = { ...selections, description: inputText.trim() };
    setSelections(updated);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { Alert.alert('Error', 'You must be logged in.'); return; }

      const result = processRequest(updated);

      const { error } = await supabase.from('requests').insert({
        user_id:           session.user.id,
        category:          updated.category,
        service_requested: updated.subType ?? updated.category,
        priority:          result.priority,
        intake_answers:    { ...result, subType: updated.subType, urgency: updated.urgency, category: updated.category, description: updated.description },
        status:            'Pending',
        description:       updated.description,
        submitted_at:      new Date().toISOString(),
      });

      if (error) throw error;

      navigation.replace('Confirmation', {
        mode:     'report',
        category: updated.category,
        subType:  updated.subType,
        facility: result.facility,
        priority: result.priority,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevStep = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentStep(prevStep);
    } else {
      navigation.goBack();
    }
  };

  const currentQ   = tree[currentStep];
  const stepNumber = history.length + 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>GUIDED PATH</Text>
          <Text style={styles.headerTitle}>
            {currentStep === 'START'
              ? 'Service Request'
              : selections.category || 'Select Option'}
          </Text>
        </View>
        <StepIndicator current={stepNumber} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Question ── */}
          <Text style={styles.question}>{currentQ.question}</Text>

          {/* ── Booking Info Mode ── */}
          {currentQ.type === 'booking_info' ? (
            <View style={styles.bookingInfoGroup}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={styles.infoIconBox}>
                    <ClipboardList size={22} color={NAVY} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.infoCardTitle}>Required Documents</Text>
                </View>
                <Text style={styles.bookingInfoDesc}>
                  Please bring the following to your appointment:
                </Text>
                <View style={styles.requirementsList}>
                  {(COMPLAINT_BOOKING_REQUIREMENTS[selections.subType] ?? ['Valid ID', 'Brief description']).map((req, i) => (
                    <View key={i} style={styles.requirementRow}>
                      <View style={styles.requirementDot} />
                      <Text style={styles.requirementText}>{req}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.officeHoursCard}>
                <Calendar size={18} color="#8892AA" strokeWidth={1.8} />
                <Text style={styles.officeHoursText}>
                  Office hours: Monday – Friday, 8:00 AM – 5:00 PM
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleBookComplaint}
                activeOpacity={0.85}
              >
                <Calendar size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.submitBtnText}>Book an Appointment</Text>
              </TouchableOpacity>
            </View>

          ) : currentQ.type === 'text_input' ? (
            /* ── Text Input Mode ── */
            <View style={styles.inputGroup}>
              <View style={styles.inputCard}>
                <View style={styles.inputCardBody}>
                  <MessageSquare
                    size={22}
                    color="#8A94A6"
                    style={styles.inputIcon}
                    strokeWidth={1.8}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder={currentQ.placeholder}
                    placeholderTextColor="#B0B8C9"
                    multiline
                    numberOfLines={4}
                    value={inputText}
                    onChangeText={setInputText}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <Text style={styles.inputHint}>
                Provide a concise description to help us process your request efficiently.
              </Text>

              <TouchableOpacity
                style={[styles.submitBtn, !inputText.trim() && styles.submitBtnDisabled]}
                onPress={handleTextSubmit}
                disabled={!inputText.trim()}
                activeOpacity={0.85}
              >
                <Send size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>
            </View>

          ) : (
            /* ── Option Cards ── */
            <View style={styles.optionList}>
              {currentQ.options.map((opt, i) => {
                const IconComponent = ICON_MAP[opt.value] || FileText;
                const isUrgent = opt.urgency && URGENCY_VALUES.includes(opt.urgency);

                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionCard, isUrgent && styles.optionCardUrgent]}
                    onPress={() => handleSelection(opt)}
                    activeOpacity={0.75}
                  >
                    {isUrgent && <View style={styles.optionCardUrgentAccent} />}

                    <View style={styles.optionCardInner}>
                      <View style={[
                        styles.iconContainer,
                        isUrgent
                          ? styles.iconContainerUrgent
                          : styles.iconContainerDefault,
                      ]}>
                        <IconComponent
                          size={24}
                          color={isUrgent ? '#C0391B' : NAVY}
                          strokeWidth={1.8}
                        />
                      </View>

                      <View style={styles.optionTextBlock}>
                        <Text style={[
                          styles.optionLabel,
                          isUrgent && styles.optionLabelUrgent,
                        ]}>
                          {opt.label}
                        </Text>
                        {isUrgent && (
                          <Text style={styles.urgentSubLabel}>Requires immediate attention</Text>
                        )}
                      </View>

                      {isUrgent ? (
                        <View style={styles.urgentBadge}>
                          <AlertTriangle size={12} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 3 }} />
                          <Text style={styles.urgentBadgeText}>URGENT</Text>
                        </View>
                      ) : (
                        <ChevronRight size={20} color="#C5D0E8" strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Footer ── */}
          <View style={styles.footerBlock}>
            <Text style={styles.footerNote}>
              All information provided is handled in accordance with the
            </Text>
            <Text style={styles.footerNoteLink}>Data Privacy Act of 2012</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const NAVY        = '#0038A8';
const GOLD_LABEL  = '#C8960C';
const GOLD_STRIPE = '#F9C800';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },

  // ── Header ──────────────────────────────────────
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 20,
    paddingBottom: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 64,
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerLabel: {
    color: GOLD_LABEL,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },

  // ── Step indicator dots ──────────────────────────
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 64,
    justifyContent: 'flex-end',
  },
  dot: {
    height: 9,
    borderRadius: 5,
    width: 9,
  },
  dotActive: {
    width: 26,
    height: 9,
    borderRadius: 5,
    backgroundColor: GOLD_STRIPE,
  },
  dotDone: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotIdle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ── Scroll ──────────────────────────────────────
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 56,
    flexGrow: 1,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1F36',
    lineHeight: 36,
    marginBottom: 24,
    letterSpacing: -0.3,
  },

  // ── Option cards ─────────────────────────────────
  optionList: {
    gap: 14,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E4EF',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  optionCardUrgent: {
    backgroundColor: '#FFF4EE',
    borderColor: '#F5C4A1',
  },
  optionCardUrgentAccent: {
    height: 3,
    backgroundColor: '#C0391B',
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
  iconContainerDefault: {
    backgroundColor: '#EEF2FB',
    borderColor: '#C5D5F5',
  },
  iconContainerUrgent: {
    backgroundColor: '#FFE8D6',
    borderColor: '#F5C4A1',
  },
  optionTextBlock: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1F36',
    letterSpacing: 0.1,
    lineHeight: 24,
  },
  optionLabelUrgent: {
    color: '#B94A00',
  },
  urgentSubLabel: {
    fontSize: 14,
    color: '#C0391B',
    opacity: 0.75,
    letterSpacing: 0.1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0391B',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexShrink: 0,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // ── Text input card ──────────────────────────────
  inputGroup: {
    gap: 16,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E4EF',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  inputCardBody: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  inputIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#1A1F36',
    lineHeight: 26,
    minHeight: 120,
  },
  inputHint: {
    fontSize: 14,
    color: '#8A94A6',
    lineHeight: 22,
    letterSpacing: 0.1,
  },

  // ── Booking info ─────────────────────────────────
  bookingInfoGroup: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E4EF',
    gap: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF2FB',
    borderWidth: 1,
    borderColor: '#C5D5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1F36',
    letterSpacing: 0.1,
  },
  bookingInfoDesc: {
    fontSize: 15,
    color: '#8892AA',
    lineHeight: 24,
  },
  requirementsList: {
    gap: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NAVY,
    marginTop: 9,
    flexShrink: 0,
  },
  requirementText: {
    fontSize: 16,
    color: '#1A1F36',
    flex: 1,
    lineHeight: 24,
  },
  officeHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E4EF',
  },
  officeHoursText: {
    fontSize: 15,
    color: '#8892AA',
    flex: 1,
    lineHeight: 22,
  },

  // ── Submit button ────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY,
    paddingVertical: 18,
    borderRadius: 10,
    gap: 12,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  submitBtnDisabled: {
    backgroundColor: '#B0B8C9',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // ── Footer ───────────────────────────────────────
  footerBlock: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 13,
    color: '#A0ABBC',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  footerNoteLink: {
    fontSize: 13,
    color: NAVY,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});