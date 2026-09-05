import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useIndianClock } from '../../hooks/useIndianClock';
import { useResidency } from '../../context/ResidencyContext';
import BrandIcon from '../ui/BrandIcon';
import { Calendar, Clock } from 'lucide-react';

export function Navbar({ onToggleSidebar }) {
  const { profile, signOut, isAdmin } = useAuth();
  const { timeString, dateFull } = useIndianClock();
  const { refreshFloors } = useResidency();

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'FO';

  return (
    <header className="sticky top-0 z-40 h-[64px] bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle + Brand Logo */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-[200px]">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <BrandIcon className="w-8 h-8 drop-shadow-sm" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase font-['Plus_Jakarta_Sans'] leading-tight">
              SRIDEVI RESIDENCY
            </h1>
            <span className="text-[10px] text-slate-500 block font-['Inter'] leading-none mt-0.5 font-medium">
              Residency Management System
            </span>
          </div>
        </div>
      </div>

      {/* Center: Exactly Centered Highlighted Clock & Date */}
      <div className="flex items-center justify-center flex-1 mx-2 sm:mx-4">
        <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-slate-50 via-blue-50/50 to-slate-50 px-3.5 sm:px-5 py-1.5 rounded-xl border border-blue-200/70 shadow-xs">
          {/* Date */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 font-semibold font-['Inter']">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{dateFull}</span>
          </div>

          <span className="hidden md:inline text-slate-300 text-xs">|</span>

          {/* Highlighted Clock */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-base sm:text-lg font-extrabold font-['JetBrains_Mono'] tracking-tight text-slate-900 drop-shadow-2xs">
              {timeString}
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white shadow-2xs tracking-wider">
              IST
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions & User profile */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-[200px] justify-end">
        {/* Sync Refresh */}
        <button
          type="button"
          onClick={() => refreshFloors()}
          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          title="Refresh Ledger & Rooms"
        >
          <span className="material-symbols-outlined text-base">sync</span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {initials}
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {profile?.full_name || 'Front Desk Owner'}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              {isAdmin ? 'System Admin' : 'Active Shift'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium cursor-pointer shadow-xs"
          title="Sign Out of System"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;

