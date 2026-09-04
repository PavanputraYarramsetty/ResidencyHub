import { createContext, useContext, useState, useEffect } from 'react';

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
    const savedDemoRole = localStorage.getItem('demo_role') || 'owner';
    const demoProf = DEMO_PROFILES[savedDemoRole] || DEMO_PROFILES.owner;
    setUser({ id: demoProf.id, email: `${savedDemoRole}@sridevi.com` });
    setProfile(demoProf);
    setSession({ access_token: `mock-token-${savedDemoRole}`, user: demoProf });
    setLoading(false);
  }, []);

  async function signIn(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const role = cleanEmail.includes('admin') ? 'admin' : 'owner';
    return loginAsDemo(role);
  }

  function loginAsDemo(role = 'owner') {
    const demoProf = DEMO_PROFILES[role] || DEMO_PROFILES.owner;
    localStorage.setItem('demo_role', role);
    setUser({ id: demoProf.id, email: `${role}@sridevi.com` });
    setProfile(demoProf);
    setSession({ access_token: `mock-token-${role}`, user: demoProf });
    setLoading(false);
    return Promise.resolve({ user: demoProf });
  }

  async function signOut() {
    localStorage.removeItem('demo_role');
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
    isSupabaseConfigured: false,
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
