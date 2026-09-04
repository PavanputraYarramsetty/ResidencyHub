import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useIndianClock } from '../../hooks/useIndianClock';
import { useResidency } from '../../context/ResidencyContext';
import BrandIcon from '../ui/BrandIcon';

export function Navbar({ onToggleSidebar }) {
  const { profile, signOut, isAdmin } = useAuth();
  const { timeString, dateFull } = useIndianClock();
  const { refreshFloors } = useResidency();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/owner/rooms?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

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
      {/* Left: Mobile Toggle + Brand + Live Operations Clock */}
      <div className="flex items-center gap-3 sm:gap-4">
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
            <span className="text-[10px] text-slate-500 block font-['Inter'] leading-none mt-0.5">
              Residency Management System
            </span>
          </div>
        </div>

        {/* Live Operations & Indian Clock Chip */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase font-['Inter']">
            LIVE OPERATIONS
          </span>
          <span className="text-slate-300 text-xs">|</span>
          <span className="text-xs text-slate-700 font-medium font-['Inter']">{dateFull}</span>
          <span className="text-slate-300 text-xs">|</span>
          <span className="text-xs font-mono font-bold text-slate-900">{timeString}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
            IST
          </span>
        </div>
      </div>

      {/* Center: Global Quick Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm mx-4 hidden lg:block">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Quick search room, guest, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all shadow-xs"
          />
        </div>
      </form>

      {/* Right: Quick actions & User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
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
