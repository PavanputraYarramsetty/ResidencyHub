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
  TrendingUp, LogIn, LogOut, ArrowRight
} from 'lucide-react';

const navCards = [
  { to: '/rooms', icon: BedDouble, label: 'Rooms', desc: 'Manage room bookings & status', gradient: 'from-blue-500 to-blue-600' },
  { to: '/customers', icon: Users, label: 'Customers', desc: 'Customer records & history', gradient: 'from-purple-500 to-purple-600' },
  { to: '/revenue', icon: IndianRupee, label: 'Revenue', desc: 'Revenue analytics & reports', gradient: 'from-emerald-500 to-emerald-600' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics', desc: 'Booking logs & data export', gradient: 'from-amber-500 to-amber-600' },
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
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  // Compute room totals from floors
  const totalRooms = floors.reduce((sum, f) => sum + (f.stats?.totalRooms || 0), 0);
  const occupiedRooms = floors.reduce((sum, f) => sum + (f.stats?.occupiedRooms || 0), 0);
  const availableRooms = floors.reduce((sum, f) => sum + (f.stats?.availableRooms || 0), 0);

  const statCards = [
    { icon: BedDouble, label: 'Occupied', value: occupiedRooms, sub: `of ${totalRooms} rooms`, color: 'text-room-occupied', bg: 'bg-room-occupied/10' },
    { icon: BedDouble, label: 'Available', value: availableRooms, sub: `of ${totalRooms} rooms`, color: 'text-room-available', bg: 'bg-room-available/10' },
    { icon: LogIn, label: "Today's Check-ins", value: stats?.today_check_ins ?? '—', sub: 'arrivals today', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: LogOut, label: "Today's Check-outs", value: stats?.today_check_outs ?? '—', sub: 'departures today', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: TrendingUp, label: "Today's Revenue", value: formatCurrency(stats?.today_revenue ?? 0), sub: 'earned today', color: 'text-emerald-600', bg: 'bg-emerald-50', isLarge: true },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header with clock */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-surface-900"
          >
            Welcome back, <span className="gradient-text">{profile?.full_name || 'Owner'}</span>
          </motion.h1>
          <p className="text-surface-500 mt-1">Here's what's happening at Sridevi Residency today</p>
        </div>
        <div className="lg:hidden">
          <LiveClock />
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl p-4 bg-white border border-surface-200 shadow-sm ${stat.isLarge ? 'col-span-2 md:col-span-1' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color} animate-count-up`}>
              {loadingStats ? <span className="skeleton inline-block h-8 w-16" /> : stat.value}
            </p>
            <p className="text-xs text-surface-400 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Navigation cards */}
      <div>
        <h2 className="text-lg font-bold text-surface-800 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navCards.map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Link
                to={card.to}
                className="group block rounded-2xl overflow-hidden bg-white border border-surface-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
                <div className="p-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                    {card.label}
                  </h3>
                  <p className="text-sm text-surface-500 mt-1">{card.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floor overview */}
      {floors.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-surface-800 mb-4">Floor Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {floors.map((floor, i) => {
              const { totalRooms: ft, occupiedRooms: fo, availableRooms: fa } = floor.stats || {};
              const pct = ft ? Math.round((fo / ft) * 100) : 0;
              return (
                <motion.div
                  key={floor.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="rounded-2xl p-4 bg-white border border-surface-200 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-surface-800">{floor.floor_name}</h3>
                    <span className="text-xs font-medium text-surface-400">{pct}% full</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.8 }}
                      className={`h-full rounded-full ${
                        pct > 80 ? 'bg-room-occupied' : pct > 50 ? 'bg-room-reserved' : 'bg-room-available'
                      }`}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-room-available" /> {fa} available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-room-occupied" /> {fo} occupied
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
