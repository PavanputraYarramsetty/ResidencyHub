import { AnimatePresence } from 'framer-motion';
import RoomCard from './RoomCard';
import Loader from '../common/Loader';
import { BedDouble } from 'lucide-react';

export default function RoomGrid({ rooms, loading, onRoomClick }) {
  if (loading) {
    return <Loader type="room" count={10} />;
  }

  if (!rooms?.length) {
    return (
      <div className="text-center py-16 text-surface-400">
        <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No rooms on this floor</p>
        <p className="text-sm mt-1">Rooms can be added by an admin</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <AnimatePresence mode="popLayout">
        {rooms.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            onClick={() => onRoomClick(room)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
