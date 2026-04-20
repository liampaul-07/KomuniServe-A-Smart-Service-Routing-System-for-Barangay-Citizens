import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);       // 'resident' | 'barangay_staff'
  const [profile, setProfile] = useState(null); // full users row (name, email, etc.)
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return data;
  };

  useEffect(() => {
    // get existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user.id);
        setProfile(p);
        setRole(p?.role ?? null);
      }
      setLoading(false);
    });

    // listen for login/logout/token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          setProfile(p);
          setRole(p?.role ?? null);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign in with email + password.
   * Returns { data, error }.
   * The caller should navigate based on `role` from context after this resolves.
   *   role === 'barangay_staff'  → navigate to 'AdminDashboard'
   *   role === 'resident'        → navigate to 'Decision'
   */
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  /**
   * Sign up a new resident account.
   * Inserts into the users table after auth signup.
   */
  const signUp = async ({ email, password, firstName, lastName, phone }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { data: null, error };

    // insert profile row — role defaults to 'resident' in your DB
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phone ?? null,
      role: 'resident',
    });

    if (profileError) return { data: null, error: profileError };
    return { data, error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  /**
   * Save the Expo push token to the user's row.
   * Call this after registering for push notifications on login.
   */
  const registerPushToken = async (token) => {
    if (!user) return;
    await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      registerPushToken,
      isStaff: role === 'barangay_staff',
      isResident: role === 'resident',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};