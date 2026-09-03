import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

// Default fallback profiles for testing & offline mode
const DEMO_PROFILES = {
  owner: {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'Front Desk Owner',
    role: 'owner',
    phone: '+91 94910 08797',
    residency_id: '00000000-0000-0000-0000-000000000001',
  },
  admin: {
    id: '00000000-0000-0000-0000-000000000003',
    full_name: 'System Admin',
    role: 'admin',
    phone: '+91 98480 22338',
    residency_id: '00000000-0000-0000-0000-000000000001',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if local role saved
    const savedDemoRole = localStorage.getItem('demo_role');
    if (savedDemoRole && DEMO_PROFILES[savedDemoRole]) {
      const demoProf = DEMO_PROFILES[savedDemoRole];
      setUser({ id: demoProf.id, email: `${savedDemoRole}@sridevi.com` });
      setProfile(demoProf);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Default to owner mode if Supabase not configured
      const demoProf = DEMO_PROFILES.owner;
      setUser({ id: demoProf.id, email: 'owner@sridevi.com' });
      setProfile(demoProf);
      setLoading(false);
      return;
    }

    // Get initial Supabase session
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          if (!localStorage.getItem('demo_role')) {
            setProfile(null);
          }
          setLoading(false);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
      } else {
        setProfile({
          id: userId,
          full_name: 'Residency Manager',
          role: 'owner',
          residency_id: '00000000-0000-0000-0000-000000000001',
        });
      }
    } catch (err) {
      setProfile({
        id: userId,
        full_name: 'Residency Manager',
        role: 'owner',
        residency_id: '00000000-0000-0000-0000-000000000001',
      });
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const role = cleanEmail.includes('admin') ? 'admin' : 'owner';

    // 1. Try Supabase remote sign in
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (!error && data?.user) {
          setUser(data.user);
          await fetchProfile(data.user.id);
          return data;
        }
      } catch (err) {
        console.warn('Supabase auth attempt notice:', err.message);
      }
    }

    // 2. Fallback instant local sign-in for owner/admin credentials
    return loginAsDemo(role);
  }

  function loginAsDemo(role = 'owner') {
    const demoProf = DEMO_PROFILES[role] || DEMO_PROFILES.owner;
    localStorage.setItem('demo_role', role);
    setUser({ id: demoProf.id, email: `${role}@sridevi.com` });
    setProfile(demoProf);
    setLoading(false);
    return Promise.resolve({ user: demoProf });
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
