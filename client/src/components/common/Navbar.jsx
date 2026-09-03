import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResidency } from '../../context/ResidencyContext';
import LiveClock from './LiveClock';
import { Hotel, LogOut, User, Shield, Menu, X } from 'lucide-react';

export default function Navbar({ mobileSidebarOpen, setMobileSidebarOpen }) {
  const { profile, signOut, isAdmin } = useAuth();
  const { floors } = useResidency();
  const location = useLocation();

  const isAdminArea = location.pathname.startsWith('/admin');

  // Calculate live occupancy summary
  const totalRooms = floors.reduce((sum, f) => sum + (f.stats?.totalRooms || (f.rooms?.length || 0)), 0);
  const occupiedRooms = floors.reduce((sum, f) => sum + (f.stats?.occupiedRooms || (f.rooms?.filter(r => r.status === 'occupied').length || 0)), 0);
  const availableRooms = Math.max(0, totalRooms - occupiedRooms);

  return (
    <header className="sticky top-0 z-40 w-full glass-header">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                <Hotel className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                    SRIDEVI RESIDENCY
                  </h1>
                </div>
                <p className="text-[10px] font-semibold tracking-wider text-amber-700 uppercase mt-0.5">
                  Lodge Management
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Live Clock + Property Status */}
          <div className="hidden md:flex items-center gap-4">
            <LiveClock />

            {/* Quick Occupancy Summary Pill */}
            {totalRooms > 0 && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong className="text-slate-900">{availableRooms}</strong> Available
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <strong className="text-slate-900">{occupiedRooms}</strong> Occupied
                </span>
              </div>
            )}
          </div>

          {/* Right: Role Switcher & User Profile */}
          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <Link
                to={isAdminArea ? '/' : '/admin'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isAdminArea
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-900 text-amber-300 border border-slate-800 hover:bg-slate-800 shadow-sm'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isAdminArea ? 'Owner Mode' : 'Admin Panel'}</span>
              </Link>
            )}

            {/* User Chip */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 font-bold text-xs flex items-center justify-center">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline max-w-[120px] truncate">
                {profile?.full_name || 'Owner'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-200 text-slate-700">
                {profile?.role || 'owner'}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={signOut}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
