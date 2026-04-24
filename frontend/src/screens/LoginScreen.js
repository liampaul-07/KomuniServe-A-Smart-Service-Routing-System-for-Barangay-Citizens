import React, { useState, useEffect, useRef } from 'react';

import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, KeyboardAvoidingView, ScrollView,
  Platform, StatusBar, Animated, LayoutAnimation,
  UIManager, Image,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';

import { supabase } from '../services/supabase';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Custom SVG Spinner  ──────────────────────────────────────────
function EGovSpinner({ size = 44 }) {
  const rotation = useRef(new Animated.Value(0)).current;

  const stroke = size * 0.22;
  const radius = (size - stroke) / 2;
  const cx     = size / 2;
  const cy     = size / 2;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    return () => rotation.stopAnimation();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const polarToCartesian = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(endAngle);
    const end   = polarToCartesian(startAngle);
    const large = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 0 ${end.x} ${end.y}`;
  };

  // ✅ Equal 120° each, small 6° gap between each segment
  const GAP = 6;
  const segments = [
    { color: '#1A3EBF', start: 0   + GAP / 2, end: 120 - GAP / 2 },  // Blue
    { color: '#CE1126', start: 120 + GAP / 2, end: 240 - GAP / 2 },  // Red
    { color: '#F9C800', start: 240 + GAP / 2, end: 360 - GAP / 2 },  // Yellow
  ];

  return (
    <Animated.View style={{ transform: [{ rotate }], width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => (
          <Path
            key={i}
            d={describeArc(seg.start, seg.end)}
            stroke={seg.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Input Required', 'Please enter your email and password.');
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLoading(true);

    setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (error) throw error;

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) throw profileError;
      
        if (profile.role === 'barangay_staff') {
          navigation.replace('AdminDashboard');
        } else {
          navigation.replace('Decision');
        }
      } catch (error) {
        console.log('Login error:', error.message);
        Alert.alert('Login Failed','An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      } 
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.topStripe}/>

          <Animated.View style={[styles.logoBlock, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.iconLogoWrapper}>
              <Image source={require('../../assets/IconLogo.jpeg')} style={styles.iconLogo} resizeMode="cover" />
            </View>
            <Text style={styles.appName}>KomuniServe</Text>
            <Text style={styles.appTagline}>Barangay Digital Services</Text>
          </Animated.View>

          <Animated.View style={[styles.formBlock, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.helloText}>Hello, Welcome!</Text>
            <Text style={styles.loginSubtitle}>Log in to access barangay services and manage your requests.</Text>
            <View style={styles.fieldDivider} />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <Mail size={17} color={emailFocused ? '#0038A8' : '#A0ABBC'} strokeWidth={1.8} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. juan@email.com"
                  placeholderTextColor="#B0B8D0"
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
                <Lock size={17} color={passwordFocused ? '#0038A8' : '#A0ABBC'} strokeWidth={1.8} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#B0B8D0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={17} color="#0038A8" /> : <Eye size={17} color="#A0ABBC" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.buttonLoading]} 
              onPress={handleLogin} 
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <EGovSpinner size={36} />
              </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Login</Text>
                  <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} /><Text style={styles.orText}>or</Text><View style={styles.orLine} />
            </View>

            <Text style={styles.signupPrompt}>Don't have an account yet?</Text>
            <TouchableOpacity 
              style={styles.signupButton} 
              onPress={() => navigation.navigate('SignUp')}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>Create new account</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.footerNote}>KomuniServe v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────
const NAVY        = '#0038A8';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },

  // ── Logo block ────────────────────────────────────
  logoBlock: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  iconLogoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E4E9F2',
  },
  iconLogo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 0.2,
  },
  appTagline: {
    fontSize: 12,
    color: '#8892AA',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  // ── Form block ────────────────────────────────────
  formBlock: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  helloText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1F36',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 13,
    color: '#8892AA',
    lineHeight: 19,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#E8EBF2',
    marginVertical: 24,
  },

  // ── Fields ───────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5270',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F8',
    borderWidth: 1.5,
    borderColor: '#E0E4EF',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputWrapperFocused: {
    borderColor: NAVY,
    backgroundColor: '#F5F8FF',
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

  // ── Login button ──────────────────────────────────
  loginButton: {
    backgroundColor: NAVY,
    borderRadius: 8,
    marginTop: 8,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
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

  // ── Or divider ────────────────────────────────────
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8EBF2',
  },
  orText: {
    fontSize: 13,
    color: '#B0B8D0',
    fontWeight: '500',
  },

  // ── Sign up ───────────────────────────────────────
  signupPrompt: {
    textAlign: 'center',
    color: '#8892AA',
    fontSize: 13,
    marginBottom: 12,
  },
  signupButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: '#FFFFFF',
  },
  signupButtonText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // ── Footer ───────────────────────────────────────
  footerNote: {
    textAlign: 'center',
    color: '#C0C6D8',
    fontSize: 11,
    paddingTop: 32,
    paddingBottom: 8,
  },
  topStripe: {
    height: 6,
    backgroundColor: '#1a73e8', // match your brand color
    width: '100%',
  },
});