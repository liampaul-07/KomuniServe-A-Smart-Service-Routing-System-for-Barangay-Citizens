import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, StatusBar, Alert
} from 'react-native';

// ─── HELPERS ─────────────────────────────────────────────────
const WEEK_DATES = (() => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
})();

function dateKey(date) {
  return date.toISOString().split('T')[0];
}
function formatDayLabel(date) {
  return date.toLocaleDateString('en-PH', { weekday: 'short' });
}
function formatDayNumber(date) {
  return date.getDate().toString();
}
function formatFullDate(date) {
  return date.toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ─── MOCK AVAILABLE SLOTS ────────────────────────────────────
// TODO: Replace with Supabase fetch:
// const { data } = await supabase
//   .from('time_slots')
//   .select('slot_time')
//   .eq('slot_date', dateKey(selectedDate))
//   .eq('is_available', true);
// Then map results to an array of time strings.
const MOCK_AVAILABLE = {
  [dateKey(WEEK_DATES[0])]: ['9:00 AM', '11:00 AM', '2:00 PM'],
  [dateKey(WEEK_DATES[1])]: ['8:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'],
  [dateKey(WEEK_DATES[2])]: ['9:00 AM', '4:00 PM'],
  [dateKey(WEEK_DATES[3])]: ['8:00 AM', '11:00 AM', '2:00 PM'],
  [dateKey(WEEK_DATES[4])]: ['10:00 AM', '3:00 PM'],
};

const PRIORITY_CONFIG = {
  HIGH:   { color: '#C62828', bg: '#FFEBEE', label: '🚨 High Priority'   },
  MEDIUM: { color: '#E65100', bg: '#FFF8E1', label: '⚠️ Medium Priority' },
  LOW:    { color: '#2E7D32', bg: '#E8F5E9', label: '✅ Low Priority'    },
};

export default function BookAppointmentScreen({ route, navigation }) {
  const { result, category } = route.params;
  const priority = PRIORITY_CONFIG[result.priority];

  const [selectedDate, setSelectedDate] = useState(WEEK_DATES[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const key            = dateKey(selectedDate);
  const availableSlots = MOCK_AVAILABLE[key] ?? [];

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null); // reset time when date changes
  };

  const handleConfirm = async () => {
    if (!selectedTime) {
      Alert.alert('No time selected', 'Please select a time slot before confirming.');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Save appointment to Supabase
      // Step 1 — insert into requests table:
      // const { data: request, error: requestError } = await supabase
      //   .from('requests')
      //   .insert({
      //     user_id:           currentUser.id,
      //     service_requested: category,
      //     priority:          result.priority,
      //     intake_answers:    result,
      //     status:            'Pending',
      //     description:       result.instructions,
      //     submitted_at:      new Date().toISOString(),
      //   })
      //   .select()
      //   .single();
      // if (requestError) throw requestError;
      //
      // Step 2 — insert into appointments table:
      // const { error: apptError } = await supabase
      //   .from('appointments')
      //   .insert({
      //     request_id:         request.id,
      //     scheduled_date:     key,
      //     scheduled_time:     selectedTime,
      //     appointment_status: 'Pending',
      //   });
      // if (apptError) throw apptError;
      //
      // Step 3 — mark slot as unavailable:
      // await supabase
      //   .from('time_slots')
      //   .update({ is_available: false })
      //   .eq('slot_date', key)
      //   .eq('slot_time', selectedTime);

      navigation.replace('Confirmation', {
        category,
        facility:  result.facility,
        date:      formatFullDate(selectedDate),
        time:      selectedTime,
        priority:  result.priority,
      });
    } catch (error) {
      Alert.alert('Booking Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Booking summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCategory}>{category}</Text>
          <Text style={styles.summaryFacility}>📍 {result.facility}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.priorityText, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>
        </View>

        {/* Date selection */}
        <Text style={styles.sectionLabel}>Select a date</Text>
        <View style={styles.dateStripWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {WEEK_DATES.map((date, i) => {
              const isSelected  = dateKey(date) === dateKey(selectedDate);
              const isToday     = dateKey(date) === dateKey(new Date());
              const hasSlots    = (MOCK_AVAILABLE[dateKey(date)] ?? []).length > 0;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dateChip,
                    isSelected  && styles.dateChipSelected,
                    !hasSlots   && styles.dateChipDisabled,
                  ]}
                  onPress={() => hasSlots && handleDateSelect(date)}
                  activeOpacity={hasSlots ? 0.7 : 1}
                >
                  <Text style={[styles.dateDayLabel, isSelected && styles.dateLabelSelected]}>
                    {formatDayLabel(date)}
                  </Text>
                  <Text style={[styles.dateDayNumber, isSelected && styles.dateLabelSelected]}>
                    {formatDayNumber(date)}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
                  )}
                  {!hasSlots && <Text style={styles.noSlotMark}>–</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected date label */}
        <Text style={styles.selectedDateText}>{formatFullDate(selectedDate)}</Text>

        {/* Time slots */}
        <Text style={styles.sectionLabel}>Select a time slot</Text>
        {availableSlots.length === 0 ? (
          <View style={styles.noSlotsBox}>
            <Text style={styles.noSlotsText}>No available slots on this date.</Text>
            <Text style={styles.noSlotsSubText}>Please select a different date.</Text>
          </View>
        ) : (
          <View style={styles.timeGrid}>
            {availableSlots.map(time => {
              const isSelected = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => setSelectedTime(time)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected summary before confirm */}
        {selectedTime && (
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionSummaryText}>
              📅 {formatFullDate(selectedDate)} at {selectedTime}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Confirm button — fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!selectedTime || isSubmitting) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedTime || isSubmitting}
        >
          <Text style={styles.confirmBtnText}>
            {isSubmitting ? 'Submitting...' : 'Confirm Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 12,
    backgroundColor: '#0047AB',
  },
  backBtn:       { padding: 4 },
  backBtnText:   { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  headerTitle:   { color: '#FFF', fontWeight: 'bold', fontSize: 17 },

  content: { padding: 20, paddingBottom: 40 },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryCategory: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  summaryFacility: { fontSize: 14, color: '#555', marginBottom: 12 },
  priorityBadge:   { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  priorityText:    { fontSize: 13, fontWeight: '700' },

  // Section labels
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Date strip
  dateStripWrapper: { marginBottom: 10 },
  dateStrip:        { gap: 8, paddingBottom: 4 },
  dateChip: {
    flexShrink: 0,
    width: 52,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EEE',
  },
  dateChipSelected: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  dateChipDisabled: { backgroundColor: '#F5F5F5', borderColor: '#F0F0F0' },
  dateDayLabel:      { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  dateDayNumber:     { fontSize: 18, fontWeight: '800', color: '#333', marginTop: 2 },
  dateLabelSelected: { color: '#FFF' },
  todayDot:          { width: 5, height: 5, borderRadius: 3, backgroundColor: '#0047AB', marginTop: 4 },
  todayDotSelected:  { backgroundColor: '#FFF' },
  noSlotMark:        { fontSize: 11, color: '#CCC', marginTop: 2 },

  selectedDateText: {
    fontSize: 14, fontWeight: '600', color: '#444',
    marginBottom: 24,
  },

  // Time grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  timeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EEE',
    elevation: 1,
  },
  timeChipSelected:     { backgroundColor: '#0047AB', borderColor: '#0047AB' },
  timeChipText:         { fontSize: 15, fontWeight: '600', color: '#333' },
  timeChipTextSelected: { color: '#FFF' },

  // No slots
  noSlotsBox: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  noSlotsText:    { fontSize: 15, fontWeight: '600', color: '#999' },
  noSlotsSubText: { fontSize: 13, color: '#BBB', marginTop: 4 },

  // Selection summary
  selectionSummary: {
    backgroundColor: '#EEF3FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionSummaryText: { fontSize: 14, fontWeight: '600', color: '#0047AB' },

  // Footer
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  confirmBtn: {
    backgroundColor: '#0047AB',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#B0C4DE' },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
});