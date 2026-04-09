import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Platform, StatusBar,
  Image,
} from 'react-native';
import {
  HelpCircle,
  LayoutGrid,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

export default function DecisionScreen({ navigation }) {

  const handleLogout = () => {
    // TODO: await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" />

      {/* ── Header: solid Navy, NO gold stripe, IconLogo centered ── */}
      <View style={styles.header}>
        {/* ✅ NO headerGoldStripe here — removed per new rules */}
        <View style={styles.headerContent}>
          <View style={styles.headerLogoRow}>

            {/* ✅ IconLogo.jpeg — perfect circle, white bg, subtle border, NO 'K' text */}
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

      <View style={styles.content}>

        {/* ── Greeting block ── */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingLabel}>WELCOME</Text>
          <Text style={styles.title}>How can we help you today?</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to access barangay services.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Guided Intake */}
        <TouchableOpacity
          style={styles.cardPrimary}
          onPress={() => navigation.navigate('GuidedPath')}
          activeOpacity={0.85}
        >
          <View style={styles.cardInner}>
            {/* ✅ Lucide icon — no placeholder 'G' text */}
            <View style={styles.cardIconBox}>
              <HelpCircle size={22} color="#FFFFFF" strokeWidth={1.8} />
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardTitleLight}>Help Me Choose</Text>
              <Text style={styles.cardBadgeText}>GUIDED</Text>
              <Text style={styles.cardSubLight}>
                We'll ask a few questions to find the right service and priority for you.
              </Text>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.35)" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* Direct access */}
        <TouchableOpacity
          style={styles.cardOutline}
          onPress={() => navigation.navigate('DirectAccess')}
          activeOpacity={0.85}
        >
          <View style={styles.cardInner}>
            {/* ✅ Lucide icon — no placeholder 'D' text */}
            <View style={styles.cardIconBoxOutline}>
              <LayoutGrid size={22} color="#0038A8" strokeWidth={1.8} />
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardTitleDark}>Direct Access</Text>
              <Text style={styles.cardSubDark}>
                If you already know exactly what document or service you need.
              </Text>
            </View>
            <ChevronRight size={18} color="#C5D0E8" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        {/* My Appointments */}
        <TouchableOpacity
          style={styles.cardOutline}
          onPress={() => navigation.navigate('AppointmentStatus')}
          activeOpacity={0.85}
        >
          <View style={styles.cardInner}>
            {/* ✅ Lucide icon — no placeholder 'D' text */}
            <View style={styles.cardIconBoxOutline}>
              <LayoutGrid size={22} color="#0038A8" strokeWidth={1.8} />
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardTitleDark}>My Appointments</Text>
              <Text style={styles.cardSubDark}>
                Check the status of your submitted appointments and requests.
              </Text>
            </View>
            <ChevronRight size={18} color="#C5D0E8" strokeWidth={2} />
          </View>
        </TouchableOpacity>


        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logout}
            activeOpacity={0.8}
          >
            <LogOut size={15} color="#C62828" strokeWidth={2} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>KomuniServe v1.0.0</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const NAVY        = '#0038A8';
const GOLD_ACCENT = '#F9C800';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },

  // ── Header: solid Navy, NO gold stripe ──────────
  header: {
    backgroundColor: NAVY,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    // ✅ No borderTopColor, no gold stripe child anywhere
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

  // ✅ Perfect circle logo — white bg, subtle border, NO gold border
  headerLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',  // ✅ subtle white border, NOT gold
  },
  headerLogoImage: {
    width: '100%',
    height: '100%',
  },
  headerAppName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerTagline: {
    color: '#A8C0F0',
    fontSize: 11,
    marginTop: 1,
  },

  // ── Content ─────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },

  // ── Greeting ────────────────────────────────────
  greetingBlock: {
    marginBottom: 28,
  },
  greetingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C8960C',              // ✅ gold label — same as other screens
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1F36',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#8892AA',
    marginTop: 8,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E4EF',
    marginBottom: 28,
  },

  // ── Primary card ─────────────────────────────────
  cardPrimary: {
    backgroundColor: NAVY,
    borderRadius: 8,              // ✅ 8px — consistent with all screens
    marginBottom: 14,
    overflow: 'hidden',           // ✅ clips gold accent to rounded corners
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexShrink: 0,
  },
  cardTextBlock: {
    flex: 1,
  },
  cardTitleLight: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  cardBadgeText: {
    color: GOLD_ACCENT,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 3,
    marginBottom: 6,
  },
  cardSubLight: {
    color: '#A8C0F0',
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Outline card ─────────────────────────────────
  cardOutline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,              // ✅ 8px — consistent with all screens
    borderWidth: 1,
    borderColor: '#E0E4EF',
    marginBottom: 14,
    overflow: 'hidden',           // ✅ clips gold accent to rounded corners
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardIconBoxOutline: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#EEF2FB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5D5F5',
    flexShrink: 0,
  },
  cardTitleDark: {
    color: '#1A1F36',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GOLD_ACCENT,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
    marginBottom: 6,
  },
  comingSoonText: {
    color: '#B8860B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardSubDark: {
    color: '#8892AA',
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Footer ───────────────────────────────────────
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD0D0',
    backgroundColor: '#FFF0F0',
  },
  logoutText: {
    color: '#C62828',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  footerNote: {
    color: '#C0C6D8',
    fontSize: 11,
  },
});