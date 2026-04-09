import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert
} from 'react-native';

export default function DecisionScreen({ navigation }) {

  const handleLogout = () => {
    // TODO: await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How can we help today?</Text>

        {/* Guided intake */}
        <TouchableOpacity
          style={styles.cardPrimary}
          onPress={() => navigation.navigate('GuidedPath')}
        >
          <Text style={styles.cardTitleLight}>Help Me Choose (Guided)</Text>
          <Text style={styles.cardSubLight}>
            We'll ask a few questions to find the right service and priority.
          </Text>
        </TouchableOpacity>

        {/* Direct access */}
        {/* TODO: navigate to DirectAccess screen when built */}
        <TouchableOpacity
          style={styles.cardOutline}
          onPress={() => navigation.navigate('DirectAccess')}
        >
          <Text style={styles.cardTitleDark}>Direct Access</Text>
          <Text style={styles.cardSubDark}>
            If you already know exactly what document or service you need.
          </Text>
        </TouchableOpacity>

        {/* My Appointments */}
        <TouchableOpacity
          style={styles.cardSecondary}
          onPress={() => navigation.navigate('AppointmentStatus')}
        >
          <Text style={styles.cardTitleDark}>My Appointments</Text>
          <Text style={styles.cardSubDark}>
            Check the status of your submitted appointments and requests.
          </Text>
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
  content:   { flex: 1, padding: 25, justifyContent: 'center' },
  title:     { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#333' },

  cardPrimary: {
    backgroundColor: '#0047AB',
    padding: 28, borderRadius: 20,
    marginBottom: 14, elevation: 3,
  },
  cardOutline: {
    borderWidth: 2, borderColor: '#0047AB',
    padding: 28, borderRadius: 20,
    backgroundColor: '#F8F9FF', marginBottom: 14,
  },
  cardSecondary: {
    borderWidth: 1.5, borderColor: '#DDE3F0',
    padding: 28, borderRadius: 20,
    backgroundColor: '#F8F9FF', marginBottom: 14,
  },

  cardTitleLight: { color: '#FFF',    fontSize: 19, fontWeight: 'bold' },
  cardSubLight:   { color: '#BDD4FF', marginTop: 6, lineHeight: 20     },
  cardTitleDark:  { color: '#0047AB', fontSize: 19, fontWeight: 'bold' },
  cardSubDark:    { color: '#666',    marginTop: 6, lineHeight: 20     },

  logout:     { marginTop: 30, alignSelf: 'center' },
  logoutText: { color: '#FF4D4D', fontWeight: 'bold' },
});