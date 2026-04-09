import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Platform, StatusBar, Image, Animated,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ArrowLeft,
  MapPin,
  FileText,
  ChevronRight,
} from 'lucide-react-native';

// ─── PRIORITY CONFIG — no emojis ─────────────────────────────
const PRIORITY_CONFIG = {
  HIGH:   { color: '#B71C1C', bg: '#FDECEA', border: '#EF9A9A', label: 'High Priority'   },
  MEDIUM: { color: '#C35A00', bg: '#FFF3E0', border: '#FFB347', label: 'Medium Priority' },
  LOW:    { color: '#1E6B1E', bg: '#EBF5EB', border: '#81C784', label: 'Low Priority'    },
};

const ACTION_LABELS = {
  SCHEDULE:      'Book an Appointment',
  WALK_IN:       'Proceed to Barangay Hall',
  SUBMIT_REPORT: 'Submit Report',
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
  const { result, category } = route.params;
  const config = PRIORITY_CONFIG[result.priority];

  const handleAction = () => {
    if (result.action === 'SCHEDULE') {
      // TODO: navigate to BookAppointment screen when built
      // navigation.navigate('BookAppointment', { category, result });
      console.log('Navigate to booking — not built yet');
    } else if (result.action === 'SUBMIT_REPORT') {
      // TODO: save report to Supabase when connected
      // await supabase.from('requests').insert({ ... });
      Alert.alert(
        'Report Submitted',
        'Your report has been logged. Barangay staff will be notified.',
        [{ text: 'OK', onPress: () => navigation.navigate('Decision') }]
      );
    } else {
      navigation.navigate('Decision');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" />

      {/* ── Solid Navy header — no stripes, no gold ── */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Decision')}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          <HeaderLogo />

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Service Result</Text>
            <Text style={styles.headerSub}>Assessment summary</Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.content}>

        {/* Category label + title */}
        <View style={styles.titleBlock}>
          <Text style={styles.categoryLabel}>{category}</Text>
          <Text style={styles.title}>Service Assessment</Text>
        </View>

        {/* Priority badge — no emoji, lucide-style dot */}
        <View style={[styles.priorityBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
          <View style={[styles.priorityDot, { backgroundColor: config.color }]} />
          <Text style={[styles.priorityText, { color: config.color }]}>{config.label}</Text>
        </View>

        {/* Facility row — MapPin icon replaces 📍 emoji */}
        <View style={styles.facilityRow}>
          <View style={styles.facilityIconBox}>
            <MapPin size={15} color="#0038A8" strokeWidth={2} />
          </View>
          <Text style={styles.facilityText}>{result.facility}</Text>
        </View>

        {/* Instructions card — no gold accent, clean border */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeadingRow}>
            <FileText size={13} color="#9AA0B5" strokeWidth={2} />
            <Text style={styles.instructionsHeading}>What to do</Text>
          </View>
          <Text style={styles.instructionsText}>{result.instructions}</Text>
        </View>

        {/* Primary action button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>
            {ACTION_LABELS[result.action] ?? 'Proceed'}
          </Text>
          <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Secondary button */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('GuidedPath')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Start Over</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },

  // ── Header — solid Navy, NO stripe, NO gold ──
  header: {
    backgroundColor: '#0038A8',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 10,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoImage: {
    width: 38,
    height: 38,
  },
  headerTextBlock: { flex: 1 },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    letterSpacing: 0.2,
  },
  headerSub: {
    color: '#A8C0F0',
    fontSize: 11,
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },

  // ── Body ──
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },

  // Title block
  titleBlock: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9AA0B5',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1F36',
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },

  // Priority badge — no emoji, dot indicator
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontWeight: '700',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },

  // Facility row — MapPin icon
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  facilityIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E8EFFD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5D5F5',
  },
  facilityText: {
    flex: 1,
    fontSize: 14,
    color: '#2C3250',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },

  // Instructions card — clean, no gold accent
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E8EBF2',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  instructionsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  instructionsHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9AA0B5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  instructionsText: {
    fontSize: 15,
    color: '#2C3250',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },

  // Primary action button — Navy, no gold
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: '#0038A8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
    elevation: 3,
    shadowColor: '#0038A8',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },

  // Secondary button
  secondaryBtn: {
    alignItems: 'center',
    padding: 12,
  },
  secondaryBtnText: {
    color: '#9AA0B5',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
});