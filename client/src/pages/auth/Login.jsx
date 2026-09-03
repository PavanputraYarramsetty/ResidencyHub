import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter your email and password');

    try {
      setLoading(true);
      const res = await signIn(email, password);
      toast.success('Welcome back to Sridevi Residency!');
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail.includes('admin') || res?.user?.role === 'admin') {
        navigate('/admin/edit-structure');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillTestCredentials(type) {
    if (type === 'admin') {
      setEmail('admin@sridevi.com');
      setPassword('AdminPassword@123');
    } else {
      setEmail('owner@sridevi.com');
      setPassword('OwnerPassword@123');
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-space-md">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high/60 overflow-hidden flex flex-col p-space-xl gap-space-lg">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-space-xs">
          <div className="w-12 h-12 rounded-xl bg-primary-container border border-secondary flex items-center justify-center mb-1 shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[28px]">hotel</span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">Sridevi Residency</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Lodge Management & 24-Hour Billing Portal
          </p>
        </div>

        {/* Test Credentials Reference Callout */}
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/60 flex flex-col gap-space-xs">
          <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">key</span>
            Authorized System Credentials
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs text-body-sm pt-1">
            <button
              type="button"
              onClick={() => fillTestCredentials('owner')}
              className="p-space-xs rounded-lg bg-surface-container-lowest hover:bg-surface-container border border-surface-container-high/60 text-left transition-colors cursor-pointer"
            >
              <div className="font-label-md text-label-md text-on-surface font-bold">Owner Access</div>
              <div className="text-[11px] text-on-surface-variant font-mono">owner@sridevi.com</div>
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('admin')}
              className="p-space-xs rounded-lg bg-surface-container-lowest hover:bg-surface-container border border-surface-container-high/60 text-left transition-colors cursor-pointer"
            >
              <div className="font-label-md text-label-md text-on-surface font-bold">Admin Access</div>
              <div className="text-[11px] text-on-surface-variant font-mono">admin@sridevi.com</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-space-xxs">
            <label className="font-label-md text-label-md text-on-surface font-medium">Account Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@sridevi.com"
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
            />
          </div>

          <div className="flex flex-col gap-space-xxs">
            <label className="font-label-md text-label-md text-on-surface font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-space-md pr-10 py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-space-sm rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-colors shadow-sm flex items-center justify-center gap-space-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Portal</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-1 border-t border-surface-container-high/40">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Private System — Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
