import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password || !fullName) return toast.error('Please fill in all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    try {
      setLoading(true);
      await signUp(email, password, fullName);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
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
          <h1 className="font-display-sm text-display-sm text-on-surface">Create Staff Account</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Join Sridevi Residency management portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-space-xxs">
            <label className="font-label-md text-label-md text-on-surface font-medium">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Anand Kumar"
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
            />
          </div>

          <div className="flex flex-col gap-space-xxs">
            <label className="font-label-md text-label-md text-on-surface font-medium">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@sridevi.com"
              className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
            />
          </div>

          <div className="flex flex-col gap-space-xxs">
            <label className="font-label-md text-label-md text-on-surface font-medium">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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
                <span>Create Account</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-secondary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
