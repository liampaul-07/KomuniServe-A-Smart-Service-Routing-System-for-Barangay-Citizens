import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert
} from 'react-native';

export default function DecisionScreen({ navigation }) {

  const handleLogout = () => {
    // TODO: When Supabase is connected, sign out first:
    // await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How can we help today?</Text>

        {/* Option 1: Guided Intake */}
        <TouchableOpacity
          style={styles.cardPrimary}
          onPress={() => navigation.navigate('GuidedPath')}
        >
          <Text style={styles.cardTitleLight}>Help Me Choose (Guided)</Text>
          <Text style={styles.cardSubLight}>We'll ask a few questions to find the right service and priority.</Text>
        </TouchableOpacity>

        {/* Option 2: Direct Access */}
        {/* TODO: Navigate to DirectAccess screen when built */}
        <TouchableOpacity
          style={styles.cardOutline}
          onPress={() => Alert.alert('Coming Soon', 'Direct access to service listings is being finalized.')}
        >
          <Text style={styles.cardTitleDark}>Direct Access</Text>
          <Text style={styles.cardSubDark}>If you already know exactly what document or service you need.</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, padding: 25, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 40, color: '#333' },
  cardPrimary: {
    backgroundColor: '#0047AB',
    padding: 30,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 3,
  },
  cardOutline: {
    borderWidth: 2,
    borderColor: '#0047AB',
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
  },
  cardTitleLight: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  cardSubLight: { color: '#BDD4FF', marginTop: 8, lineHeight: 20 },
  cardTitleDark: { color: '#0047AB', fontSize: 20, fontWeight: 'bold' },
  cardSubDark: { color: '#666', marginTop: 8, lineHeight: 20 },
  logout: { marginTop: 50, alignSelf: 'center' },
  logoutText: { color: '#FF4D4D', fontWeight: 'bold' },
});