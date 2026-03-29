import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    Alert.alert("Success", "Account created (Dummy)!", [
      { text: "OK", onPress: () => navigation.navigate('Login') }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Full Name" onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} />
      
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Already have an account? <Text style={{fontWeight: 'bold'}}>Login</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 30, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: '#EEE', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#0047AB', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  linkText: { textAlign: 'center', color: '#666' }
});