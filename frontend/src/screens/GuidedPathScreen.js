import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Platform, StatusBar } from 'react-native';
import { processRequest } from '../services/RuleEngine';

export default function GuidedPathScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState('START');
  const [history, setHistory] = useState([]);
  const [selections, setSelections] = useState({ 
    category: '', 
    subType: '', 
    urgency: 'Low', 
    hasReqs: true 
  });

  const tree = {
    START: {
      question: "What do you need help with?",
      options: [
        { label: "🏥 Medical", value: "Medical", next: "MEDICAL_URGENCY" },
        { label: "📄 Documents", value: "Documents", next: "DOC_TYPE" },
        { label: "⚖️ Complaint", value: "Complaint", next: "FINISH" },
      ]
    },
    MEDICAL_URGENCY: {
      question: "Is this an emergency?",
      options: [
        { label: "Yes, urgent", value: "High", next: "FINISH" },
        { label: "No, routine", value: "Low", next: "FINISH" },
      ]
    },
    DOC_TYPE: {
      question: "Which document?",
      options: [
        { label: "Clearance", value: "Clearance", next: "REQ_CHECK" },
        { label: "Indigency", value: "Indigency", next: "REQ_CHECK" },
      ]
    },
    REQ_CHECK: {
      question: "Do you have your ID / Requirements?",
      options: [
        { label: "Yes", value: true, next: "FINISH" },
        { label: "No", value: false, next: "FINISH" },
      ]
    }
  };

  const handleSelection = (option) => {
    const updated = { ...selections };
    if (currentStep === 'START') updated.category = option.value;
    if (currentStep === 'MEDICAL_URGENCY') updated.urgency = option.value;
    if (currentStep === 'DOC_TYPE') updated.subType = option.value;
    if (currentStep === 'REQ_CHECK') updated.hasReqs = option.value;
    setSelections(updated);

    if (option.next === 'FINISH') {
      const result = processRequest(updated.category, updated.subType, updated.urgency, updated.hasReqs);
      Alert.alert(
        "Service Assessment", 
        `Priority: ${result.priority}\n\n${result.instructions}`, 
        [{ text: "Back to Hub", onPress: () => navigation.replace('Decision') }]
      );
    } else {
      setHistory([...history, currentStep]);
      setCurrentStep(option.next);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevStep = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentStep(prevStep);
    } else {
      navigation.goBack();
    }
  };

  const currentQ = tree[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtnHeader}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>Step {history.length + 1}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>{currentQ.question}</Text>
        {currentQ.options.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.option} onPress={() => handleSelection(opt)}>
            <Text style={styles.optionText}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
    // This adds space only on Android to avoid the status bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20, 
    paddingBottom: 10,
    backgroundColor: '#FFF', // Keeps it clean
  },
  backBtnHeader: { 
    padding: 10,
    marginLeft: -10, // Pulls it slightly left to align with edge
  },
  backBtnText: { color: '#0047AB', fontWeight: 'bold', fontSize: 16 },
  progressText: { color: '#999', fontSize: 14 },
  content: { padding: 30, flex: 1, justifyContent: 'center' },
  question: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, color: '#333' },
  option: { 
    borderWidth: 1.5, 
    borderColor: '#EEE', 
    padding: 22, 
    borderRadius: 16, 
    marginBottom: 15,
    backgroundColor: '#FBFCFF',
    elevation: 1
  },
  optionText: { fontSize: 18, color: '#444' },
});