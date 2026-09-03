import { motion } from 'framer-motion';
import { BedDouble, User, Wifi, Wind } from 'lucide-react';

const statusConfig = {
  available: {
    bg: 'bg-room-available/10',
    border: 'border-room-available/30',
    ring: 'ring-room-available/20',
    dot: 'bg-room-available',
    text: 'text-room-available',
    label: 'Available',
    hoverBg: 'hover:bg-room-available/20',
    shadow: 'hover:shadow-room-available/20',
  },
  occupied: {
    bg: 'bg-room-occupied/10',
    border: 'border-room-occupied/30',
    ring: 'ring-room-occupied/20',
    dot: 'bg-room-occupied',
    text: 'text-room-occupied',
    label: 'Occupied',
    hoverBg: 'hover:bg-room-occupied/20',
    shadow: 'hover:shadow-room-occupied/20',
  },
  reserved: {
    bg: 'bg-room-reserved/10',
    border: 'border-room-reserved/30',
    ring: 'ring-room-reserved/20',
    dot: 'bg-room-reserved',
    text: 'text-room-reserved',
    label: 'Reserved',
    hoverBg: 'hover:bg-room-reserved/20',
    shadow: 'hover:shadow-room-reserved/20',
  },
  maintenance: {
    bg: 'bg-surface-100',
    border: 'border-surface-300',
    ring: 'ring-surface-200',
    dot: 'bg-room-maintenance',
    text: 'text-room-maintenance',
    label: 'Maintenance',
    hoverBg: 'hover:bg-surface-200',
    shadow: 'hover:shadow-surface-300/20',
  },
};

export default function RoomCard({ room, index, onClick }) {
  const config = statusConfig[room.status] || statusConfig.available;
  const category = room.room_categories || {};
  const isAC = category.name?.toLowerCase().includes('ac') && !category.name?.toLowerCase().includes('non-ac');

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`room-status-transition relative rounded-2xl p-4 border-2 text-center cursor-pointer
        ${config.bg} ${config.border} ${config.hoverBg} hover:shadow-lg ${config.shadow}
        transition-all duration-300 group`}
    >
      {/* Status dot with pulse */}
      <div className="absolute top-2.5 right-2.5">
        <span className={`block w-3 h-3 rounded-full ${config.dot}`}>
          {room.status === 'occupied' && (
            <span className={`absolute inset-0 rounded-full ${config.dot} animate-ping opacity-50`} />
          )}
        </span>
      </div>

      {/* Room number */}
      <div className={`text-2xl font-bold mb-1 ${config.text}`}>
        {room.room_number}
      </div>

      {/* Category badge */}
      <div className="flex items-center justify-center gap-1 mb-2">
        {isAC ? (
          <Wind className="w-3 h-3 text-blue-500" />
        ) : (
          <BedDouble className="w-3 h-3 text-surface-400" />
        )}
        <span className="text-xs font-medium text-surface-500 truncate max-w-[90px]">
          {category.name || 'Standard'}
        </span>
      </div>

      {/* Status label */}
      <div className={`text-xs font-semibold uppercase tracking-wider ${config.text}`}>
        {config.label}
      </div>

      {/* Price (shown on hover for available rooms) */}
      {room.status === 'available' && category.base_price && (
        <div className="mt-2 text-xs text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity">
          ₹{Number(category.base_price).toLocaleString()}/day
        </div>
      )}
    </motion.button>
  );
}
