import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResidency } from '../../context/ResidencyContext';
import LiveClock from './LiveClock';
import { Hotel, LogOut, Shield, Menu, X } from 'lucide-react';

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
        <div className="flex items-center justify-between h-20">
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition-all flex-shrink-0">
                <Hotel className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-normal leading-tight">
                  SRIDEVI RESIDENCY
                </h1>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  Hotel & Lodge Management
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Live Clock + Property Status */}
          <div className="hidden md:flex items-center gap-5">
            <LiveClock />

            {/* Quick Occupancy Summary Pill */}
            {totalRooms > 0 && (
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {availableRooms} Available
                </span>
                <span className="text-slate-300 font-normal">|</span>
                <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  {occupiedRooms} Occupied
                </span>
              </div>
            )}
          </div>

          {/* Right: Role Switcher & User Profile */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to={isAdminArea ? '/' : '/admin'}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isAdminArea
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-900 text-amber-300 border border-slate-800 hover:bg-slate-800 shadow-sm'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{isAdminArea ? 'Owner Mode' : 'Admin Panel'}</span>
              </Link>
            )}

            {/* User Chip */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 font-extrabold text-xs flex items-center justify-center">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {profile?.full_name || 'Owner'}
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {profile?.role || 'owner'}
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={signOut}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
