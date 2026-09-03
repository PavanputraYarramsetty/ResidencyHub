import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import { Shield, Building2, DoorOpen, Tags, UserCog, ArrowRight, Hotel } from 'lucide-react';

const adminCards = [
  {
    to: '/admin/floors',
    icon: Building2,
    label: 'Building Levels',
    desc: 'Configure building floors, floor numbers & unit grouping',
    countKey: 'floors',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    to: '/admin/rooms',
    icon: DoorOpen,
    label: 'Room Inventory',
    desc: 'Assign rooms to floors, configure statuses & capacity',
    countKey: 'rooms',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    to: '/admin/categories',
    icon: Tags,
    label: 'Tariff & Categories',
    desc: 'AC / Non-AC, Deluxe Suites & 24h pricing slabs',
    countKey: 'categories',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    to: '/admin/accounts',
    icon: UserCog,
    label: 'Staff Logins',
    desc: 'Owner accounts, front-desk staff & RBAC permissions',
    countKey: null,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

export default function AdminDashboard() {
  const { floors, categories } = useResidency();

  const totalRooms = floors.reduce((sum, f) => sum + (f.stats?.totalRooms || (f.rooms?.length || 0)), 0);
  const counts = {
    floors: floors.length,
    rooms: totalRooms,
    categories: categories.length,
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-amber-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Residency Configuration & Controls
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage physical architecture, room inventory, pricing categories, and staff security
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Hotel className="w-4 h-4 text-amber-500" />
          <span>Switch to Front Desk View</span>
        </Link>
      </div>

      {/* Property Architecture Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-luxury-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-4">
          Residency Hardware Footprint
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{counts.floors}</p>
              <p className="text-xs font-bold text-indigo-700 uppercase">Building Levels</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700 font-bold">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{counts.rooms}</p>
              <p className="text-xs font-bold text-amber-700 uppercase">Total Rooms Configured</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              <Tags className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{counts.categories}</p>
              <p className="text-xs font-bold text-emerald-700 uppercase">Tariff Slabs & Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Administration Action Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
          Management Controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {adminCards.map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={card.to}
                className="group block bg-white rounded-2xl p-5 border border-slate-200 shadow-luxury-sm hover:shadow-luxury hover:border-slate-300 transition-all flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    {card.countKey && (
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                        {counts[card.countKey]} Units
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                    {card.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-amber-600 transition-colors">
                  <span>Configure Settings</span>
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
