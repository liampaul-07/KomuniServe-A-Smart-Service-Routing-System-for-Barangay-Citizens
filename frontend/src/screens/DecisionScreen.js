import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import {
  HelpCircle,
  LayoutGrid,
  CalendarCheck,
  ChevronRight,
  LogOut,
  Info,
} from 'lucide-react-native';

import { supabase } from '../services/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────
const NAVY       = '#0038A8';
const GOLD_LABEL = '#C8960C';
const GOLD_BADGE = '#F9C800';

// ─── Card Data ────────────────────────────────────────────────────────────────
const CARDS = [
  {
    id: 'guided',
    route: 'GuidedPath',
    variant: 'primary',
    Icon: HelpCircle,
    title: 'Help Me Choose',
    badge: 'GUIDED',
    sub: "We'll ask a few questions to find the right service and priority for you.",
  },
  {
    id: 'direct',
    route: 'DirectAccess',
    variant: 'outline',
    Icon: LayoutGrid,
    title: 'Direct Access',
    badge: null,
    sub: 'If you already know exactly what document or service you need.',
  },
  {
    id: 'appointments',
    route: 'AppointmentStatus',
    variant: 'outline',
    Icon: CalendarCheck,
    title: 'My Appointments',
    badge: null,
    sub: 'Check the status of your submitted appointments and requests.',
  },
];

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ card, onPress }) {
  const { variant, Icon, title, badge, sub } = card;
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.card, isPrimary ? styles.cardPrimary : styles.cardOutline]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardInner}>
        <View style={[styles.cardIconBox, isPrimary ? styles.cardIconBoxPrimary : styles.cardIconBoxOutline]}>
          <Icon
            size={24}
            color={isPrimary ? '#FFFFFF' : NAVY}
            strokeWidth={1.8}
          />
        </View>

        <View style={styles.cardTextBlock}>
          <Text style={[styles.cardTitle, isPrimary ? styles.cardTitleLight : styles.cardTitleDark]}>
            {title}
          </Text>
          {badge && (
            <Text style={styles.cardBadge}>{badge}</Text>
          )}
          <Text style={[styles.cardSub, isPrimary ? styles.cardSubLight : styles.cardSubDark]}>
            {sub}
          </Text>
        </View>

        <ChevronRight
          size={20}
          color={isPrimary ? 'rgba(255,255,255,0.4)' : '#C5D0E8'}
          strokeWidth={2}
          style={styles.cardChevron}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DecisionScreen({ navigation }) {

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLogoRow}>
            <View style={styles.headerLogoBox}>
              <Image
                source={require('../../assets/IconLogo.jpeg')}
                style={styles.headerLogoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.headerAppName}>KomuniServe</Text>
              <Text style={styles.headerTagline}>Barangay Digital Services</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingLabel}>WELCOME</Text>
          <Text style={styles.title}>How can we help you today?</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to access barangay services.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Cards */}
        <View style={styles.cardList}>
          {CARDS.map((card) => (
            <ServiceCard
              key={card.id}
              card={card}
              onPress={() => navigation.navigate(card.route)}
            />
          ))}
        </View>

        {/* Privacy note */}
        <View style={styles.privacyRow}>
          <Info size={16} color="#8892AA" strokeWidth={1.8} style={{ marginTop: 2 }} />
          <Text style={styles.privacyText}>
            All information is handled in accordance with the{'\n'}
            <Text style={styles.privacyLink}>Data Privacy Act of 2012</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* ── Floating Footer Bar ── */}
      <View style={styles.floatingBar}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#C0391B" strokeWidth={2} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionNote}>KomuniServe v7.12.0</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Matches previous screen's lighter background
  },

  // ── Header ──────────────────────────────────────
  header: {
    backgroundColor: NAVY,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 16,
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12, // More modern squircle shape vs pure circle
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerLogoImage: {
    width: '100%',
    height: '100%',
  },
  headerAppName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerTagline: {
    color: '#A8C0F0',
    fontSize: 13,
    marginTop: 2,
  },

  // ── Scroll ──────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 120,
  },

  // ── Greeting ────────────────────────────────────
  greetingBlock: {
    marginBottom: 24,
  },
  greetingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD_LABEL,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A1F36',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7A99',
    marginTop: 10,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF1F7',
    marginBottom: 24,
  },

  // ── Cards ───────────────────────────────────────
  cardList: {
    gap: 14,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4, // Pre-allocate left border space
    borderLeftColor: 'transparent',
  },
  cardPrimary: {
    backgroundColor: NAVY,
    borderLeftColor: GOLD_BADGE, // Replaces the top view accent
    elevation: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8F1',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12, // Unified border radius
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardIconBoxPrimary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardIconBoxOutline: {
    backgroundColor: '#EEF2FB',
  },
  cardTextBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  cardTitleLight: {
    color: '#FFFFFF',
  },
  cardTitleDark: {
    color: '#1A1F36',
  },
  cardBadge: {
    color: GOLD_BADGE,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 4,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  cardSubLight: {
    color: '#A8C0F0',
  },
  cardSubDark: {
    color: '#6B7A99',
  },
  cardChevron: {
    marginLeft: 4,
  },

  // ── Privacy note ────────────────────────────────
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 32,
    paddingHorizontal: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: '#8892AA',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  privacyLink: {
    color: NAVY,
    fontWeight: '600',
  },

  // ── Floating Bar ────────────────────────────────
  floatingBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Pill shape
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: NAVY,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: '#EDF1F7',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF4EE', // Softer, less aggressive red/orange
  },
  logoutText: {
    color: '#C0391B',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  versionNote: {
    color: '#A0ABBC',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
});