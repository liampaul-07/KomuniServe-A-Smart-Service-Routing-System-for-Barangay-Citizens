import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setIsLoading(true);

    try {
      if (email === 'admin@komuniserve.com' && password === 'admin123') {
        navigation.replace('AdminDashboard');
        return;
      }
      if (email === '123@gmail.com' && password === '123') {
        navigation.replace('Decision');
        return;
      }
      // --- END DEV BYPASS ---

      // TODO: Replace with Supabase auth
      // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      // if (error) throw error;
      //
      // Then check role:
      // const { data: profile } = await supabase
      //   .from('users').select('role').eq('id', data.user.id).single();
      // if (profile.role === 'admin') navigation.replace('AdminDashboard');
      // else navigation.replace('Decision');
      Alert.alert("Login Failed", "Invalid email or password.");
    } catch (error) {
      Alert.alert("Login Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>KomuniServe</Text>
          <Text style={styles.subtitle}>Log in to access barangay services.</Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>Login</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0047AB', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  input: { 
    backgroundColor: '#F8F9FA', 
    borderWidth: 1, 
    borderColor: '#EEE', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15,
    fontSize: 16 
  },
  loginButton: { 
    backgroundColor: '#0047AB', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10,
    elevation: 2 
  },
  buttonDisabled: { backgroundColor: '#7FA8D9' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  signupLink: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 14 },
  linkBold: { color: '#0047AB', fontWeight: 'bold' }
});