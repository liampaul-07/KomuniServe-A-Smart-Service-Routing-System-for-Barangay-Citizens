import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, StatusBar, Alert
} from 'react-native';
import { supabase } from '../services/supabase';

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

const DEFAULT_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM',  '4:00 PM',
];

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

// Converts DB time format "HH:MM" to display format "H:MM AM/PM"
function formatTimeForDisplay(dbTime) {
  const [hourStr, minuteStr] = dbTime.split(':');
  const hour = parseInt(hourStr);
  const minute = minuteStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${ampm}`;
}


function formatTimeForDB(displayTime) {
  const [time, ampm] = displayTime.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr);
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minuteStr}:00`;
}

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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsPerDate, setSlotsPerDate] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available slots whenever selected date changes
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  // Pre-fetch slot availability for all 14 dates
  useEffect(() => {
    fetchAllDateAvailability();
  }, []);

  const fetchAllDateAvailability = async () => {
    try {
      const startDate = dateKey(WEEK_DATES[0]);
      const endDate  = dateKey(WEEK_DATES[WEEK_DATES.length - 1]);
      
      const { data, error } = await supabase
        .from('time_slots')
        .select('slot_date, slot_time')
        .eq('is_available', false)
        .gte('slot_date', startDate)
        .lte('slot_date', endDate);
      if (error) throw error;

      // Build a map of { dateKey: [times] }
      const closedCountMap = {};
      data.forEach(row => {
        closedCountMap[row.slot_date] = (closedCountMap[row.slot_date] ?? 0) + 1;
      });

      const map = {};
      WEEK_DATES.forEach(date => {
        const dk = dateKey(date);
        const closedCount = closedCountMap[dk] ?? 0;
        map[dk] = DEFAULT_TIMES.length - closedCount;
      });
      setSlotsPerDate(map);
    } catch (error) {
      console.log('Error fetching date availability', error.message);
    }
  };

  const fetchSlots = async (date) => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedTime(null);

    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('slot_time, is_available')
        .eq('slot_date', dateKey(date))
        .eq('is_available', false)
        .order('slot_time', { ascending: true });
      
        if (error) throw error;

        const closedTimes = new Set(
          data.map(row => formatTimeForDisplay(row.slot_time))
        );

        const openTimes = DEFAULT_TIMES.filter(t => !closedTimes.has(t));
        setAvailableSlots(openTimes);
    } catch (error) {
      console.log('Error fetching slots:', error.message)
      Alert.alert('Error fetching available slots. Please try again later.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleConfirm = async () => {
    if (!selectedTime) {
      Alert.alert('No time selected', 'Please select a time slot before confirming.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user session

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('User not authenticated. Please log in again.');

      const userId = session.user.id;
      const dbTime = formatTimeForDB(selectedTime);
      const dbDate = dateKey(selectedDate);

      // Insert new appointment
      const { data: request, error: requestError } = await supabase 
        .from('requests')
        .insert({
          user_id: userId,
          category: category,
          service_requested: result.intake_answers?.subType ?? category,
          priority: result.priority,
          intake_answers: result,
          status: 'Pending',
          description: result.intake_answers?.description ?? '',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (requestError) throw requestError;

      // Insert into appointments table
      const { error: apptError } = await supabase
        .from('appointments')
        .insert({
          request_id: request.id,
          user_id: userId,
          scheduled_date: dbDate,
          scheduled_time: dbTime,
          appointment_status: 'Pending',
        });

      if (apptError) throw apptError;
      
      navigation.replace('Confirmation', {
        category,
        facility:  result.facility,
        date:      formatFullDate(selectedDate),
        time:      selectedTime,
        priority:  result.priority,
      });
    } catch (error) {
      Alert.alert('Booking Error', 'Something went wrong. Please try again.');
      console.log('Booking error:', error.message);
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
              const hasSlots    = (slotsPerDate[dateKey(date)] ?? DEFAULT_TIMES.length) > 0;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dateChip,
                    isSelected  && styles.dateChipSelected,
                    !hasSlots   && styles.dateChipDisabled,
                  ]}
                  onPress={() => handleDateSelect(date)}
                  activeOpacity={0.7}
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
        {loadingSlots ? (
          <View style={styles.noSlotsBox}>
            <Text style={styles.noSlotsText}>Loading slots...</Text>
          </View>
        ) : availableSlots.length === 0 ? (
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