import React, { useState, useEffect } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import { useIndianClock } from '../../hooks/useIndianClock';
import { formatINR } from '../../utils/currencyUtils';
import bookingService from '../../services/bookingService';
import Card from '../../components/ui/Card';
import { Layers, BedDouble, Tags, Users, ShieldCheck, TrendingUp, Hotel, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const { floors, categories } = useResidency();
  const { timeString, dateFull, timeZoneAbbr } = useIndianClock();
  const [stats, setStats] = useState({ today_check_ins: 0, today_check_outs: 0, today_revenue: 0 });

  useEffect(() => {
    bookingService.getTodayStats().then((data) => {
      if (data) setStats(data);
    }).catch(() => {});
  }, []);

  const allRooms = floors.flatMap((f) => f.rooms || []);
  const totalRooms = allRooms.length;
  const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = allRooms.filter((r) => r.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Header Banner with Rich Gradient */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-indigo-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xs">
              System Administration
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans']">
            Admin Control Center
          </h2>
          <p className="text-xs text-indigo-200 mt-1 font-medium font-['Inter']">
            Manage residency floors, room categories, pricing rules, and system policies
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl shadow-xs relative z-10">
          <div>
            <p className="text-[11px] text-indigo-200 font-semibold">{dateFull}</p>
            <p className="text-base font-black font-['JetBrains_Mono'] text-white">{timeString}</p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black font-mono shadow-2xs">
            {timeZoneAbbr}
          </span>
        </div>
      </div>

      {/* Admin Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-blue-100/90 relative overflow-hidden group">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider font-black text-blue-950/70 font-['Inter']">Configured Floors</span>
            <p className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans'] text-blue-950 mt-1">{floors.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/40 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-purple-100/90 relative overflow-hidden group">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider font-black text-purple-950/70 font-['Inter']">Total Rooms</span>
            <p className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans'] text-purple-950 mt-1">{totalRooms}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-amber-100/90 relative overflow-hidden group">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider font-black text-amber-950/70 font-['Inter']">Room Categories</span>
            <p className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans'] text-amber-950 mt-1">{categories.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
            <Tags className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-emerald-100/90 relative overflow-hidden group">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider font-black text-emerald-950/70 font-['Inter']">Today Revenue</span>
            <p className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans'] text-emerald-700 mt-1">{formatINR(stats.today_revenue)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Admin Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <Link to="/admin/floors" className="block group">
          <div className="bg-white rounded-2xl p-6 shadow-xs hover-lift border border-slate-200/90 h-full space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-all">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between font-['Plus_Jakarta_Sans']">
                Floor Management
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-['Inter'] font-medium">Add, reorder, or rename residency floors and inspect occupancy levels.</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/rooms" className="block group">
          <div className="bg-white rounded-2xl p-6 shadow-xs hover-lift border border-slate-200/90 h-full space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-110 transition-all">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center justify-between font-['Plus_Jakarta_Sans']">
                Room Inventory
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-['Inter'] font-medium">Add rooms, assign floor & category, adjust capacities, and toggle maintenance status.</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/categories" className="block group">
          <div className="bg-white rounded-2xl p-6 shadow-xs hover-lift border border-slate-200/90 h-full space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-all">
              <Tags className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors flex items-center justify-between font-['Plus_Jakarta_Sans']">
                Room Categories & Pricing
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-['Inter'] font-medium">Configure 24-hour tariff rates, person limits, and amenities checklist.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;

