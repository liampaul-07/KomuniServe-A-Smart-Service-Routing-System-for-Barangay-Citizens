import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { supabase } from '../services/supabase';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigation.replace('Login');
          return;
        }
        
        const { data: profile, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();

        if (error) throw error;

        if (profile.role === 'barangay_staff') {
          navigation.replace('AdminDashboard');
        } else {
          navigation.replace('Decision');
        }
      } catch (error) {
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(() => {
      checkSession();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>KomuniServe</Text>
      <ActivityIndicator size="large" color="#0047AB" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#0047AB', marginBottom: 20 }
});  