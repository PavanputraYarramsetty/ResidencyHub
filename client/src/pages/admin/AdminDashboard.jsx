import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import { Shield, Building2, DoorOpen, Tags, UserCog, ArrowRight } from 'lucide-react';

const adminCards = [
  { to: '/admin/floors', icon: Building2, label: 'Manage Floors', desc: 'Add, rename, or remove floors', gradient: 'from-blue-500 to-blue-600', count: 'floors' },
  { to: '/admin/rooms', icon: DoorOpen, label: 'Manage Rooms', desc: 'Add or edit rooms on each floor', gradient: 'from-purple-500 to-purple-600', count: 'rooms' },
  { to: '/admin/categories', icon: Tags, label: 'Room Categories', desc: 'AC Single, Deluxe, etc.', gradient: 'from-emerald-500 to-emerald-600', count: 'categories' },
  { to: '/admin/accounts', icon: UserCog, label: 'Staff Accounts', desc: 'Manage owner/staff logins', gradient: 'from-amber-500 to-amber-600' },
];

export default function AdminDashboard() {
  const { floors, categories } = useResidency();

  const totalRooms = floors.reduce((sum, f) => sum + (f.stats?.totalRooms || 0), 0);
  const counts = {
    floors: floors.length,
    rooms: totalRooms,
    categories: categories.length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold text-surface-900 flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg">
            <Shield className="w-6 h-6 text-brand-950" />
          </div>
          Admin Panel
        </motion.h1>
        <p className="text-surface-500 mt-2">Configure floors, rooms, categories, and manage staff accounts</p>
      </div>

      {/* Admin action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminCards.map((card, i) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
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
                {card.count && (
                  <p className="text-2xl font-bold text-surface-800 mt-2">{counts[card.count] ?? 0}</p>
                )}
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Manage <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick overview */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-surface-800 mb-4">Property Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-blue-50">
            <p className="text-3xl font-bold text-blue-600">{counts.floors}</p>
            <p className="text-sm text-blue-500 font-medium">Floors</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-purple-50">
            <p className="text-3xl font-bold text-purple-600">{counts.rooms}</p>
            <p className="text-sm text-purple-500 font-medium">Rooms</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-emerald-50">
            <p className="text-3xl font-bold text-emerald-600">{counts.categories}</p>
            <p className="text-sm text-emerald-500 font-medium">Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
}
