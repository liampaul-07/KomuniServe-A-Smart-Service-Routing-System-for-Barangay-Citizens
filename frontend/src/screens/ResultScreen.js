import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Platform, StatusBar, Image, Animated, ScrollView
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ArrowLeft,
  MapPin,
  FileText,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import { supabase } from '../services/supabase';

// ─── PRIORITY CONFIG ─────────────────────────────────────────
const PRIORITY_CONFIG = {
  HIGH:   { color: '#B71C1C', bg: '#FDECEA', border: '#EF9A9A', label: 'High Priority'   },
  MEDIUM: { color: '#C35A00', bg: '#FFF3E0', border: '#FFB347', label: 'Medium Priority' },
  LOW:    { color: '#1E6B1E', bg: '#EBF5EB', border: '#81C784', label: 'Low Priority'    },
};

const ACTION_LABELS = {
  SCHEDULE:          'Book an Appointment',
  WALK_IN:           'Proceed to Barangay Hall',
  SUBMIT_REPORT:     'Submit Report',
  COMPLAINT_OPTIONS: 'Report and Make Appointment',
};

// ─── EGOVPH CUSTOM SPINNER ───────────────────────────────────
function EGovSpinner({ size = 28 }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    ).start();
    return () => rotation.stopAnimation();
  }, [rotation]);

  const rotateDeg = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const r      = (size / 2) - 4;
  const cx     = size / 2;
  const cy     = size / 2;
  const strokeW = size * 0.14;

  function arcPath(startDeg, endDeg) {
    const toRad = (d) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <Animated.View style={{ transform: [{ rotate: rotateDeg }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.15)" strokeWidth={strokeW} fill="none" />
        <Path d={arcPath(-90, 30)}  stroke="#FFFFFF" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
        <Path d={arcPath(42,  162)} stroke="#CE1126" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
        <Path d={arcPath(174, 294)} stroke="#F9C800" strokeWidth={strokeW} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

// ─── HEADER LOGO ─────────────────────────────────────────────
function HeaderLogo() {
  return (
    <View style={styles.headerLogoCircle}>
      <Image
        source={require('../../assets/IconLogo.jpeg')}
        style={styles.headerLogoImage}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────
export default function ResultScreen({ route, navigation }) {
  const { result, category, subType, urgency, description } = route.params;
  const config = PRIORITY_CONFIG[result.priority];

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSchedule = () => {
    navigation.navigate('BookAppointment', { result, category, subType, urgency, description });
  };

  const handleSubmitReport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { Alert.alert('Error', 'You must be logged in.'); return; }

      const { error } = await supabase.from('requests').insert({
        user_id:           session.user.id,
        category,
        service_requested: subType ?? category,
        priority:          result.priority,
        intake_answers:    { ...result, subType, urgency, category, description },
        status:            'Pending',
        description:       description ?? '',
        submitted_at:      new Date().toISOString(),
      });

      if (error) throw error;

      navigation.replace('Confirmation', {
        mode:     'report',
        category,
        subType,
        facility: result.facility,
        priority: result.priority,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleMakeReportOnly = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { Alert.alert('Error', 'You must be logged in.'); return; }
      const { error } = await supabase.from('requests').insert({
        user_id: session.user.id,
        category: category,
        service_requested: subType ?? category,
        priority: result.priority,
        intake_answers: {
          ...result,
          subType,
          urgency,
          category,
          description,
        },
        status: 'Pending',
        description: description ?? '',
        submitted_at: new Date().toISOString(),
      });
        
      if (error) throw error;

      Alert.alert('Report Submitted', 'Your report has been submitted to the barangay.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit report. Please try again.')
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>ASSESSMENT</Text>
          <Text style={styles.headerTitle}>Service Result</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.priorityPill, { backgroundColor: config.bg, borderColor: config.border }]}>
            <View style={[styles.priorityDot, { backgroundColor: config.color }]} />
            <Text style={[styles.priorityPillText, { color: config.color }]}>
              {result.priority}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.categoryLabel}>{category}</Text>
          <Text style={styles.title}>Service Assessment</Text>

          {/* ── Facility card ── */}
          <View style={styles.facilityCard}>
            <View style={styles.facilityIconBox}>
              <MapPin size={20} color="#0038A8" strokeWidth={2} />
            </View>
            <View style={styles.facilityTextBlock}>
              <Text style={styles.metaLabel}>Assigned Facility</Text>
              <Text style={styles.facilityName}>{result.facility}</Text>
            </View>
          </View>

          {/* ── Instructions card ── */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeadingRow}>
              <View style={styles.instructionsIconBox}>
                <FileText size={18} color="#0038A8" strokeWidth={2} />
              </View>
              <Text style={styles.instructionsHeading}>What To Do</Text>
            </View>
            <Text style={styles.instructionsText}>{result.instructions}</Text>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionContainer}>
            {result.action === 'SCHEDULE' && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleSchedule} activeOpacity={0.85}>
                <Text style={styles.actionBtnText}>Book an Appointment</Text>
                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {result.action === 'WALK_IN' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Decision')} activeOpacity={0.85}>
                <Text style={styles.actionBtnText}>Proceed to Barangay Hall</Text>
                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {result.action === 'SUBMIT_REPORT' && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleSubmitReport} activeOpacity={0.85}>
                <Text style={styles.actionBtnText}>Submit Report</Text>
                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}

            {result.action === 'COMPLAINT_OPTIONS' && (
              <>
                <TouchableOpacity style={styles.actionBtn} onPress={handleSchedule} activeOpacity={0.85}>
                  <Text style={styles.actionBtnText}>Report and Make Appointment</Text>
                  <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={handleMakeReportOnly} activeOpacity={0.85}>
                  <Text style={styles.actionBtnTextSecondary}>Report Only</Text>
                  <ChevronRight size={20} color="#1A1F36" strokeWidth={2.5} />
                </TouchableOpacity>
              </>
            )}
          </View>

        <View style={styles.privacyContainer}>
            <Text style={styles.privacyText}>
              Your data is processed securely under the Data Privacy Act of 2012. Information is only shared with authorized barangay personnel.
            </Text>
          </View>

          <Text style={styles.footerNote}>KomuniServe v1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* ── Floating Tab Bar (Pantay na at walang overlap) ── */}
      <View style={styles.floatingTabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => navigation.navigate('Decision')}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#6B7A99" />
          <Text style={styles.tabLabel}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItemMain} 
          onPress={() => navigation.navigate('Decision')}
          activeOpacity={0.8}
        >
          <View style={styles.mainTabInner}>
            {/* Pinaliit ng konti ang icon para bumagay sa maliit na circle */}
            <RotateCcw size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={styles.tabLabelActive}>Start Over</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const NAVY = '#0038A8';
const BACKGROUND = '#F7F9FC'; // Updated to match other screens
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerCenter: {
    alignItems: 'flex-start',
    flex: 1,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120, // Space for Floating Tab Bar
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5270',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1F36',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  facilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E4E8F1',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  facilityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  facilityTextBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7A99',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F36',
  },
  instructionsCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#E4E8F1',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  instructionsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  instructionsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1F36',
  },
  instructionsText: {
    fontSize: 15,
    color: '#4A5270',
    lineHeight: 24,
  },
  actionContainer: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    height: 56,
    borderRadius: 12, // Updated to match other screens
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  actionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E8F1',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  actionBtnTextSecondary: {
    color: '#1A1F36',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  privacyContainer: {
    marginTop: 32,
    paddingHorizontal: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7A99',
    textAlign: 'justify', // Pinalitan from 'center' to 'justify'
    lineHeight: 18,
  },
  footerNote: {
    textAlign: 'center',
    color: '#A0ABBC',
    fontSize: 11,
    marginTop: 20,
    fontWeight: '600',
  },
  floatingTabBar: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
    height: 70,
    backgroundColor: WHITE,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', 
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabItemMain: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mainTabInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7A99',
    marginTop: 4,
  },
  tabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: NAVY,
  },
});