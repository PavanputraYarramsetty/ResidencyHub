import React from 'react';
import RoomCard from './RoomCard';

export function RoomGrid({ rooms, onRoomClick }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
        <p className="text-slate-500 text-xs font-medium font-['Inter']">No rooms found matching the selected criteria.</p>
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
