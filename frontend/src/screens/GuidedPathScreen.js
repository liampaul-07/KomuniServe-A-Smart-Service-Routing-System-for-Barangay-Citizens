import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Platform, StatusBar, TextInput, KeyboardAvoidingView, ScrollView,
  Image,
} from 'react-native';
import { processRequest } from '../services/RuleEngine';

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
} from 'lucide-react-native';

const ICON_MAP = {
  Medical:                HeartPulse,
  Documents:              FileText,
  Complaint:              Scale,
  Physical:               Stethoscope,
  Psychological:          Brain,
  Checkup:                ClipboardList,
  High:                   AlertTriangle,
  Low:                    ClipboardList,
  Clearance:              BookOpen,
  Indigency:              BookOpen,
  Residency:              Home,
  Good_Moral:             BookOpen,
  Business_Permit:        FileText,
  Noise:                  Volume2,
  Property_Dispute:       Home,
  Physical_Threat:        ShieldAlert,
  Domestic_Issue:         Users,
  Infrastructure:         Construction,
  Other:                  MessageSquare,
  Broken_Water_Pump:      Droplets,
  Broken_Electrical_Wire: Zap,
  Eroded_Road:            RoadCone,
  Other_Infrastructure:   Wrench,
};

const URGENCY_VALUES = ['High'];

const tree = {
  START: {
    question: "What do you need help with?",
    options: [
      { label: "Medical Assistance",  value: "Medical",   next: "MEDICAL_TYPE"   },
      { label: "Document Request",    value: "Documents", next: "DOC_TYPE"        },
      { label: "File a Complaint",    value: "Complaint", next: "COMPLAINT_TYPE"  },
    ]
  },
  MEDICAL_TYPE: {
    question: "What kind of medical concern?",
    options: [
      { label: "Physical Condition",          value: "Physical",      next: "MEDICAL_URGENCY" },
      { label: "Psychological / Mental Health",value: "Psychological", next: "FINISH"          },
      { label: "Checkup or Routine Visit",    value: "Checkup",       next: "FINISH"          },
    ]
  },
  MEDICAL_URGENCY: {
    question: "How urgent is your physical concern?",
    options: [
      { label: "Urgent — Needs Immediate Attention", value: "High", next: "FINISH" },
      { label: "Routine — Can Wait for Appointment", value: "Low",  next: "FINISH" },
    ]
  },
  DOC_TYPE: {
    question: "Which document do you need?",
    options: [
      { label: "Barangay Clearance",           value: "Clearance",      next: "FINISH" },
      { label: "Certificate of Indigency",     value: "Indigency",      next: "FINISH" },
      { label: "Certificate of Residency",     value: "Residency",      next: "FINISH" },
      { label: "Good Moral Character Certificate", value: "Good_Moral", next: "FINISH" },
      { label: "Barangay Business Permit",     value: "Business_Permit",next: "FINISH" },
    ]
  },
  COMPLAINT_TYPE: {
    question: "What type of complaint?",
    options: [
      { label: "Noise or Public Disturbance",    value: "Noise",            next: "COMPLAINT_INPUT" },
      { label: "Property Dispute",               value: "Property_Dispute", next: "COMPLAINT_INPUT" },
      { label: "Physical Threat or Violence",    value: "Physical_Threat",  urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "Domestic Issue",                 value: "Domestic_Issue",   next: "COMPLAINT_INPUT" },
      { label: "Street / Infrastructure Problem",value: "Infrastructure",   next: "COMPLAINT_INFRA" },
      { label: "Other Concern",                  value: "Other",            next: "COMPLAINT_INPUT" },
    ]
  },
  COMPLAINT_INFRA: {
    question: "What kind of infrastructure problem?",
    options: [
      { label: "Broken Water Pump",       value: "Broken_Water_Pump",      next: "COMPLAINT_INPUT" },
      { label: "Broken Electrical Wire",  value: "Broken_Electrical_Wire", urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "Eroded or Dangerous Road",value: "Eroded_Road",            urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "Other Infrastructure Issue", value: "Other_Infrastructure",next: "COMPLAINT_INPUT" },
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
      navigation.navigate('Result', { result, category: updated.category });
    } else {
      setHistory([...history, currentStep]);
      setCurrentStep(option.next);
    }
  };

  const handleTextSubmit = () => {
    const updated = { ...selections, description: inputText.trim() };
    setSelections(updated);
    const result = processRequest(updated);
    navigation.navigate('Result', { result, category: updated.category });
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
      {/* ✅ Solid Navy status bar — no gold stripe on header */}
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* ── Header: solid Navy, IconLogo.jpeg centered ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        <StepIndicator current={stepNumber} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Section label ── */}
          <Text style={styles.sectionLabel}>
            {currentStep === 'START'
              ? 'Service Request'
              : selections.category
                ? selections.category.toUpperCase()
                : 'SELECT AN OPTION'}
          </Text>

          {/* ── Question ── */}
          <Text style={styles.question}>{currentQ.question}</Text>

          {/* ── Text input mode ── */}
          {currentQ.type === 'text_input' ? (
            <View style={styles.inputGroup}>

              {/* ✅ Gold 4px accent on input card */}
              <View style={styles.inputCard}>
                <View style={styles.inputCardBody}>
                  <MessageSquare
                    size={18}
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
                <Send size={17} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>

            </View>
          ) : (
            /* ── Option cards ── */
            <View style={styles.optionList}>
              {currentQ.options.map((opt, i) => {
                const IconComponent = ICON_MAP[opt.value] || FileText;
                const isUrgent = opt.urgency && URGENCY_VALUES.includes(opt.urgency);

                return (
                  // ✅ Gold 4px accent on each option card
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionCard, isUrgent && styles.optionCardUrgent]}
                    onPress={() => handleSelection(opt)}
                    activeOpacity={0.75}
                  >

                    <View style={styles.optionCardInner}>
                      <View style={[
                        styles.iconContainer,
                        isUrgent
                          ? styles.iconContainerUrgent
                          : styles.iconContainerDefault,
                      ]}>
                        <IconComponent
                          size={20}
                          color={isUrgent ? '#B94A00' : NAVY}
                          strokeWidth={1.8}
                        />
                      </View>

                      <Text style={[
                        styles.optionLabel,
                        isUrgent && styles.optionLabelUrgent,
                      ]}>
                        {opt.label}
                      </Text>

                      {isUrgent ? (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>URGENT</Text>
                        </View>
                      ) : (
                        <ChevronRight size={16} color="#C8D0DF" strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.footerNote}>
            All information provided is handled in accordance with the{' '}
            <Text style={styles.footerNoteLink}>Data Privacy Act of 2012</Text>.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const NAVY        = '#0038A8';
const GOLD_STRIPE = '#F9C800';
const GOLD_LABEL  = '#C8960C';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },

  // ── Header: solid Navy, no gold stripe ──────────
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 16,
    paddingBottom: 14,
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
  },
  backLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ✅ IconLogo — perfect circle, white bg, subtle border
  headerLogoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },

  // ── Step indicator dots ──────────────────────────
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD_STRIPE,       // ✅ Gold dot on navy bg reads perfectly
  },
  dotDone: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotIdle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ── Scroll content ───────────────────────────────
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_LABEL,
    letterSpacing: 1.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B3E',
    lineHeight: 32,
    marginBottom: 28,
    letterSpacing: -0.3,
  },

  // ── Option cards ─────────────────────────────────
  optionList: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9F2',
    borderRadius: 8,
    overflow: 'hidden',                 // ✅ clips gold accent to rounded corners
  },
  optionCardUrgent: {
    backgroundColor: '#FFF4EE',
    borderColor: '#F5C4A1',
  },
  // ✅ Gold 4px top accent on cards
  cardGoldAccent: {
    height: 4,
    backgroundColor: GOLD_STRIPE,
  },
  cardUrgentAccent: {
    backgroundColor: '#F97316',         // warm orange accent for urgent cards
  },
  optionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconContainerDefault: {
    backgroundColor: '#EEF2FB',
  },
  iconContainerUrgent: {
    backgroundColor: '#FFE8D6',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A2340',
    letterSpacing: 0.1,
    lineHeight: 21,
  },
  optionLabelUrgent: {
    color: '#B94A00',
    fontWeight: '600',
  },
  urgentBadge: {
    backgroundColor: '#B94A00',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // ── Text input card ──────────────────────────────
  inputGroup: {
    gap: 12,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9F2',
    borderRadius: 8,
    overflow: 'hidden',                 // ✅ clips gold accent
  },
  inputCardBody: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  inputIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A2340',
    lineHeight: 22,
    minHeight: 100,
  },
  inputHint: {
    fontSize: 12,
    color: '#8A94A6',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY,
    paddingVertical: 15,
    borderRadius: 8,
    gap: 10,
    marginTop: 4,
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
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // ── Footer ───────────────────────────────────────
  footerNote: {
    marginTop: 36,
    fontSize: 11.5,
    color: '#A0ABBC',
    textAlign: 'center',
    lineHeight: 17,
    letterSpacing: 0.1,
  },
  footerNoteLink: {
    color: NAVY,
    fontWeight: '600',
  },
});