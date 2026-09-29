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
    <header className="sticky top-0 z-40 h-[68px] bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 lg:px-7 flex items-center justify-between shadow-xs transition-all">
      {/* Left: Mobile Toggle + Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 sm:min-w-[210px]">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all cursor-pointer shrink-0"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0">
            <BrandIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 uppercase font-['Plus_Jakarta_Sans'] leading-tight">
              SRIDEVI RESIDENCY
            </h1>
            <span className="text-[10px] text-slate-500 block font-['Inter'] leading-none mt-0.5 font-semibold tracking-wide">
              Residency Management System
            </span>
          </div>
        </div>
      </div>

      {/* Center: Centered Highlighted Clock & Date with Gradient Glow */}
      <div className="flex items-center justify-center flex-1 mx-1 sm:mx-4">
        <div className="flex items-center gap-2 sm:gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-3 sm:px-6 py-1.5 sm:py-2 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-950/10 text-white">
          {/* Date */}
          <div className="hidden md:flex items-center gap-2 text-xs text-indigo-200 font-semibold font-['Inter']">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{dateFull}</span>
          </div>

          <span className="hidden md:inline text-slate-700 font-extralight text-xs">|</span>

          {/* Highlighted Clock */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
            <span className="text-xs sm:text-base md:text-lg font-black font-['JetBrains_Mono'] tracking-tight text-white drop-shadow-sm">
              {timeString}
            </span>
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs tracking-widest uppercase">
              IST
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions & User profile */}
      <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0 sm:min-w-[210px] justify-end">
        {/* Sync Refresh */}
        <button
          type="button"
          onClick={() => refreshFloors()}
          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/90 hover:border-blue-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all cursor-pointer shadow-xs active:scale-95 group"
          title="Refresh Ledger & Rooms"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">sync</span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-1 sm:pl-2 border-l border-slate-200/70">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-blue-500/20">
            <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white font-black text-xs">
              {initials}
            </div>
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {profile?.full_name || 'Front Desk Owner'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">
                {isAdmin ? 'System Admin' : 'Active Shift'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 px-3 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
          title="Sign Out of System"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;

