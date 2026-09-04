import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import BrandIcon from '../../components/ui/BrandIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export function Login() {
  const [email, setEmail] = useState('owner@sridevi.com');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { signIn, loginAsDemo } = useAuth();
  const navigate = useNavigate();

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

  function handleQuickDemo(role) {
    loginAsDemo(role);
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/owner/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 backdrop-blur-xl">
        {/* Logo Header */}
        <div className="text-center mb-7">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 border border-blue-100 shadow-xs mb-3">
            <BrandIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">
            SRIDEVI RESIDENCY
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-['Inter']">Residency Management System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@sridevi.com or owner@sridevi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-['Inter'] rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Sign In to Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Switcher */}
        <div className="mt-7 pt-5 border-t border-slate-100">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center mb-3 font-['Inter']">
            Instant One-Click Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('owner')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs mb-0.5 font-['Inter']">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Owner Login</span>
              </div>
              <p className="text-[10px] text-slate-500 font-['Inter']">Front Desk & Bookings</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-200 text-left transition-all group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs mb-0.5 font-['Inter']">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </div>
              <p className="text-[10px] text-slate-500 font-['Inter']">Floors, Rooms & Settings</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
