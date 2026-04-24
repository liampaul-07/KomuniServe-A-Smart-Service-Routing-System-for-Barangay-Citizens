import React, { useState, useEffect, useRef } from 'react';

import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, SafeAreaView, KeyboardAvoidingView, ScrollView,
  Platform, StatusBar, Animated, LayoutAnimation,
  UIManager, Image,
} from 'react-native';

import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react-native';

import { supabase } from '../services/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const GAP = 6;
  const segments = [
    { color: '#1A3EBF', start: 0   + GAP / 2, end: 120 - GAP / 2 },
    { color: '#CE1126', start: 120 + GAP / 2, end: 240 - GAP / 2 },
    { color: '#F9C800', start: 240 + GAP / 2, end: 360 - GAP / 2 },
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

function HeaderDecoration() {
  return (
    <Svg
      width="100%"
      height={220}          
      viewBox="0 0 390 220" 
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        <LinearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#0038A8" />
          <Stop offset="100%" stopColor="#0052CC" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="390" height="220" fill="url(#headerGrad)" />
      <Circle cx="340" cy="20"  r="90"  fill="#FFFFFF" fillOpacity="0.04" />
      <Circle cx="360" cy="200" r="70"  fill="#FFFFFF" fillOpacity="0.04" />
      <Circle cx="30"  cy="180" r="60"  fill="#FFFFFF" fillOpacity="0.04" />
      <Rect x="0"   y="213" width="130" height="7" fill="#CE1126" />
      <Rect x="130" y="213" width="130" height="7" fill="#FFFFFF" />
      <Rect x="260" y="213" width="130" height="7" fill="#0038A8" />
    </Svg>
  );
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
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
          password,
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
        Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerArea}>
            <HeaderDecoration />
            <Animated.View
              style={[
                styles.logoBlock,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.iconLogoWrapper}>
                <Image
                  source={require('../../assets/IconLogo.jpeg')}
                  style={styles.iconLogo}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.appName}>KomuniServe</Text>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.helloText}>Welcome Back</Text>
            <Text style={styles.loginSubtitle}>
              Sign in to access barangay services and manage your requests securely.
            </Text>

            <View style={styles.fieldDivider} />

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
                  placeholder="Enter your password"
                  placeholderTextColor="#A0ABBC"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword
                    ? <EyeOff size={18} color={NAVY} />
                    : <Eye size={18} color="#A0ABBC" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonLoading]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.spinnerWrapper}>
                  <EGovSpinner size={36} />
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Login</Text>
                  <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.privacyRow}>
              <ShieldCheck size={14} color="#8892AA" strokeWidth={1.8} />
              <Text style={styles.privacyText}>
                Your information is encrypted and secured.
              </Text>
            </View>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <Text style={styles.signupPrompt}>Don't have an account yet?</Text>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => navigation.navigate('SignUp')}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.signupButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.footerNote}>KomuniServe v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const NAVY = '#0038A8';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Matched with DecisionScreen
  },
  content: {
    flexGrow: 1,
    paddingBottom: 36,
  },
   headerArea: {
    height: 220,           
    position: 'relative',
    overflow: 'hidden',
  },
  logoBlock: {
    alignItems: 'center',
    paddingTop: 38,
  },
  iconLogoWrapper: {
    width: 80,             
    height: 80,
    borderRadius: 24, // Matches the Squircle design language of DecisionScreen
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconLogo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  card: {
    marginHorizontal: 20,
    marginTop: -40,        
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Softer corners
    paddingHorizontal: 24,
    paddingTop: 32, // Adjusted since accent is removed
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#E4E8F1',
    shadowColor: NAVY,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  helloText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1F36',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6B7A99', // Deeper, cooler grey
    lineHeight: 22,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: '#EDF1F7',
    marginVertical: 24,
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
    backgroundColor: '#F7F9FC', // Softer inactive background
    borderWidth: 1.5,
    borderColor: '#E4E8F1',
    borderRadius: 12, // Softer corners
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
  loginButton: {
    backgroundColor: NAVY,
    borderRadius: 12, // Softer corners
    marginTop: 12,
    height: 54,
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
  spinnerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  privacyText: {
    fontSize: 12,
    color: '#8892AA',
    letterSpacing: 0.2,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDF1F7',
  },
  orText: {
    fontSize: 12,
    color: '#8892AA',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signupPrompt: {
    textAlign: 'center',
    color: '#6B7A99',
    fontSize: 14,
    marginBottom: 12,
  },
  signupButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12, // Softer corners
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: '#F7F9FC', // Removed deep blue tint from background for contrast
  },
  signupButtonText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  footerNote: {
    textAlign: 'center',
    color: '#A0ABBC',
    fontSize: 12,
    paddingTop: 28,
    paddingBottom: 8,
  },
});