import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Platform, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { 
  ArrowLeft, MapPin, CalendarDays, Clock, 
  CheckCircle2, AlertCircle, CalendarCheck 
} from 'lucide-react-native';
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

// Updated Configuration Colors to match theme
const PRIORITY_CONFIG = {
  HIGH:   { color: '#B71C1C', bg: '#FDECEA', border: '#EF9A9A', label: 'High Priority'   },
  MEDIUM: { color: '#C35A00', bg: '#FFF3E0', border: '#FFB347', label: 'Medium Priority' },
  LOW:    { color: '#1E6B1E', bg: '#EBF5EB', border: '#81C784', label: 'Low Priority'    },
};

export default function BookAppointmentScreen({ route, navigation }) {
  const { result, category, subType, urgency, description } = route.params;
  const priority = PRIORITY_CONFIG[result.priority] || PRIORITY_CONFIG.LOW;

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
      const { data: { session } , error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('User not authenticated. Please log in again.');

      const userId = session.user.id;
      const dbTime = formatTimeForDB(selectedTime);
      const dbDate = dateKey(selectedDate);

      // Insert new request
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert({
          user_id:            userId,
          category:           category,
          service_requested:  subType ?? category,
          priority:           result.priority,
          intake_answers:     {
            ...result,
            subType: subType,
            urgency: urgency,
            category: category,
            description: description
          },
          status:             'Pending',
          description:        description ?? '',
          submitted_at:       new Date().toISOString(),
        })
        .select()
        .single();
      if (requestError) throw requestError;

      const { error: apptError } = await supabase
        .from('appointments')
        .insert({
          request_id:         request.id,
          user_id:            userId,
          scheduled_date:     dbDate,
          scheduled_time:     dbTime,
          appointment_status: 'Pending',
        });

      if (apptError) throw apptError;
      
      navigation.replace('Confirmation', {
        mode:     'appointment',
        category,
        subType,
        facility: result.facility,
        date:     formatFullDate(selectedDate),
        time:     selectedTime,
        priority: result.priority,
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
      <StatusBar backgroundColor="#0038A8" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>BOOKING</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>Select Date & Time</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Booking summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCategory}>{category}</Text>
          
          <View style={styles.metaRowItem}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.summaryFacility}>{result.facility}</Text>
          </View>
          
          <View style={[styles.priorityPill, { backgroundColor: priority.bg, borderColor: priority.border }]}>
            <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
            <Text style={[styles.priorityPillText, { color: priority.color }]}>
              {priority.label}
            </Text>
          </View>
        </View>

        {/* Date selection */}
        <View style={styles.sectionHeader}>
          <CalendarDays size={18} color="#0038A8" />
          <Text style={styles.sectionLabel}>Select Date</Text>
        </View>
        
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
                  disabled={!hasSlots}
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
        <View style={styles.sectionHeader}>
          <Clock size={18} color="#0038A8" />
          <Text style={styles.sectionLabel}>Select Time Slot</Text>
        </View>

        {loadingSlots ? (
          <View style={styles.noSlotsBox}>
            <ActivityIndicator size="small" color="#0038A8" />
            <Text style={styles.noSlotsText}>Loading slots...</Text>
          </View>
        ) : availableSlots.length === 0 ? (
          <View style={styles.noSlotsBox}>
            <AlertCircle size={24} color="#94A3B8" style={{ marginBottom: 8 }} />
            <Text style={styles.noSlotsText}>No available slots</Text>
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
            <CheckCircle2 size={20} color="#0038A8" style={{ marginRight: 8 }} />
            <Text style={styles.selectionSummaryText}>
              {formatFullDate(selectedDate)} at {selectedTime}
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
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <CalendarCheck size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.confirmBtnText}>
            {isSubmitting ? 'Submitting...' : 'Confirm Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const NAVY = '#0038A8';
const BACKGROUND = '#F8FAFC';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: BACKGROUND 
  },
  
  // Header
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
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  backBtn: { 
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  content: { 
    padding: 20, 
    paddingBottom: 40 
  },

  // Summary card
  summaryCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryCategory: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0F172A', 
    marginBottom: 8 
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  summaryFacility: { 
    fontSize: 14, 
    color: '#64748B', 
    fontWeight: '500'
  },
  priorityPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Date strip
  dateStripWrapper: { 
    marginBottom: 8 
  },
  dateStrip: { 
    gap: 10, 
    paddingBottom: 4 
  },
  dateChip: {
    flexShrink: 0,
    width: 58,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateChipSelected: {
    backgroundColor: NAVY,
    borderColor: NAVY,
    shadowColor: NAVY,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  dateChipDisabled: { 
    backgroundColor: '#F8FAFC', 
    borderColor: '#F1F5F9' 
  },
  dateDayLabel: { 
    fontSize: 11, 
    color: '#64748B', 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  dateDayNumber: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1E293B', 
    marginTop: 2 
  },
  dateLabelSelected: { 
    color: WHITE 
  },
  todayDot: { 
    width: 5, 
    height: 5, 
    borderRadius: 3, 
    backgroundColor: NAVY, 
    marginTop: 6 
  },
  todayDotSelected: { 
    backgroundColor: WHITE 
  },
  noSlotMark: { 
    fontSize: 11, 
    color: '#CBD5E1', 
    marginTop: 2 
  },

  selectedDateText: {
    fontSize: 14, 
    fontWeight: '600', 
    color: '#64748B',
    marginBottom: 24,
    marginLeft: 2,
  },

  // Time grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  timeChip: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipSelected: { 
    backgroundColor: NAVY, 
    borderColor: NAVY,
    shadowColor: NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  timeChipText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#334155' 
  },
  timeChipTextSelected: { 
    color: WHITE 
  },

  // No slots
  noSlotsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: WHITE,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noSlotsText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#94A3B8',
    marginTop: 8,
  },
  noSlotsSubText: { 
    fontSize: 13, 
    color: '#CBD5E1', 
    marginTop: 4 
  },

  // Selection summary
  selectionSummary: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectionSummaryText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: NAVY 
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  confirmBtn: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: NAVY,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: NAVY,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmBtnDisabled: { 
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: { 
    color: WHITE, 
    fontWeight: '700', 
    fontSize: 16 
  },
});