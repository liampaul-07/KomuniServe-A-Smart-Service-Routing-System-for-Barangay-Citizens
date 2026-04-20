import { supabase } from '../lib/supabase';

/**
 * RESIDENT: Submit a new service request via the create-request edge function.
 *
 * Maps directly from what GuidedPathScreen / DirectAccessScreen produces:
 *   - category:        'Medical' | 'Documents' | 'Complaint'
 *   - service_requested: the specific subType string (e.g. 'Physical', 'Clearance')
 *   - description:     free text from COMPLAINT_INPUT step
 *   - intake_answers:  the full selections object from GuidedPathScreen
 *   - attachment_urls: array of Supabase Storage URLs (optional)
 *
 * The edge function calls get_service_assessment RPC to derive priority automatically.
 */
export const submitRequest = async ({
  category,
  service_requested,
  description,
  intake_answers,
  attachment_urls,
}) => {
  const { data, error } = await supabase.functions.invoke('create-request', {
    body: { category, service_requested, description, intake_answers, attachment_urls },
  });
  return { data, error };
};

/**
 * RESIDENT: Fetch their own requests with appointment data.
 * Direct DB query — no edge function needed (RLS filters to current user).
 */
export const getMyRequests = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      appointments (
        id,
        scheduled_date,
        scheduled_time,
        staff_notes
      )
    `)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false });

  return { data, error };
};

/**
 * STAFF: Get all requests with resident info and appointments.
 * Calls get-requests-with-appointment edge function.
 * Supports optional filters: status, priority, category.
 *
 * NOTE: The edge function reads query params from the URL.
 * supabase.functions.invoke passes body as POST, so we append
 * params via a custom header that the function reads.
 * Alternatively, use supabase.from() directly as shown below
 * since the edge function duplicates what we can do in the client.
 */
export const getAllRequests = async (filters = {}) => {
  // Direct query mirrors exactly what the edge function does
  let query = supabase
    .from('requests')
    .select(`
      *,
      users (
        first_name,
        last_name,
        email,
        phone
      ),
      appointments (*)
    `)
    .order('submitted_at', { ascending: false });

  if (filters.status)   query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.category) query = query.eq('category', filters.category);

  const { data, error } = await query;
  return { data, error };
};

/**
 * STAFF: Update a request's status.
 * Calls update-request-status edge function.
 * Valid statuses: 'approved' | 'rejected' | 'completed' | 'cancelled'
 *
 * NOTE: DB trigger auto-creates a notification for the resident on change.
 *
 * @param {string} request_id
 * @param {'approved'|'rejected'|'completed'|'cancelled'} status
 * @param {string} [decided_result] - optional staff note about the decision
 */
export const updateRequestStatus = async (request_id, status, decided_result) => {
  const { data, error } = await supabase.functions.invoke('update-request-status', {
    body: { request_id, status, decided_result },
  });
  return { data, error };
};