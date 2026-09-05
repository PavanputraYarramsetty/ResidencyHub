import React, { useState } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianTime } from '../../utils/dateUtils';
import NewBookingModal from '../../components/bookings/NewBookingModal';
import OccupiedRoomModal from '../../components/bookings/OccupiedRoomModal';
import CheckoutConfirmationDialog from '../../components/bookings/CheckoutConfirmationDialog';
import InvoiceReceiptModal from '../../components/bookings/InvoiceReceiptModal';
import bookingService from '../../services/bookingService';
import roomService from '../../services/roomService';

export function OwnerRooms() {
  const { floors, refreshFloors } = useResidency();
  const [selectedFloorId, setSelectedFloorId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isOccupiedModalOpen, setIsOccupiedModalOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [checkoutReceiptData, setCheckoutReceiptData] = useState(null);

  async function handleSetMaintenance(e, room) {
    if (e) e.stopPropagation();
    try {
      await roomService.updateRoom(room.id, { status: 'maintenance' });
      await refreshFloors();
    } catch (err) {
      console.error('Failed to update maintenance status', err);
    }
  }

  async function handleReleaseMaintenance(e, room) {
    if (e) e.stopPropagation();
    try {
      await roomService.updateRoom(room.id, { status: 'available' });
      await refreshFloors();
    } catch (err) {
      console.error('Failed to release room from maintenance', err);
    }
  }

  const allRooms = floors.flatMap((f) => f.rooms || []);
  const totalCount = allRooms.length;
  const availCount = allRooms.filter((r) => r.status === 'available').length;
  const occCount = allRooms.filter((r) => r.status === 'occupied').length;
  const maintCount = allRooms.filter((r) => r.status === 'maintenance').length;

  const todayRunRate = allRooms
    .filter((r) => r.status === 'occupied')
    .reduce((sum, r) => sum + Number(r.room_categories?.price_per_24_hours || r.room_categories?.base_price || 0), 0);
  const avgTariff =
    totalCount > 0
      ? Math.round(
          allRooms.reduce(
            (sum, r) => sum + Number(r.room_categories?.price_per_24_hours || r.room_categories?.base_price || 0),
            0
          ) / totalCount
        )
      : 0;

  const displayedFloors =
    selectedFloorId === 'all'
      ? floors
      : floors.filter((f) => String(f.id) === String(selectedFloorId) || String(f.floor_number) === String(selectedFloorId));

  const displayedRooms = displayedFloors
    .flatMap((f) => f.rooms || [])
    .filter((r) => {
      if (statusFilter === 'all') return true;
      return r.status === statusFilter;
    });

  function handleRoomClick(room) {
    setSelectedRoom(room);
    if (room.status === 'occupied') {
      setIsOccupiedModalOpen(true);
    } else {
      setIsBookingModalOpen(true);
    }
  }

  function handleQuickWalkIn() {
    const firstAvail = allRooms.find((r) => r.status === 'available') || allRooms[0];
    if (firstAvail) {
      setSelectedRoom(firstAvail);
      setIsBookingModalOpen(true);
    }
  }

  async function handleConfirmBooking(bookingData) {
    await bookingService.createBooking(bookingData);
    await refreshFloors();
  }

  async function handleConfirmCheckout(checkoutData) {
    await bookingService.checkOut(checkoutData.bookingId, checkoutData);
    await refreshFloors();
    setCheckoutReceiptData(checkoutData);
    setIsReceiptModalOpen(true);
  }

  return (
    <div className="flex flex-col w-full gap-5 sm:gap-6">
      {/* Top Operational Context & KPIs Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <span className="material-symbols-outlined text-2xl">bed</span>
          </div>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Room Management
            </h1>
            <p className="font-['Inter'] text-xs text-slate-500">
              Select a floor to view and manage room status in real-time
            </p>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-['Inter'] transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>All</span>
            <span className="bg-blue-700/60 text-white px-1.5 py-0.5 rounded text-[10px]">{totalCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('available')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-['Inter'] transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Available</span>
            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{availCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('occupied')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-['Inter'] transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'occupied'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Occupied</span>
            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px]">{occCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('maintenance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-['Inter'] transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'maintenance'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Maintenance</span>
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">{maintCount}</span>
          </button>
        </div>
      </div>

      {/* Operational Quick Metrics Bar (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase font-['Inter']">
              TOTAL INVENTORY
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-slate-900 mt-0.5 block">
              {totalCount}
            </span>
            <span className="text-xs text-slate-400 font-['Inter']">Across {floors.length} Levels</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-2xl">domain</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 block uppercase font-['Inter']">
              READY TO OCCUPY
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-emerald-600 mt-0.5 block">
              {availCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium font-['Inter']">
              {totalCount > 0 ? Math.round((availCount / totalCount) * 100) : 0}% Available
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-600 block uppercase font-['Inter']">
              LOCKED OCCUPIED
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-rose-600 mt-0.5 block">
              {String(occCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-rose-600 font-medium font-['Inter']">In Active Stay</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <span className="material-symbols-outlined text-2xl">person_pin_circle</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 block uppercase font-['Inter']">
              TODAY'S RUN RATE
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-slate-900 mt-0.5 block">
              {formatINR(todayRunRate)}
            </span>
            <span className="text-xs text-slate-400 font-['Inter']">Avg Tariff {formatINR(avgTariff)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
        </div>
      </div>

      {/* Floor Selector Navigation Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedFloorId('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-['Inter'] shadow-sm whitespace-nowrap transition-all cursor-pointer ${
            selectedFloorId === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90'
          }`}
        >
          <span className="material-symbols-outlined text-lg">layers</span>
          <span>All Floors</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-700/60 text-white text-[10px]">
            {totalCount}
          </span>
        </button>

        {floors.map((floor) => {
          const isSelected = String(selectedFloorId) === String(floor.id) || String(selectedFloorId) === String(floor.floor_number);
          const fRooms = floor.rooms || [];
          const fAvail = fRooms.filter((r) => r.status === 'available').length;
          const fOcc = fRooms.filter((r) => r.status === 'occupied').length;

          return (
            <button
              key={floor.id}
              type="button"
              onClick={() => setSelectedFloorId(floor.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium font-['Inter'] shadow-xs whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90'
              }`}
            >
              <span className="font-semibold">{floor.floor_name}</span>
              <span className="text-[10px] ml-1">
                <span className="text-emerald-600 font-bold">{fAvail} Avail</span> •{' '}
                <span className="text-rose-600 font-bold">{fOcc} Occ</span>
              </span>
              <span className="ml-1 w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                {fRooms.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Room Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {displayedRooms.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl">hotel</span>
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900 mb-1">
              {floors.length === 0 ? 'No Floors or Rooms Configured Yet' : 'No Rooms Found in Selected View'}
            </h3>
            <p className="font-['Inter'] text-xs text-slate-500 max-w-md mb-4">
              {floors.length === 0
                ? 'Your residency is ready for setup. Start by adding your floors and room inventory.'
                : 'Try selecting a different floor filter or changing status filters.'}
            </p>
          </div>
        ) : (
          displayedRooms.map((room) => {

          const isOccupied = room.status === 'occupied';
          const isMaintenance = room.status === 'maintenance';
          const categoryName = room.room_categories?.name || 'Standard';
          const basePrice = room.room_categories?.base_price || 1500;
          const activeBooking = room.active_booking;

          return (
            <div
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className={`relative rounded-2xl p-4 sm:p-5 bg-white border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden group cursor-pointer ${
                isOccupied
                  ? 'border-rose-200'
                  : isMaintenance
                  ? 'border-amber-200'
                  : 'border-slate-200/90 hover:border-blue-400'
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  isOccupied ? 'bg-rose-500' : isMaintenance ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />

              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block font-['Inter']">
                      ROOM
                    </span>
                    <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-slate-900 tracking-tight">
                      {room.room_number}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-['Inter'] ${
                      isOccupied
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isMaintenance
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOccupied ? 'bg-rose-500 animate-pulse' : isMaintenance ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    {isOccupied ? 'OCCUPIED' : isMaintenance ? 'MAINTENANCE' : 'AVAILABLE'}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-800 font-['Inter']">
                      {categoryName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-['Inter']">
                        <span className="material-symbols-outlined text-sm">group</span> Max{' '}
                        {room.room_categories?.max_occupancy || 2}
                      </span>
                      {categoryName.toLowerCase().includes('ac') && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-['Inter']">
                          AC
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-extrabold text-emerald-600 block">
                      {formatINR(basePrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-['Inter'] font-medium">
                      / 24 HOURS
                    </span>
                  </div>
                </div>

                {/* Amenity chips */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categoryName.toLowerCase().includes('ac') && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold font-['Inter']">
                      ✓ AC
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-['Inter']">
                    ✓ TV
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-['Inter']">
                    ✓ Attached Bath
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-['Inter']">
                    ✓ WiFi
                  </span>
                </div>

                {isOccupied && activeBooking && (
                  <div className="mt-3.5 p-2.5 rounded-xl bg-rose-50/70 flex items-center justify-between border border-rose-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-rose-200 flex items-center justify-center text-rose-800 font-bold text-xs shrink-0">
                        {(activeBooking.customers?.full_name || activeBooking.full_name || 'G')[0]}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 truncate block font-['Inter']">
                          {activeBooking.customers?.full_name && activeBooking.customers.full_name !== 'Guest'
                            ? activeBooking.customers.full_name
                            : (activeBooking.full_name || room.full_name || 'Guest')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-['Inter']">
                          In at {formatIndianTime(activeBooking.check_in || activeBooking.check_in_at || activeBooking.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      PAID
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 font-['Inter']">
                {isOccupied ? (
                  <button
                    type="button"
                    onClick={() => handleRoomClick(room)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-transparent transition-all text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span>View Stay / Checkout</span>
                    <span className="material-symbols-outlined text-base">meeting_room</span>
                  </button>
                ) : isMaintenance ? (
                  <button
                    type="button"
                    onClick={(e) => handleReleaseMaintenance(e, room)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Release Room / Ready to Occupy</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRoomClick(room)}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add_box</span>
                    <span>Check-In</span>
                  </button>
                )}
              </div>
            </div>
          );
        }))}

        {/* Express Front-Desk Dispatch Tile */}
        <div className="relative rounded-2xl p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/80 shadow-sm flex flex-col justify-between md:col-span-2 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 uppercase block font-['Inter']">
                EXPRESS FRONT-DESK DISPATCH
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900 mt-0.5">
                Quick Walk-In Registration
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-['Inter']">
                Assign room, generate guest folio, and accept token advance in under 45 seconds.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <span className="material-symbols-outlined text-3xl">add_business</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleQuickWalkIn}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-['Inter'] transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">hotel</span>
              <span>New Walk-in Check-in</span>
            </button>
            <button
              type="button"
              onClick={() => refreshFloors()}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-['Inter'] border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">cleaning_services</span>
              <span>Housekeeping Call List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        room={selectedRoom}
        onConfirmBooking={handleConfirmBooking}
      />

      <OccupiedRoomModal
        isOpen={isOccupiedModalOpen}
        onClose={() => setIsOccupiedModalOpen(false)}
        room={selectedRoom}
        onTriggerCheckout={(room, booking) => {
          setSelectedRoom(room);
          setIsOccupiedModalOpen(false);
          setIsCheckoutDialogOpen(true);
        }}
      />

      <CheckoutConfirmationDialog
        isOpen={isCheckoutDialogOpen}
        onClose={() => setIsCheckoutDialogOpen(false)}
        room={selectedRoom}
        onConfirmCheckout={handleConfirmCheckout}
      />

      <InvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setCheckoutReceiptData(null);
        }}
        invoiceData={checkoutReceiptData}
      />
    </div>
  );
}

export default OwnerRooms;
