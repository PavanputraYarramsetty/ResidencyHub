import React from 'react';
import { Layers } from 'lucide-react';

export function FloorSelector({ floors, selectedFloorId, onSelectFloor }) {
  if (!floors || !floors.length) return null;

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectFloor('all')}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
          selectedFloorId === 'all'
            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
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
            className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="text-left">
              <span className="block">{floor.floor_name}</span>
              <div className="flex items-center gap-1.5 text-[10px] mt-0.5 font-medium">
                <span className={isSelected ? 'text-blue-100' : 'text-emerald-700'}>{available} Avail</span>
                <span className={isSelected ? 'text-blue-200' : 'text-slate-300'}>•</span>
                <span className={isSelected ? 'text-blue-100' : 'text-rose-700'}>{occupied} Occ</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default FloorSelector;

