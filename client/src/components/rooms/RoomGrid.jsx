import React from 'react';
import RoomCard from './RoomCard';

export function RoomGrid({ rooms, onRoomClick }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-800 bg-[#161f33]/40">
        <p className="text-gray-400 text-sm">No rooms found matching the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onClick={onRoomClick} />
      ))}
    </div>
  );
}

export default RoomGrid;
