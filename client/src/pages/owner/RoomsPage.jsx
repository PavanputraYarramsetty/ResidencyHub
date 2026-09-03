import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import { useRoomsRealtime } from '../../hooks/useRoomsRealtime';
import RoomCard from '../../components/owner/RoomCard';
import BookingForm from '../../components/owner/BookingForm';
import CheckInOutPanel from '../../components/owner/CheckInOutPanel';
import Loader from '../../components/common/Loader';
import { BedDouble, Building2, Search, Filter, Sparkles } from 'lucide-react';

export default function RoomsPage() {
  const { floors, loading: floorsLoading, refreshFloors } = useResidency();
  const [selectedFloorId, setSelectedFloorId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCheckInOut, setShowCheckInOut] = useState(false);

  // Subscribe to real-time changes
  const targetFloorId = selectedFloorId === 'ALL' ? null : selectedFloorId;
  const { rooms: realtimeRooms, loading: roomsLoading, refetch: refetchRooms } = useRoomsRealtime(targetFloorId);

  // Collect all rooms across floors if 'ALL' is selected
  const allRooms = useMemo(() => {
    if (selectedFloorId !== 'ALL') {
      return realtimeRooms;
    }
    // Aggregate from floors
    const list = [];
    floors.forEach((f) => {
      (f.rooms || []).forEach((r) => {
        list.push({ ...r, floors: f });
      });
    });
    return list.length > 0 ? list : realtimeRooms;
  }, [selectedFloorId, realtimeRooms, floors]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return allRooms.filter((r) => {
      // Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const numMatch = r.room_number?.toLowerCase().includes(q);
        const catMatch = r.room_categories?.name?.toLowerCase().includes(q);
        if (!numMatch && !catMatch) return false;
      }
      return true;
    });
  }, [allRooms, statusFilter, searchQuery]);

  // Overall counts for quick filter chips
  const totalCount = allRooms.length;
  const availableCount = allRooms.filter((r) => r.status === 'available').length;
  const occupiedCount = allRooms.filter((r) => r.status === 'occupied').length;
  const reservedCount = allRooms.filter((r) => r.status === 'reserved').length;

  function handleRoomClick(room) {
    setSelectedRoom(room);
    if (room.status === 'available') {
      setShowBookingForm(true);
    } else {
      setShowCheckInOut(true);
    }
  }

  function handleSuccess() {
    refetchRooms();
    refreshFloors();
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner: Title & Real-time Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <BedDouble className="w-6 h-6" />
              </span>
              Room Management
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Real-time status map, 24-hour billing cycle, and guest check-in desk
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available ({availableCount})
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied ({occupiedCount})
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved ({reservedCount})
          </span>
        </div>
      </div>

      {/* Persistent Floor Selector Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* All Floors Button */}
          <button
            onClick={() => setSelectedFloorId('ALL')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedFloorId === 'ALL'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>All Levels</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              selectedFloorId === 'ALL' ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalCount}
            </span>
          </button>

          {/* Individual Floor Tabs */}
          {floors.map((floor) => {
            const isSelected = selectedFloorId === floor.id;
            const floorRooms = floor.rooms || [];
            const freeCount = floorRooms.filter((r) => r.status === 'available').length;

            return (
              <button
                key={floor.id}
                onClick={() => setSelectedFloorId(floor.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{floor.floor_name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {freeCount}/{floorRooms.length} Free
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Status' },
            { id: 'available', label: '🟢 Available' },
            { id: 'occupied', label: '🔴 Occupied' },
            { id: 'reserved', label: '🟡 Reserved' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Room Number Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room number or type..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Room Grid */}
      {roomsLoading && allRooms.length === 0 ? (
        <Loader type="room" count={12} />
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <BedDouble className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No rooms match your filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try selecting "All Status" or clear your search term to see all available units.
          </p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setSelectedFloorId('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {filteredRooms.map((room, index) => (
              <RoomCard
                key={room.id}
                room={room}
                index={index}
                onClick={() => handleRoomClick(room)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <BookingForm
        isOpen={showBookingForm}
        onClose={() => {
          setShowBookingForm(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onSuccess={handleSuccess}
      />

      <CheckInOutPanel
        isOpen={showCheckInOut}
        onClose={() => {
          setShowCheckInOut(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
