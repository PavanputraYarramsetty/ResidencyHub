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
  const totalRooms = allRooms.length || 11;
  const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = allRooms.filter((r) => r.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold uppercase tracking-wider">
              System Administration
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-['Plus_Jakarta_Sans']">Admin Control Center</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage residency floors, room categories, pricing rules, and system policies</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">{dateFull}</p>
            <p className="text-base font-bold font-mono text-slate-800">{timeString}</p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono">
            {timeZoneAbbr}
          </span>
        </div>
      </div>

      {/* Admin Quick Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between border-blue-100 bg-gradient-to-br from-white to-blue-50/40">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Configured Floors</span>
            <p className="text-2xl font-extrabold font-mono text-blue-900 mt-1">{floors.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-100/80 text-blue-700">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="flex items-center justify-between border-purple-100 bg-gradient-to-br from-white to-purple-50/40">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Total Rooms</span>
            <p className="text-2xl font-extrabold font-mono text-purple-900 mt-1">{totalRooms}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-100/80 text-purple-700">
            <BedDouble className="w-5 h-5" />
          </div>
        </Card>

        <Card className="flex items-center justify-between border-amber-100 bg-gradient-to-br from-white to-amber-50/40">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Room Categories</span>
            <p className="text-2xl font-extrabold font-mono text-amber-900 mt-1">{categories.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-100/80 text-amber-700">
            <Tags className="w-5 h-5" />
          </div>
        </Card>

        <Card className="flex items-center justify-between border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Today Revenue</span>
            <p className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">{formatINR(stats.today_revenue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-100/80 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Admin Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/floors" className="block group">
          <Card hover className="h-full space-y-3 p-6 border-slate-200">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 w-fit group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                Floor Management
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">Add, reorder, or rename residency floors and inspect occupancy levels.</p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/rooms" className="block group">
          <Card hover className="h-full space-y-3 p-6 border-slate-200">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 w-fit group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center justify-between">
                Room Inventory
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">Add rooms, assign floor & category, adjust capacities, and toggle maintenance status.</p>
            </div>
          </Card>
        </Link>

        <Link to="/admin/categories" className="block group">
          <Card hover className="h-full space-y-3 p-6 border-slate-200">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 w-fit group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                Room Categories & Pricing
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-500 mt-1">Configure 24-hour tariff rates, person limits, and amenities checklist.</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;

