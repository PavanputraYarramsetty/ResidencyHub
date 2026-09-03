import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useResidency } from '../../context/ResidencyContext';
import { bookingService } from '../../services/bookingService';
import LiveClock from '../../components/common/LiveClock';
import { formatCurrency } from '../../utils/dateFormat';
import {
  BedDouble, Users, IndianRupee, BarChart3,
  TrendingUp, LogIn, LogOut, ArrowRight, Shield, Sparkles, Building2
} from 'lucide-react';

const navigationCards = [
  {
    to: '/rooms',
    icon: BedDouble,
    title: 'Room Status Grid',
    desc: 'View levels, color codes & live occupancy map',
    badge: 'Real-time',
    color: 'from-blue-600 to-indigo-700',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  {
    to: '/customers',
    icon: Users,
    title: 'Customer Directory',
    desc: 'Guest records, ID proofs & visit history',
    badge: 'Autosuggest',
    color: 'from-amber-600 to-amber-700',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  {
    to: '/revenue',
    icon: IndianRupee,
    title: 'Revenue Analytics',
    desc: '24-hour slab billing & financial breakdown',
    badge: 'Derived View',
    color: 'from-emerald-600 to-teal-700',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    to: '/statistics',
    icon: BarChart3,
    title: 'Booking Audit Logs',
    desc: 'Filter stay duration, amounts & CSV export',
    badge: 'Permanent',
    color: 'from-purple-600 to-violet-700',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { floors } = useResidency();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const data = await bookingService.getTodayStats();
      setStats(data);
    } catch (err) {
      console.warn('Stats fetch warning — using local defaults');
    } finally {
      setLoadingStats(false);
    }
  }

  // Room calculations
  const totalRooms = floors.reduce((sum, f) => sum + (f.stats?.totalRooms || (f.rooms?.length || 0)), 0);
  const occupiedRooms = floors.reduce((sum, f) => sum + (f.stats?.occupiedRooms || (f.rooms?.filter(r => r.status === 'occupied').length || 0)), 0);
  const availableRooms = Math.max(0, totalRooms - occupiedRooms);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 p-6 sm:p-8 text-white shadow-luxury-lg border border-slate-800">
        {/* Decorative Gold Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Sridevi Residency Lodge Operations
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back, <span className="text-amber-400">{profile?.full_name || 'Front Desk'}</span>
            </h1>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Live residency metrics, room occupancy rates, and strict 24-hour billing cycle controls.
            </p>
          </div>

          {/* Quick Action Button & Clock */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3">
            <LiveClock />
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-xs shadow-gold hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              <BedDouble className="w-4 h-4" />
              <span>Open Room Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Primary Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Available Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-luxury-sm hover:shadow-luxury transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Available Units
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BedDouble className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {availableRooms}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              of {totalRooms} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Ready for immediate check-in</p>
          <div className="mt-3 h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalRooms ? (availableRooms / totalRooms) * 100 : 100}%` }}
            />
          </div>
        </motion.div>

        {/* Occupied Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white rounded-2xl p-5 border border-rose-100 shadow-luxury-sm hover:shadow-luxury transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Occupied Units
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {occupiedRooms}
            </span>
            <span className="text-xs font-bold text-rose-600">
              {occupancyRate}% Occupancy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Active stays currently in progress</p>
          <div className="mt-3 h-1.5 w-full bg-rose-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </motion.div>

        {/* Today's Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-luxury-sm hover:shadow-luxury transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Activity
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <LogIn className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-2xl font-black text-slate-900">
                {stats?.today_check_ins ?? 0}
              </span>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <LogIn className="w-3 h-3" /> Check-ins
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-2xl font-black text-slate-900">
                {stats?.today_check_outs ?? 0}
              </span>
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Check-outs
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2.5">Movements in the last 24 hours</p>
        </motion.div>

        {/* Today's Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-luxury-sm hover:shadow-luxury transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Revenue
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats?.today_revenue ?? 0)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Derived from completed checkouts</p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <span>24-Hour Slab Billing Enforced</span>
          </div>
        </motion.div>
      </div>

      {/* Floor Overview Progress Bars */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Floor-Wise Occupancy Health</h2>
              <p className="text-xs font-medium text-slate-500">Live capacity distribution by building level</p>
            </div>
          </div>

          <Link to="/rooms" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            <span>Manage All Floors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {floors.map((floor) => {
            const fRooms = floor.rooms || [];
            const fOccupied = fRooms.filter((r) => r.status === 'occupied').length;
            const fAvailable = fRooms.filter((r) => r.status === 'available').length;
            const fPct = fRooms.length > 0 ? Math.round((fOccupied / fRooms.length) * 100) : 0;

            return (
              <div key={floor.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{floor.floor_name}</h3>
                    <p className="text-xs text-slate-500">{fRooms.length} Total Units</p>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {fPct}% Full
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      fPct > 80 ? 'bg-rose-500' : fPct > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${fPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {fAvailable} Available
                  </span>
                  <span className="flex items-center gap-1 text-rose-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {fOccupied} Occupied
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">Module Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navigationCards.map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <Link
                to={card.to}
                className="group block bg-white rounded-2xl p-5 border border-slate-200 shadow-luxury-sm hover:shadow-luxury hover:border-slate-300 transition-all flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className={`p-3 rounded-2xl ${card.iconBg} ${card.iconColor} group-hover:scale-110 transition-transform`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
                  <span>Enter Module</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
