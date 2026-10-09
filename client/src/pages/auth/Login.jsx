import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import BrandIcon from '../../components/ui/BrandIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { signIn, isAuthenticated, profile, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to appropriate dashboard
  if (!loading && isAuthenticated) {
    const target = profile?.role === 'admin' ? '/admin/dashboard' : '/owner/dashboard';
    return <Navigate to={target} replace />;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await signIn(email, password);
      const role = res?.user?.role || (email.toLowerCase().includes('admin') ? 'admin' : 'owner');
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/owner/dashboard');
      }
    } catch (err) {
      setError('Invalid email or password credentials');
    } finally {
      setSubmitting(false);
    }
  }



  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-3xl shadow-2xl shadow-black/60 p-7 sm:p-9 backdrop-blur-xl">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner mb-3">
            <BrandIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            SRIDEVI RESIDENCY
          </h2>
          <p className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-semibold font-['Inter']">
            Residency Management System
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} autoComplete="off">
          <div className="form-control">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
              autoComplete="new-email"
            />
            <label>
              {'Email Address'.split('').map((char, index) => (
                <span key={index} style={{ transitionDelay: `${index * 45}ms` }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </label>
          </div>

          <div className="form-control">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
              autoComplete="new-password"
            />
            <label>
              {'Password'.split('').map((char, index) => (
                <span key={index} style={{ transitionDelay: `${index * 45}ms` }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold font-['Inter'] rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
          >
            <span>{submitting ? 'Signing In...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
