import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import { useRoomsRealtime } from '../../hooks/useRoomsRealtime';
import FloorGrid from '../../components/owner/FloorGrid';
import RoomGrid from '../../components/owner/RoomGrid';
import BookingForm from '../../components/owner/BookingForm';
import CheckInOutPanel from '../../components/owner/CheckInOutPanel';
import { BedDouble, ArrowLeft } from 'lucide-react';

export default function RoomsPage() {
  const { floors, loading: floorsLoading, refreshFloors } = useResidency();
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCheckInOut, setShowCheckInOut] = useState(false);

  const { rooms, loading: roomsLoading, refetch: refetchRooms } = useRoomsRealtime(selectedFloor?.id);

  function handleRoomClick(room) {
    setSelectedRoom(room);
    if (room.status === 'available') {
      setShowBookingForm(true);
    } else if (room.status === 'occupied' || room.status === 'reserved') {
      setShowCheckInOut(true);
    }
  }

  function handleSuccess() {
    refetchRooms();
    refreshFloors();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedFloor && (
            <button
              onClick={() => setSelectedFloor(null)}
              className="p-2 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
              <BedDouble className="w-6 h-6 text-brand-600" />
              {selectedFloor ? selectedFloor.floor_name : 'Rooms'}
            </h1>
            <p className="text-sm text-surface-500">
              {selectedFloor
                ? `${rooms.length} rooms on this floor`
                : 'Select a floor to view rooms'
              }
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-room-available" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-room-occupied" /> Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-room-reserved" /> Reserved
          </span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!selectedFloor ? (
          <motion.div
            key="floors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FloorGrid
              floors={floors}
              selectedFloor={selectedFloor}
              onSelectFloor={setSelectedFloor}
              loading={floorsLoading}
            />
          </motion.div>
        ) : (
          <motion.div
            key="rooms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <RoomGrid
              rooms={rooms}
              loading={roomsLoading}
              onRoomClick={handleRoomClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Form Modal (green room) */}
      <BookingForm
        isOpen={showBookingForm}
        onClose={() => { setShowBookingForm(false); setSelectedRoom(null); }}
        room={selectedRoom}
        onSuccess={handleSuccess}
      />

      {/* Check-In/Out Panel (red/amber room) */}
      <CheckInOutPanel
        isOpen={showCheckInOut}
        onClose={() => { setShowCheckInOut(false); setSelectedRoom(null); }}
        room={selectedRoom}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
