import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, KeyboardAvoidingView, ScrollView,
  Platform, ActivityIndicator, StatusBar, Animated
} from 'react-native';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { supabase } from '../services/supabase';

export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Focus states
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Input Required', 'Please fill in all fields.');
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'resident',
            is_active: true,
          }
        }
      });
      
      if (error) throw error;

      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          role: 'resident',
          is_active: true,
      }, { onConflict: 'id' });

      if (profileError) throw profileError;

      Alert.alert(
        'Account Created', 
        'Your account has been created. You can now log in.', 
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.log('Sign Up error:', error.message);
      Alert.alert('Sign Up Error', "An unexpected error occurred. Please try again later." );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F7F9FC" barStyle="dark-content" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color="#1A1F36" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Header Texts ── */}
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register to access barangay services quickly and securely.</Text>

            {/* ── Forms ── */}
            <View style={styles.formContainer}>
              
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <View style={[styles.inputWrapper, firstNameFocused && styles.inputWrapperFocused]}>
                  <User size={18} color={firstNameFocused ? NAVY : '#A0ABBC'} strokeWidth={1.8} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Juan"
                    placeholderTextColor="#A0ABBC"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    onFocus={() => setFirstNameFocused(true)}
                    onBlur={() => setFirstNameFocused(false)}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <View style={[styles.inputWrapper, lastNameFocused && styles.inputWrapperFocused]}>
                  <User size={18} color={lastNameFocused ? NAVY : '#A0ABBC'} strokeWidth={1.8} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Dela Cruz"
                    placeholderTextColor="#A0ABBC"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    onFocus={() => setLastNameFocused(true)}
                    onBlur={() => setLastNameFocused(false)}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <Mail size={18} color={emailFocused ? NAVY : '#A0ABBC'} strokeWidth={1.8} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. juan@email.com"
                    placeholderTextColor="#A0ABBC"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <Lock size={18} color={passwordFocused ? NAVY : '#A0ABBC'} strokeWidth={1.8} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#A0ABBC"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? <EyeOff size={18} color={NAVY} /> : <Eye size={18} color="#A0ABBC" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputWrapperFocused]}>
                  <Lock size={18} color={confirmPasswordFocused ? NAVY : '#A0ABBC'} strokeWidth={1.8} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat your password"
                    placeholderTextColor="#A0ABBC"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                    {showConfirmPassword ? <EyeOff size={18} color={NAVY} /> : <Eye size={18} color="#A0ABBC" />}
                  </TouchableOpacity>
                </View>
              </View>

            </View>

            {/* ── Action Button ── */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.buttonLoading]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={NAVY} size="large" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
              )}
            </TouchableOpacity>

            {/* ── Bottom Link ── */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkBold}>Log In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const NAVY = '#0038A8';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F9FC' // Matched with Decision and Login
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4E8F1',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  content: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    paddingBottom: 40,
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#1A1F36', 
    letterSpacing: -0.5,
    marginBottom: 8,
    marginTop: 10,
  },
  subtitle: { 
    fontSize: 15, 
    color: '#6B7A99', 
    marginBottom: 32,
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5270',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5,
    borderColor: '#E4E8F1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    gap: 12,
  },
  inputWrapperFocused: {
    borderColor: NAVY,
    backgroundColor: '#F0F5FF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1F36',
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  signUpButton: {
    backgroundColor: NAVY,
    borderRadius: 12,
    marginTop: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonLoading: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E4EF',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loginLinkContainer: { 
    flexDirection: 'row',
    marginTop: 32, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: { 
    color: '#6B7A99', 
    fontSize: 14 
  },
  linkBold: { 
    color: NAVY, 
    fontWeight: '700',
    fontSize: 14 
  },
});