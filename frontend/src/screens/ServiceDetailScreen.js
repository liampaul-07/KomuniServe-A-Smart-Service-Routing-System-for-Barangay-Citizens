import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, StatusBar
} from 'react-native';

const ACTION_CONFIG = {
  SCHEDULE: {
    label:    'Book an Appointment',
    subLabel: 'Pick a date and time slot.',
    color:    '#0047AB',
  },
  WALK_IN: {
    label:    'Walk In',
    subLabel: 'No appointment needed. Go directly to the facility.',
    color:    '#2E7D32',
  },
};

const CATEGORY_COLORS = {
  Medical:   { bg: '#FFEBEE', text: '#C62828' },
  Documents: { bg: '#E8F5E9', text: '#2E7D32' },
  Complaint: { bg: '#FFF8E1', text: '#E65100' },
};

const PRIORITY_CONFIG = {
  HIGH:   { color: '#C62828', bg: '#FFEBEE', label: '🚨 High Priority'   },
  MEDIUM: { color: '#E65100', bg: '#FFF8E1', label: '⚠️ Medium Priority' },
  LOW:    { color: '#2E7D32', bg: '#E8F5E9', label: '✅ Low Priority'    },
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { service } = route.params;

  const actionConfig   = ACTION_CONFIG[service.action]   ?? ACTION_CONFIG.SCHEDULE;
  const categoryColor  = CATEGORY_COLORS[service.category];
  const priorityConfig = PRIORITY_CONFIG[service.priority];

  const handleAction = () => {
    if (service.action === 'SCHEDULE') {
      // Build a result object consistent with what GuidedPathScreen produces
      // so BookAppointmentScreen receives the same shape regardless of entry point
      const result = {
        priority:            service.priority,
        instructions:        `You are booking: ${service.name}. Please bring all listed requirements.`,
        action:              'SCHEDULE',
        requiresAppointment: true,
        facility:            service.facility,
        timestamp:           new Date().toISOString(),
      };
      navigation.navigate('BookAppointment', {
        result,
        category: service.category,
      });
    } else {
      navigation.navigate('Decision');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Service identity */}
        <View style={styles.identityCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{service.icon}</Text>
          </View>

          <View style={styles.identityBody}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryColor.text }]}>
                {service.category}
              </Text>
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDesc}>{service.description}</Text>
          </View>
        </View>

        {/* Facility + priority */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Facility</Text>
            <Text style={styles.metaValue}>📍 {service.facility}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
            <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
              {priorityConfig.label}
            </Text>
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.requirementsCard}>
            {service.requirements.map((req, i) => (
              <View key={i} style={styles.requirementRow}>
                <View style={styles.requirementDot} />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* What to expect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to expect</Text>
          <View style={styles.expectCard}>
            <Text style={styles.expectText}>
              {service.action === 'SCHEDULE'
                ? 'You will need to book an appointment. Staff will review your request and confirm your schedule. Bring all requirements on your appointment date.'
                : 'No appointment needed. Proceed directly to the facility during office hours and bring your requirements.'
              }
            </Text>
          </View>
        </View>

        {/* Office hours note */}
        <View style={styles.officeHoursCard}>
          <Text style={styles.officeHoursIcon}>🕐</Text>
          <Text style={styles.officeHoursText}>
            Office hours: Monday – Friday, 8:00 AM – 5:00 PM
          </Text>
        </View>

      </ScrollView>

      {/* Action footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: actionConfig.color }]}
          onPress={handleAction}
        >
          <Text style={styles.actionBtnText}>{actionConfig.label}</Text>
        </TouchableOpacity>
        <Text style={styles.actionSubLabel}>{actionConfig.subLabel}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 12,
    backgroundColor: '#0047AB',
  },
  backBtn:     { padding: 4 },
  backBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  headerTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },

  content: { padding: 20, paddingBottom: 40 },

  // Identity card
  identityCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#F0F2F8',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  iconText:      { fontSize: 28 },
  identityBody:  {},
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginBottom: 8,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '700' },
  serviceName: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  serviceDesc: { fontSize: 14, color: '#777', lineHeight: 21 },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
  },
  metaItem:     { flex: 1, marginRight: 10 },
  metaLabel:    { fontSize: 11, color: '#AAA', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  metaValue:    { fontSize: 13, fontWeight: '600', color: '#444' },
  priorityBadge:{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  priorityText: { fontSize: 12, fontWeight: '700' },

  // Sections
  section:      { marginBottom: 14 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 10,
  },

  requirementsCard: {
    backgroundColor: '#FFF',
    borderRadius: 14, padding: 16,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  requirementDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#0047AB',
    marginTop: 6, flexShrink: 0,
  },
  requirementText: { fontSize: 14, color: '#333', flex: 1, lineHeight: 21 },

  expectCard: {
    backgroundColor: '#EEF3FF',
    borderRadius: 14, padding: 16,
  },
  expectText: { fontSize: 14, color: '#0047AB', lineHeight: 21 },

  officeHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#EEE',
  },
  officeHoursIcon: { fontSize: 16 },
  officeHoursText: { fontSize: 13, color: '#888' },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  actionBtn: {
    padding: 18, borderRadius: 14,
    alignItems: 'center', marginBottom: 8,
  },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  actionSubLabel:{ fontSize: 13, color: '#AAA', textAlign: 'center' },
});