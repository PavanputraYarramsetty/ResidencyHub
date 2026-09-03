import { useState } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import RoomCard from '../../components/owner/RoomCard';
import BookingForm from '../../components/owner/BookingForm';
import CheckInOutPanel from '../../components/owner/CheckInOutPanel';
import { formatCurrency } from '../../utils/dateFormat';

export default function RoomsPage() {
  const { floors, loading, refreshData } = useResidency();
  const [selectedFloorId, setSelectedFloorId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckInOut, setShowCheckInOut] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingRoom, setBookingRoom] = useState(null);

  // Compute all metrics
  const allRooms = floors.flatMap((f) =>
    (f.rooms || []).map((r) => ({ ...r, floor_name: f.floor_name, floor_id: f.id }))
  );

  const totalRooms = allRooms.length;
  const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length;
  const reservedRooms = allRooms.filter((r) => r.status === 'reserved').length;
  const availableRooms = Math.max(0, totalRooms - occupiedRooms - reservedRooms);

  const occupancyRatio = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

  // Handle room card click
  function handleRoomClick(room) {
    if (room.status === 'available') {
      setBookingRoom(room);
      setShowBookingForm(true);
    } else {
      setSelectedRoom(room);
      setShowCheckInOut(true);
    }
  }

  // Filter rooms
  const filteredFloors = floors.map((f) => {
    if (selectedFloorId !== 'all' && f.id !== selectedFloorId) return null;

    const filteredRooms = (f.rooms || []).filter((r) => {
      // Category filter
      if (selectedCategory !== 'all' && r.category_id !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = r.room_number?.toString().toLowerCase().includes(q);
        const guestMatch = r.active_booking?.customers?.full_name?.toLowerCase().includes(q);
        const phoneMatch = r.active_booking?.customers?.phone?.includes(q);
        if (!numMatch && !guestMatch && !phoneMatch) return false;
      }
      return true;
    });

    return { ...f, filteredRooms };
  }).filter(Boolean);

  // Extract unique categories across rooms for selector
  const categoriesMap = new Map();
  allRooms.forEach((r) => {
    if (r.room_categories) {
      categoriesMap.set(r.room_categories.id, r.room_categories.name);
    }
  });

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-lg px-space-lg">
      {/* Top Hero & Command Bar */}
      <div className="flex flex-col gap-space-md pt-space-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-base">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-md text-label-md text-secondary uppercase tracking-widest">
                Sridevi Residency Frontline
              </span>
              <span className="text-outline-variant font-label-md">•</span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Terminal #01 (Main Wing)
              </span>
            </div>
            <h1 className="font-display-sm text-display-sm text-on-surface tracking-tight">
              Room Status Grid & Real-Time Availability
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Live floor map, strict 24-hour tariff cycle tracking, instant walk-in registration
            </p>
          </div>

          {/* Live Quick Stats Counter Tiles */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60">
              <div className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">Available</span>
                <span className="font-tabular-numeric text-tabular-numeric text-on-surface">{availableRooms} Rooms</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60">
              <div className="w-2.5 h-2.5 rounded-full bg-error" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">Occupied</span>
                <span className="font-tabular-numeric text-tabular-numeric text-on-surface">{occupiedRooms} Rooms</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">Turnover</span>
                <span className="font-tabular-numeric text-tabular-numeric text-on-surface">{reservedRooms} Pending</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm px-space-md py-space-sm bg-primary-container text-on-primary rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-[20px] text-secondary-fixed">payments</span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-primary-container uppercase">Live System Capacity</span>
                <span className="font-tabular-numeric text-tabular-numeric text-on-primary font-bold">
                  {occupancyRatio}% Occupied
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Action Belt */}
        <div className="p-space-sm bg-surface-container-lowest rounded-xl shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-sm border border-surface-container-high/60">
          <div className="flex flex-wrap items-center gap-space-xs">
            {/* Floor Tabs */}
            <div className="inline-flex bg-surface-container-low p-space-xxs rounded-lg">
              <button
                onClick={() => setSelectedFloorId('all')}
                className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-colors ${
                  selectedFloorId === 'all'
                    ? 'bg-primary-container text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                All Floors ({totalRooms})
              </button>
              {floors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFloorId(f.id)}
                  className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-colors ${
                    selectedFloorId === f.id
                      ? 'bg-primary-container text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  {f.floor_name} ({(f.rooms || []).length})
                </button>
              ))}
            </div>

            {/* Room Tier Selector */}
            <div className="relative inline-block">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-surface-container-low text-on-surface font-label-md text-label-md pl-space-md pr-space-xl py-space-xs rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="all">Category: All Tariffs</option>
                {Array.from(categoriesMap.entries()).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant pointer-events-none absolute right-space-sm top-1/2 -translate-y-1/2">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-space-sm top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Room # or Guest Name..."
                className="w-full pl-8 pr-space-md py-space-xs text-body-sm font-body-sm bg-surface-container-low text-on-surface rounded-lg placeholder:text-on-surface-variant focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setBookingRoom(null);
                setShowBookingForm(true);
              }}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:bg-on-secondary-container transition-colors shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Add Walk-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Visual Bar: Occupancy Timeline Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 flex items-center justify-between col-span-1 lg:col-span-3">
          <div className="flex flex-col gap-space-xxs w-full max-w-2xl">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">
              Current Cycle Occupancy Ratio
            </span>
            <div className="flex items-baseline gap-space-sm">
              <span className="font-display-sm text-display-sm text-on-surface">
                {occupancyRatio}%
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                ({occupiedRooms} Occupied / {availableRooms} Open)
              </span>
            </div>
            <div className="w-full bg-surface-container-low rounded-full h-2.5 overflow-hidden flex mt-space-xs">
              <div
                className="bg-error h-full transition-all duration-500"
                style={{ width: `${totalRooms ? (occupiedRooms / totalRooms) * 100 : 0}%` }}
                title={`Occupied (${occupiedRooms})`}
              />
              <div
                className="bg-secondary h-full transition-all duration-500"
                style={{ width: `${totalRooms ? (reservedRooms / totalRooms) * 100 : 0}%` }}
                title={`Turnover (${reservedRooms})`}
              />
              <div
                className="bg-on-tertiary-container h-full transition-all duration-500"
                style={{ width: `${totalRooms ? (availableRooms / totalRooms) * 100 : 100}%` }}
                title={`Vacant (${availableRooms})`}
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-space-lg ml-4">
            <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface">
              <span className="w-2.5 h-2.5 rounded-sm bg-on-tertiary-container inline-block" />
              {availableRooms} Clean
            </div>
            <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface">
              <span className="w-2.5 h-2.5 rounded-sm bg-error inline-block" />
              {occupiedRooms} Active
            </div>
            <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface">
              <span className="w-2.5 h-2.5 rounded-sm bg-secondary inline-block" />
              {reservedRooms} Turnover
            </div>
          </div>
        </div>

        {/* Mini Tariff Summary Tile */}
        <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">
              Standard Policy
            </span>
            <span className="px-space-xs py-0.5 rounded text-label-md font-label-md bg-surface-container-high text-on-surface">
              24h System
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
            Checkout calculated exactly 24 hours from check-in timestamp.
          </p>
          <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md mt-space-sm">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Grace period: 30 mins</span>
          </div>
        </div>
      </div>

      {/* Room Grids Grouped by Floor */}
      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-surface-container-high border-t-secondary rounded-full animate-spin" />
        </div>
      ) : (
        filteredFloors.map((floor) => {
          if (!floor) return null;
          const rooms = floor.filteredRooms || [];
          const fAvailable = rooms.filter((r) => r.status === 'available').length;
          const fOccupied = rooms.filter((r) => r.status === 'occupied').length;

          return (
            <div key={floor.id} className="flex flex-col gap-space-sm pt-space-sm">
              <div className="flex items-center justify-between px-space-xs">
                <div className="flex items-center gap-space-sm">
                  <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center font-headline-sm text-headline-sm text-on-surface font-bold">
                    {floor.floor_number ?? floor.floor_name?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                      {floor.floor_name}
                    </h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {rooms.length} Rooms • Main Corridor Access
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-label-md px-space-sm py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                    {fAvailable} Available
                  </span>
                  <span className="font-label-md text-label-md px-space-sm py-0.5 rounded-full bg-error-container text-on-error-container">
                    {fOccupied} Occupied
                  </span>
                </div>
              </div>

              {/* Grid of Rooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-space-md">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onClick={() => handleRoomClick(room)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Operational Activity & Handover Audit Strip */}
      <div className="mt-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <div className="p-space-sm rounded-lg bg-surface-container-high text-on-surface">
            <span className="material-symbols-outlined text-[24px]">sync_alt</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
              Front Desk Shift Notes & Handover
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Shift Duty: Active Receptionist • 24h Ledger Protocol Enforced
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm w-full md:w-auto">
          <button
            onClick={() => window.print()}
            className="px-space-md py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-space-xxs transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Daily Sheet</span>
          </button>
        </div>
      </div>

      {/* Check-In / Check-Out Modal */}
      {showCheckInOut && selectedRoom && (
        <CheckInOutPanel
          isOpen={showCheckInOut}
          onClose={() => {
            setShowCheckInOut(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          onSuccess={() => {
            refreshData();
            setShowCheckInOut(false);
            setSelectedRoom(null);
          }}
        />
      )}

      {/* Instant Walk-In Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          isOpen={showBookingForm}
          onClose={() => {
            setShowBookingForm(false);
            setBookingRoom(null);
          }}
          preselectedRoomId={bookingRoom?.id}
          onSuccess={() => {
            refreshData();
            setShowBookingForm(false);
            setBookingRoom(null);
          }}
        />
      )}
    </div>
  );
}
