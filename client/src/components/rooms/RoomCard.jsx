import React from 'react';
import { formatINR } from '../../utils/currencyUtils';
import { Users, Wifi, Tv, Sparkles, AlertCircle, Clock } from 'lucide-react';

export function RoomCard({ room, onClick }) {
  const status = room.status || 'available';
  const category = room.room_categories || { name: 'Standard', base_price: 1500, max_occupancy: 2 };
  const activeBooking = room.active_booking;

  const statusConfig = {
    available: {
      cardClass: 'bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      label: 'AVAILABLE',
      topStrip: 'bg-emerald-500',
      actionText: 'Click to Book',
    },
    occupied: {
      cardClass: 'bg-white border-slate-200/90 hover:border-rose-400 hover:shadow-md hover:shadow-rose-500/10',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500 animate-pulse',
      label: 'OCCUPIED',
      topStrip: 'bg-rose-500',
      actionText: 'View / Check Out',
    },
    maintenance: {
      cardClass: 'bg-white border-slate-200/90 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      dotColor: 'bg-amber-500',
      label: 'MAINTENANCE',
      topStrip: 'bg-amber-500',
      actionText: 'Maintenance',
    },
    inactive: {
      cardClass: 'bg-slate-50 border-slate-200 opacity-60',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotColor: 'bg-slate-400',
      label: 'INACTIVE',
      topStrip: 'bg-slate-400',
      actionText: 'Inactive',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.available;

  return (
    <div
      onClick={() => onClick(room)}
      className={`relative flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none shadow-xs overflow-hidden ${currentStatus.cardClass}`}
    >
      {/* Top status indicator strip */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${currentStatus.topStrip}`} />

      {/* Top row: Room Number & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5 pt-1">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">ROOM</span>
          <h4 className="text-xl font-extrabold font-mono tracking-tight text-slate-900">{room.room_number}</h4>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider border shadow-2xs ${currentStatus.badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${currentStatus.dotColor}`} />
          <span>{currentStatus.label}</span>
        </div>
      </div>

      {/* Middle: Category & Max occupancy */}
      <div className="my-2 py-2.5 border-y border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-800">{category.name}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            <span className="flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Max {category.max_occupancy || 2}</span>
            </span>
            {category.name?.toLowerCase().includes('ac') && (
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">AC</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-extrabold text-slate-900 font-mono">{formatINR(category.base_price || room.base_price || 1500)}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">/ 24 Hours</p>
        </div>
      </div>

      {/* Bottom Info / Occupancy Preview */}
      {status === 'occupied' && activeBooking ? (
        <div className="mt-1 pt-1.5 text-xs text-slate-700 bg-rose-50/50 -mx-4 -mb-4 px-4 py-2 border-t border-rose-100/70">
          <div className="flex items-center justify-between text-[11px] truncate">
            <span className="truncate font-bold text-rose-900">{activeBooking.customers?.full_name || 'Guest'}</span>
            <span className="text-[10px] font-mono font-bold text-rose-700">
              {activeBooking.check_in ? new Date(activeBooking.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{currentStatus.actionText}</span>
          <span className="text-[11px] text-blue-600 font-bold">➔</span>
        </div>
      )}
    </div>
  );
}

export default RoomCard;

