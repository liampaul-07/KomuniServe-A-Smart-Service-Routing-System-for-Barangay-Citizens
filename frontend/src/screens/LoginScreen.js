import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Test Bypass Logic
    if (email === '123@gmail.com' && password === '123') {
      navigation.replace('Decision');
    } else if (!email || !password) {
      Alert.alert("Input Required", "Please enter your credentials.");
    } else {
      Alert.alert("Login Failed", "Invalid email or password. Hint: Use 123/123.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signupLink} 
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
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
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  signupLink: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 14 },
  linkBold: { color: '#0047AB', fontWeight: 'bold' }
});