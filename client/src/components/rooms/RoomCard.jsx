import React from 'react';
import { formatINR } from '../../utils/currencyUtils';
import { Users, Wifi, Tv, Sparkles, AlertCircle, Clock } from 'lucide-react';

export function RoomCard({ room, onClick }) {
  const status = room.status || 'available';
  const category = room.room_categories || { name: 'Standard', base_price: 1500, max_occupancy: 2 };
  const activeBooking = room.active_booking;

  const statusConfig = {
    available: {
      cardClass: 'room-card-available',
      badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      label: 'AVAILABLE',
      actionText: 'Click to Book',
    },
    occupied: {
      cardClass: 'room-card-occupied',
      badgeClass: 'bg-red-950/80 text-red-400 border-red-500/30',
      dotColor: 'bg-red-500 animate-pulse',
      label: 'OCCUPIED',
      actionText: 'View / Check Out',
    },
    maintenance: {
      cardClass: 'room-card-maintenance',
      badgeClass: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
      label: 'MAINTENANCE',
      actionText: 'Maintenance',
    },
    inactive: {
      cardClass: 'room-card-inactive',
      badgeClass: 'bg-gray-900 text-gray-400 border-gray-700',
      dotColor: 'bg-gray-500',
      label: 'INACTIVE',
      actionText: 'Inactive',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.available;

  return (
    <div
      onClick={() => onClick(room)}
      className={`relative flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 select-none shadow-md ${currentStatus.cardClass}`}
    >
      {/* Top row: Room Number & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <span className="text-xs text-gray-400 font-mono tracking-wider">ROOM</span>
          <h4 className="text-xl font-bold font-mono tracking-tight text-white">{room.room_number}</h4>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider border ${currentStatus.badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${currentStatus.dotColor}`} />
          <span>{currentStatus.label}</span>
        </div>
      </div>

      {/* Middle: Category & Max occupancy */}
      <div className="my-2 py-2 border-y border-white/5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-200">{category.name}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Max {category.max_occupancy || 2}</span>
            </span>
            {category.name.toLowerCase().includes('ac') && (
              <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 text-[10px] font-medium">AC</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-gray-100">{formatINR(category.base_price || room.base_price || 1500)}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">/ 24 Hours</p>
        </div>
      </div>

      {/* Bottom Info / Occupancy Preview */}
      {status === 'occupied' && activeBooking ? (
        <div className="mt-1 pt-1.5 text-xs text-gray-300">
          <div className="flex items-center justify-between text-[11px] text-gray-400 truncate">
            <span className="truncate font-medium text-gray-200">{activeBooking.customers?.full_name || 'Guest'}</span>
            <span className="text-[10px] font-mono text-amber-400">
              {activeBooking.check_in ? new Date(activeBooking.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>{currentStatus.actionText}</span>
          <span className="text-[10px] text-blue-400">➔</span>
        </div>
      )}
    </div>
  );
}

export default RoomCard;
