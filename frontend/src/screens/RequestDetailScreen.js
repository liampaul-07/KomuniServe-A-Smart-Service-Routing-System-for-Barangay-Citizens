import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ScrollView, Platform, StatusBar, Image,
} from 'react-native';
import {
  ChevronLeft,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Tag,
  Layers,
  Building2,
  Zap,
  Calendar,
  MessageSquare,
  CheckCheck,
  XCircle,
} from 'lucide-react-native';

// ─── Priority & Status config ─────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  HIGH:   { color: '#B91C1C', bg: '#FEF2F2', label: 'High Priority',   icon: AlertTriangle },
  MEDIUM: { color: '#C2710C', bg: '#FFF7ED', label: 'Medium Priority', icon: AlertCircle  },
  LOW:    { color: '#15803D', bg: '#F0FDF4', label: 'Low Priority',    icon: CheckCircle  },
};

const STATUS_COLORS = {
  Pending:  { bg: '#FEFCE8', text: '#A16207', border: '#FDE68A' },
  Approved: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  Rejected: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
};

const STATUS_ICONS = {
  Pending:  Clock,
  Approved: CheckCheck,
  Rejected: XCircle,
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function Row({ label, value, IconComponent }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.labelGroup}>
        {IconComponent && (
          <IconComponent size={14} color="#94A3B8" strokeWidth={1.8} style={{ marginRight: 6 }} />
        )}
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RequestDetailScreen({ route, navigation }) {
  const { request } = route.params;
  const [status, setStatus] = useState(request.status);

  const priority     = PRIORITY_CONFIG[request.priority];
  const statusColor  = STATUS_COLORS[status];
  const PriorityIcon = priority.icon;
  const StatusIcon   = STATUS_ICONS[status];

  const handleApprove = () => {
    Alert.alert('Approve Request', `Approve ${request.userName}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          // TODO: await supabase.from('requests').update({ status: 'Approved' }).eq('id', request.id);
          setStatus('Approved');
          Alert.alert('Done', 'Request has been approved.');
        }
      }
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Request', `Reject ${request.userName}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          // TODO: await supabase.from('requests').update({ status: 'Rejected' }).eq('id', request.id);
          setStatus('Rejected');
          Alert.alert('Done', 'Request has been rejected.');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" />

      {/* ── Header: solid Navy, NO gold stripe, IconLogo.jpeg centered ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        {/* ✅ IconLogo.jpeg — perfect circle, white bg, subtle border */}
        <View style={styles.headerLogoWrapper}>
          <Image
            source={require('../../assets/IconLogo.jpeg')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        <View style={{ width: 64 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Page title below header (not inside it) ── */}
        <Text style={styles.pageTitle}>Request Detail</Text>

        {/* ── Resident identity block ── */}
        <View style={styles.identityBlock}>
          <View style={styles.avatarCircle}>
            <User size={26} color="#0038A8" strokeWidth={1.8} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.identityLabel}>RESIDENT</Text>
            <Text style={styles.identityName}>{request.userName}</Text>
          </View>
        </View>

        {/* ── Status + Priority badges ── */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, {
            backgroundColor: statusColor.bg,
            borderColor: statusColor.border,
          }]}>
            <StatusIcon size={13} color={statusColor.text} strokeWidth={2} />
            <Text style={[styles.badgeText, { color: statusColor.text }]}>{status}</Text>
          </View>

          <View style={[styles.badge, {
            backgroundColor: priority.bg,
            borderColor: priority.color + '40',
          }]}>
            <PriorityIcon size={13} color={priority.color} strokeWidth={2} />
            <Text style={[styles.badgeText, { color: priority.color }]}>{priority.label}</Text>
          </View>
        </View>

        {/* ── Info card — gold 4px top accent ── */}
        <Text style={styles.sectionLabelText}>REQUEST INFORMATION</Text>
        <View style={styles.infoCard}>
          {/* ✅ Gold 4px top accent stripe on card */}
          <View style={styles.cardGoldAccent} />
          <View style={styles.cardBody}>
            <Row label="Category"  value={request.category}                   IconComponent={Tag}       />
            <Row label="Type"      value={request.subType.replace(/_/g, ' ')} IconComponent={Layers}    />
            <Row label="Facility"  value={request.facility}                   IconComponent={Building2} />
            <Row label="Action"    value={request.action.replace(/_/g, ' ')}  IconComponent={Zap}       />
            <Row label="Submitted" value={formatDate(request.timestamp)}       IconComponent={Calendar}  />
          </View>
        </View>

        {/* ── Description card — gold 4px top accent ── */}
        {request.description !== '' && (
          <>
            <Text style={styles.sectionLabelText}>RESIDENT'S DESCRIPTION</Text>
            <View style={styles.descCard}>
              {/* ✅ Gold 4px top accent stripe on card */}
              <View style={styles.cardGoldAccent} />
              <View style={styles.cardBody}>
                <MessageSquare size={16} color="#94A3B8" strokeWidth={1.8} style={{ marginBottom: 10 }} />
                <Text style={styles.descText}>{request.description}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── Action buttons (Pending only) ── */}
        {status === 'Pending' && (
          <>
            <Text style={styles.sectionLabelText}>ADMIN ACTION</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={handleApprove}
                activeOpacity={0.82}
              >
                <CheckCheck size={18} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={handleReject}
                activeOpacity={0.82}
              >
                <XCircle size={18} color="#B91C1C" strokeWidth={2.2} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Resolved banner ── */}
        {status !== 'Pending' && (
          <View style={[styles.resolvedBanner, {
            backgroundColor: statusColor.bg,
            borderColor: statusColor.border,
          }]}>
            <StatusIcon size={18} color={statusColor.text} strokeWidth={2} />
            <Text style={[styles.resolvedText, { color: statusColor.text }]}>
              This request has been {status.toLowerCase()}.
            </Text>
          </View>
        )}

        <Text style={styles.footerNote}>KomuniServe v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const NAVY        = '#0038A8';
const GOLD_STRIPE = '#F9C800';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Header: solid Navy, NO gold stripe ──────────
  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 14,
    paddingBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
    width: 64,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // ✅ IconLogo — perfect circle, white bg, subtle border, NO placeholder text
  headerLogoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },

  // ── Content ─────────────────────────────────────
  content: {
    padding: 20,
    paddingBottom: 48,
  },

  // ── Page title (below header, not in it) ────────
  pageTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C8960C',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 16,
    marginTop: 4,
  },

  // ── Identity block ───────────────────────────────
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FB',
    borderWidth: 1.5,
    borderColor: '#C5D5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    flex: 1,
  },
  identityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C8960C',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  identityName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // ── Badges ──────────────────────────────────────
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.1,
  },

  // ── Section label ────────────────────────────────
  sectionLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  // ── Cards: overflow:hidden + gold 4px top accent ─
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',       // clips the gold accent to the card's rounded corners
  },
  descCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  // ✅ Gold 4px accent — top of card only, NOT on headers
  cardGoldAccent: {
    height: 4,
    backgroundColor: GOLD_STRIPE,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  descText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },

  // ── Action buttons ───────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803D',
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#B91C1C',
  },
  rejectBtnText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Resolved banner ──────────────────────────────
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  resolvedText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Footer ───────────────────────────────────────
  footerNote: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 16,
  },
});