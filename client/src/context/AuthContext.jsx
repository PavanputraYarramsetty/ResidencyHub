import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

// Demo profiles for instant offline preview
const DEMO_PROFILES = {
  owner: {
    id: 'demo-owner-id',
    full_name: 'Sridevi Owner (Demo)',
    role: 'owner',
    phone: '+91 98765 43210',
    residency_id: '00000000-0000-0000-0000-000000000001',
  },
  admin: {
    id: 'demo-admin-id',
    full_name: 'System Admin (Demo)',
    role: 'admin',
    phone: '+91 91234 56789',
    residency_id: '00000000-0000-0000-0000-000000000001',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if demo user saved in localStorage
    const savedDemoRole = localStorage.getItem('demo_role');
    if (savedDemoRole && DEMO_PROFILES[savedDemoRole]) {
      const demoProf = DEMO_PROFILES[savedDemoRole];
      setUser({ id: demoProf.id, email: `${savedDemoRole}@sridevi.com` });
      setProfile(demoProf);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Not configured — default to demo mode automatically or finish loading
      setLoading(false);
      return;
    }

    // Get initial Supabase session safely
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Supabase auth session fetch warning:', err.message);
        setLoading(false);
      });

    // Listen for auth changes safely
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.warn('Failed to fetch user profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    if (!isSupabaseConfigured) {
      // Fallback demo sign-in
      const role = email.includes('admin') ? 'admin' : 'owner';
      return loginAsDemo(role);
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  function loginAsDemo(role = 'owner') {
    const demoProf = DEMO_PROFILES[role] || DEMO_PROFILES.owner;
    localStorage.setItem('demo_role', role);
    setUser({ id: demoProf.id, email: `${role}@sridevi.com` });
    setProfile(demoProf);
    setLoading(false);
    return Promise.resolve({ user: demoProf });
  }

  async function signUp(email, password, fullName, role = 'owner') {
    if (!isSupabaseConfigured) {
      return loginAsDemo(role);
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role,
        residency_id: '00000000-0000-0000-0000-000000000001',
      });
      if (profileError) console.error('Profile creation error:', profileError);
    }

    return data;
  }

  async function signOut() {
    localStorage.removeItem('demo_role');
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        /* ignore */
      }
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    loginAsDemo,
    isSupabaseConfigured,
    isAdmin: profile?.role === 'admin',
    isOwner: profile?.role === 'owner',
    isStaff: profile?.role === 'staff',
    isAuthenticated: !!user && !!profile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
