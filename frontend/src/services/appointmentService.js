import { supabase } from '../lib/supabase';

/**
 * STAFF: Assign an appointment to an approved request.
 * Calls assign-appointment edge function.
 *
 * IMPORTANT: The request must already have status 'approved' before calling this.
 * The edge function checks for scheduling conflicts automatically.
 *
 * @param {string} request_id
 * @param {string} scheduled_date  - format: 'YYYY-MM-DD'
 * @param {string} scheduled_time  - format: 'HH:MM:SS' (e.g. '09:00:00')
 * @param {string} [staff_notes]
 */
export const assignAppointment = async ({ request_id, scheduled_date, scheduled_time, staff_notes }) => {
  const { data, error } = await supabase.functions.invoke('assign-appointment', {
    body: { request_id, scheduled_date, scheduled_time, staff_notes },
  });
  return { data, error };
};

/**
 * STAFF: Update a service schedule slot (open/close, change hours).
 * Calls update-schedule edge function.
 * Used by the Slots tab in AdminDashboardScreen.
 *
 * @param {number} schedule_id
 * @param {boolean} is_open
 * @param {string} [start_time]  - format: 'HH:MM:SS'
 * @param {string} [end_time]    - format: 'HH:MM:SS'
 */
export const updateSchedule = async ({ schedule_id, is_open, start_time, end_time }) => {
  const { data, error } = await supabase.functions.invoke('update-schedule', {
    body: { schedule_id, is_open, start_time, end_time },
  });
  return { data, error };
};

/**
 * RESIDENT/STAFF: Get all service schedules.
 * Used by BookAppointmentScreen to show available dates/times.
 * Direct DB query — no edge function needed.
 */
export const getServiceSchedules = async () => {
  const { data, error } = await supabase
    .from('service_schedules')
    .select('*')
    .order('day_of_week', { ascending: true });
  return { data, error };
};

/**
 * RESIDENT: Get available appointment slots for a given date.
 * Returns appointments already booked so the UI can mark them unavailable.
 *
 * @param {string} date - format: 'YYYY-MM-DD'
 */
export const getBookedSlots = async (date) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('scheduled_time')
    .eq('scheduled_date', date);
  return { data, error };
};