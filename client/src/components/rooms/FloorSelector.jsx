import React from 'react';
import { Layers } from 'lucide-react';

export function FloorSelector({ floors, selectedFloorId, onSelectFloor }) {
  if (!floors || !floors.length) return null;

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectFloor('all')}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
          selectedFloorId === 'all'
            ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/25'
            : 'bg-[#161f33] border-[#24314c] text-gray-300 hover:bg-[#1e2942] hover:text-white'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>All Floors</span>
      </button>

      {floors.map((floor) => {
        const isSelected = selectedFloorId === floor.id;
        const total = floor.rooms?.length || 0;
        const available = floor.rooms?.filter((r) => r.status === 'available').length || 0;
        const occupied = floor.rooms?.filter((r) => r.status === 'occupied').length || 0;

        return (
          <button
            key={floor.id}
            onClick={() => onSelectFloor(floor.id)}
            className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'bg-[#161f33] border-[#24314c] text-gray-300 hover:bg-[#1e2942] hover:text-white'
            }`}
          >
            <div className="text-left">
              <span className="block">{floor.floor_name}</span>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                <span className={isSelected ? 'text-white/90' : 'text-emerald-400'}>{available} Avail</span>
                <span>•</span>
                <span className={isSelected ? 'text-white/80' : 'text-red-400'}>{occupied} Occ</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'}`}>
              {total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default FloorSelector;
