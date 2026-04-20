import { supabase } from '../../lib/supabase';

/**
 * RESIDENT: Get all published announcements.
 * Direct DB query — RLS ensures only is_published=true rows are returned for residents.
 */
export const getAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, users(first_name, last_name)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * STAFF: Get all announcements including drafts.
 * Direct DB query — RLS allows staff to see all rows.
 */
export const getAllAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, users(first_name, last_name)')
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * STAFF: Create a new announcement (published or draft).
 * Calls manage-announcement edge function with action='create'.
 *
 * @param {string}  title
 * @param {string}  content
 * @param {string}  [category]
 * @param {boolean} [is_published=false]  - true to publish immediately, false saves as draft
 */
export const createAnnouncement = async ({ title, content, category, is_published = false }) => {
  const { data, error } = await supabase.functions.invoke('manage-announcement', {
    body: { action: 'create', title, content, category, is_published },
  });
  return { data, error };
};

/**
 * STAFF: Publish a draft announcement.
 * Calls manage-announcement edge function with action='publish'.
 *
 * @param {string} id - announcement UUID
 */
export const publishAnnouncement = async (id) => {
  const { data, error } = await supabase.functions.invoke('manage-announcement', {
    body: { action: 'publish', id },
  });
  return { data, error };
};

/**
 * STAFF: Unpublish (revert to draft) an announcement.
 * Calls manage-announcement edge function with action='unpublish'.
 *
 * @param {string} id - announcement UUID
 */
export const unpublishAnnouncement = async (id) => {
  const { data, error } = await supabase.functions.invoke('manage-announcement', {
    body: { action: 'unpublish', id },
  });
  return { data, error };
};

/**
 * STAFF: Delete an announcement permanently.
 * Calls manage-announcement edge function with action='delete'.
 *
 * @param {string} id - announcement UUID
 */
export const deleteAnnouncement = async (id) => {
  const { data, error } = await supabase.functions.invoke('manage-announcement', {
    body: { action: 'delete', id },
  });
  return { data, error };
};