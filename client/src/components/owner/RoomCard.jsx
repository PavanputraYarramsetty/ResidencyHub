import { motion } from 'framer-motion';
import { BedDouble, Wind, Users, ArrowUpRight, LogOut, LogIn, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/dateFormat';

export default function RoomCard({ room, index, onClick }) {
  const category = room.room_categories || {};
  const status = room.status || 'available';
  const isAC = category.name?.toLowerCase().includes('ac') && !category.name?.toLowerCase().includes('non-ac');

  // Status configuration with luxury styling
  const statusDetails = {
    available: {
      cardClass: 'room-card-available',
      pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500 pulse-available',
      label: 'Available',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      btnText: 'Book Room',
      btnIcon: ArrowUpRight,
    },
    occupied: {
      cardClass: 'room-card-occupied',
      pillBg: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500 pulse-occupied',
      label: 'Occupied',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
      btnText: 'Check-Out / Details',
      btnIcon: LogOut,
    },
    reserved: {
      cardClass: 'room-card-reserved',
      pillBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
      label: 'Reserved',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      btnText: 'Check-In Guest',
      btnIcon: LogIn,
    },
  }[status] || {
    cardClass: 'bg-white border-slate-200',
    pillBg: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    label: status,
    btnBg: 'bg-slate-800 text-white',
    btnText: 'Manage Room',
    btnIcon: ArrowUpRight,
  };

  const BtnIcon = statusDetails.btnIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      onClick={onClick}
      className={`group relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer ${statusDetails.cardClass}`}
    >
      {/* Top Header: Room Number & Status Pill */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              ROOM
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {room.room_number}
            </span>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusDetails.pillBg}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusDetails.dotClass}`} />
            <span>{statusDetails.label}</span>
          </div>
        </div>

        {/* Category & Features */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
            {isAC ? (
              <Wind className="w-3.5 h-3.5 text-sky-600" />
            ) : (
              <BedDouble className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{category.name || 'Standard Unit'}</span>
          </span>

          {category.max_occupancy && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs">
              <Users className="w-3 h-3 text-slate-400" />
              <span>{category.max_occupancy}</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer: Tariff & Action Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            24-Hour Tariff
          </p>
          <p className="text-sm font-extrabold text-slate-900">
            {category.base_price ? formatCurrency(category.base_price) : '—'}
          </p>
        </div>

        <button
          type="button"
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm group-hover:scale-105 transition-transform ${statusDetails.btnBg}`}
        >
          <span>{statusDetails.btnText}</span>
          <BtnIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
