import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LiveClock from './LiveClock';
import { Hotel, LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const isAdminArea = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 glass-dark shadow-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg group-hover:shadow-gold-400/30 transition-shadow">
              <Hotel className="w-5 h-5 text-brand-950" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white leading-tight">Sridevi Residency</h1>
              <p className="text-xs text-surface-400 -mt-0.5">Management System</p>
            </div>
          </Link>

          {/* Live Clock */}
          <div className="hidden md:block">
            <LiveClock />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to={isAdminArea ? '/' : '/admin'}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gold-300 hover:bg-white/10 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{isAdminArea ? 'Owner View' : 'Admin'}</span>
              </Link>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
              <User className="w-4 h-4 text-surface-400" />
              <span className="text-sm text-surface-300 font-medium hidden sm:inline">
                {profile?.full_name || 'User'}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-gold-500/20 text-gold-400 font-semibold uppercase">
                {profile?.role}
              </span>
            </div>

            <button
              onClick={signOut}
              className="p-2 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
