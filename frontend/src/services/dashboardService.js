import { supabase } from '../../lib/supabase';

/**
 * STAFF: Get dashboard stats.
 * Calls get-dashboard-stats edge function, which calls the get_dashboard_stats RPC.
 * Returns counts by status, priority, category — used by AdminDashboardScreen header.
 */
export const getDashboardStats = async () => {
  const { data, error } = await supabase.functions.invoke('get-dashboard-stats');
  return { data, error };
};

/**
 * RESIDENT: Get a summary of their own requests grouped by status.
 * Direct DB query — used by the Decision screen to show pending/active request count.
 * Returns an object like: { pending: 2, approved: 1, completed: 3, rejected: 0, cancelled: 0 }
 */
export const getResidentSummary = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('requests')
    .select('status')
    .eq('user_id', user.id);

  if (error) return { data: null, error };

  const summary = {
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  };

  data.forEach(req => {
    if (summary[req.status] !== undefined) {
      summary[req.status]++;
    }
  });

  return { data: summary, error: null };
};