import { motion } from 'framer-motion';
import { Building2, Users, BedDouble } from 'lucide-react';

export default function FloorGrid({ floors, selectedFloor, onSelectFloor, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!floors?.length) {
    return (
      <div className="text-center py-12 text-surface-400">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No floors configured yet</p>
        <p className="text-sm mt-1">Ask an admin to set up floors and rooms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {floors.map((floor, index) => {
        const isSelected = selectedFloor?.id === floor.id;
        const { totalRooms, occupiedRooms, availableRooms } = floor.stats || {};
        const occupancyPercent = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        return (
          <motion.button
            key={floor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectFloor(floor)}
            className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 ${
              isSelected
                ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/30 ring-2 ring-brand-400'
                : 'bg-white text-surface-900 shadow-sm hover:shadow-lg border border-surface-200'
            }`}
          >
            {/* Decorative circle */}
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 ${
              isSelected ? 'bg-white' : 'bg-brand-500'
            }`} />

            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${
                  isSelected ? 'bg-white/20' : 'bg-brand-50'
                }`}>
                  <Building2 className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-brand-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{floor.floor_name}</h3>
                  <p className={`text-xs ${isSelected ? 'text-brand-100' : 'text-surface-400'}`}>
                    Floor {floor.floor_number}
                  </p>
                </div>
              </div>

              {/* Occupancy bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5" />
                    {totalRooms} rooms
                  </span>
                  <span>{occupancyPercent}% occupied</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  isSelected ? 'bg-white/20' : 'bg-surface-100'
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      occupancyPercent > 80
                        ? 'bg-red-400'
                        : occupancyPercent > 50
                          ? 'bg-gold-400'
                          : isSelected ? 'bg-white' : 'bg-room-available'
                    }`}
                  />
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 mt-3 text-xs font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-room-available" />
                  {availableRooms} free
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-room-occupied" />
                  {occupiedRooms} busy
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
