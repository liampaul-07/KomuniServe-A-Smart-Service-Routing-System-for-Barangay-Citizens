import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, KeyboardAvoidingView, ScrollView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../lib/useAuth';  // ← WIRED

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();  // ← WIRED

  const [firstName, setFirstName]           = useState('');
  const [lastName, setLastName]             = useState('');
  const [phone, setPhone]                   = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading]           = useState(false);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Input Required', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Sign Up Error', error.message || 'Something went wrong. Please try again.');
      return;
    }

    Alert.alert(
      'Account Created',
      'Your account has been created. Please check your email to confirm, then log in.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to access barangay services.</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="First Name *"
              placeholderTextColor="#999"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.inputHalf]}
              placeholder="Last Name *"
              placeholderTextColor="#999"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Phone Number (optional)"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address *"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password *"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content:   { flexGrow: 1, padding: 30, justifyContent: 'center' },
  title:     { fontSize: 32, fontWeight: 'bold', color: '#0047AB', marginBottom: 10 },
  subtitle:  { fontSize: 16, color: '#666', marginBottom: 40 },
  row:       { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    flex: 1,
  },
  inputHalf:      { flex: 1 },
  signUpButton:   { backgroundColor: '#0047AB', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 2 },
  buttonDisabled: { backgroundColor: '#7FA8D9' },
  buttonText:     { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  loginLink:      { marginTop: 25, alignItems: 'center' },
  linkText:       { color: '#666', fontSize: 14 },
  linkBold:       { color: '#0047AB', fontWeight: 'bold' },
});