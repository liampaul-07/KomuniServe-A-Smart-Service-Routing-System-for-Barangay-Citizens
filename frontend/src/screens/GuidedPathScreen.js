import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Platform, StatusBar, TextInput, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { processRequest } from '../services/RuleEngine';

const tree = {
  START: {
    question: "What do you need help with?",
    options: [
      { label: "🏥 Medical", value: "Medical", next: "MEDICAL_TYPE" },
      { label: "📄 Documents", value: "Documents", next: "DOC_TYPE" },
      { label: "⚖️ Complaint", value: "Complaint", next: "COMPLAINT_TYPE" },
    ]
  },
  MEDICAL_TYPE: {
    question: "What kind of medical concern?",
    options: [
      { label: "🤕 Physical", value: "Physical", next: "MEDICAL_URGENCY" },
      { label: "🧠 Psychological", value: "Psychological", next: "FINISH" },
      { label: "🩺 Checkup / routine visit", value: "Checkup", next: "FINISH" },
    ]
  },
  MEDICAL_URGENCY: {
    question: "How urgent is your physical concern?",
    options: [
      { label: "🚨 Urgent — needs immediate attention", value: "High", next: "FINISH" },
      { label: "📋 Routine — can wait for an appointment", value: "Low", next: "FINISH" },
    ]
  },
  DOC_TYPE: {
    question: "Which document do you need?",
    options: [
      { label: "📋 Barangay Clearance", value: "Clearance", next: "FINISH" },
      { label: "📋 Certificate of Indigency", value: "Indigency", next: "FINISH" },
      { label: "📋 Certificate of Residency", value: "Residency", next: "FINISH" },
      { label: "📋 Good Moral Character", value: "Good_Moral", next: "FINISH" },
      { label: "📋 Barangay Business Permit", value: "Business_Permit", next: "FINISH" },
    ]
  },
  COMPLAINT_TYPE: {
    question: "What type of complaint?",
    options: [
      { label: "🔊 Noise / disturbance", value: "Noise", next: "COMPLAINT_INPUT" },
      { label: "🏠 Property dispute", value: "Property_Dispute", next: "COMPLAINT_INPUT" },
      { label: "⚠️ Physical threat or violence", value: "Physical_Threat", urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "👨‍👩‍👧 Domestic issue", value: "Domestic_Issue", next: "COMPLAINT_INPUT" },
      { label: "🚧 Street / infrastructure problem", value: "Infrastructure", next: "COMPLAINT_INFRA" },
      { label: "📝 Other", value: "Other", next: "COMPLAINT_INPUT" },
    ]
  },
  COMPLAINT_INFRA: {
    question: "What kind of infrastructure problem?",
    options: [
      { label: "💧 Broken water pump", value: "Broken_Water_Pump", next: "COMPLAINT_INPUT" },
      { label: "⚡ Broken electrical wire", value: "Broken_Electrical_Wire", urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "🛣️ Eroded / dangerous road", value: "Eroded_Road", urgency: "High", next: "COMPLAINT_INPUT" },
      { label: "🔧 Other infrastructure", value: "Other_Infrastructure", next: "COMPLAINT_INPUT" },
    ]
  },
  COMPLAINT_INPUT: {
    type: 'text_input',
    question: "Briefly describe your concern:",
    placeholder: "e.g. There is a broken street light near the covered court...",
    next: "FINISH",
  },
};

export default function GuidedPathScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState('START');
  const [history, setHistory] = useState([]);
  const [selections, setSelections] = useState({
    category: '',
    subType: '',
    urgency: 'Low',
    description: '',
  });
  const [inputText, setInputText] = useState('');

  const handleSelection = (option) => {
    const updated = { ...selections };

    if (currentStep === 'START')            updated.category = option.value;
    if (currentStep === 'MEDICAL_TYPE')     updated.subType = option.value;
    if (currentStep === 'MEDICAL_URGENCY')  updated.urgency = option.value;
    if (currentStep === 'DOC_TYPE')         updated.subType = option.value;

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

  const currentQ = tree[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtnHeader}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>Step {history.length + 1}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.question}>{currentQ.question}</Text>

          {currentQ.type === 'text_input' ? (
            <View>
              <TextInput
                style={styles.textInput}
                placeholder={currentQ.placeholder}
                placeholderTextColor="#AAA"
                multiline
                numberOfLines={4}
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                style={[styles.submitBtn, !inputText.trim() && styles.submitBtnDisabled]}
                onPress={handleTextSubmit}
                disabled={!inputText.trim()}
              >
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            currentQ.options.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.option} onPress={() => handleSelection(opt)}>
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 10,
    backgroundColor: '#FFF',
  },
  backBtnHeader: { padding: 10, marginLeft: -10 },
  backBtnText: { color: '#0047AB', fontWeight: 'bold', fontSize: 16 },
  progressText: { color: '#999', fontSize: 14 },
  content: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  question: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, color: '#333' },
  option: {
    borderWidth: 1.5,
    borderColor: '#EEE',
    padding: 22,
    borderRadius: 16,
    marginBottom: 15,
    backgroundColor: '#FBFCFF',
    elevation: 1,
  },
  optionText: { fontSize: 18, color: '#444' },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#EEE',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FBFCFF',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#0047AB',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#CCC' },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
});