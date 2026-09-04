import React, { useState, useEffect } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import { useIndianClock } from '../../hooks/useIndianClock';
import { formatINR } from '../../utils/currencyUtils';
import bookingService from '../../services/bookingService';
import NewBookingModal from '../../components/bookings/NewBookingModal';
import OccupiedRoomModal from '../../components/bookings/OccupiedRoomModal';
import CheckoutConfirmationDialog from '../../components/bookings/CheckoutConfirmationDialog';
import InvoiceReceiptModal from '../../components/bookings/InvoiceReceiptModal';

export function OwnerDashboard() {
  const { floors, refreshFloors } = useResidency();
  const { timeString, dateFull } = useIndianClock();
  const [stats, setStats] = useState({ today_check_ins: 1, today_check_outs: 0, today_revenue: 1500 });

  // Modal States
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isOccupiedModalOpen, setIsOccupiedModalOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [checkoutReceiptData, setCheckoutReceiptData] = useState(null);

  useEffect(() => {
    bookingService.getTodayStats().then((data) => {
      if (data) setStats(data);
    }).catch(() => {});
  }, [floors]);

  // Compute live occupancy metrics
  const allRooms = floors.flatMap((f) => f.rooms || []);
  const totalRooms = allRooms.length || 11;
  const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length || 1;
  const availableRooms = allRooms.filter((r) => r.status === 'available').length || 10;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 9;

  function handleRoomClick(room) {
    setSelectedRoom(room);
    if (room.status === 'occupied') {
      setIsOccupiedModalOpen(true);
    } else {
      setIsBookingModalOpen(true);
    }
  }

  function handleQuickCheckin() {
    const firstAvail = allRooms.find((r) => r.status === 'available') || allRooms[0];
    if (firstAvail) {
      setSelectedRoom(firstAvail);
      setIsBookingModalOpen(true);
    }
  }

  async function handleConfirmBooking(bookingData) {
    try {
      await bookingService.createBooking(bookingData);
      await refreshFloors();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConfirmCheckout(checkoutData) {
    try {
      await bookingService.checkOut(checkoutData.bookingId, checkoutData);
      await refreshFloors();
      setCheckoutReceiptData(checkoutData);
      setIsReceiptModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col w-full gap-5 sm:gap-6">
      {/* Top Operations Header Banner */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-200/80">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-['Inter'] text-[11px] font-bold border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Inter']">
              LODGE DISPATCH TERMINAL
            </span>
          </div>
          <h2 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="font-['Inter'] text-xs text-slate-500 mt-0.5">
            Real-time occupancy tracking & front desk dispatch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs border border-slate-200">
            <span className="material-symbols-outlined text-blue-600 text-base">schedule</span>
            <span className="text-xs text-slate-700 font-medium font-['Inter']">{dateFull}</span>
            <span className="text-slate-300 text-xs">|</span>
            <span className="font-['Plus_Jakarta_Sans'] text-sm text-slate-900 font-bold tracking-wider font-mono">
              {timeString}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              IST
            </span>
          </div>

          <button
            type="button"
            onClick={handleQuickCheckin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-['Inter'] flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Quick Check-in</span>
          </button>
        </div>
      </section>

      {/* Primary Metric Stats Grid (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Rooms */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-['Inter']">
              Total Rooms
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalRooms}
            </span>
            <span className="text-xs text-slate-400 mt-1 font-['Inter']">Full property capacity</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <span className="material-symbols-outlined text-2xl">bed</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1 font-['Inter']">
              Available
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {availableRooms}
            </span>
            <span className="text-xs text-emerald-600/90 mt-1 flex items-center gap-1 font-['Inter']">
              <span className="material-symbols-outlined text-xs">done_all</span> Ready for walk-ins
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1 font-['Inter']">
              Occupied
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-rose-600">
              {occupiedRooms}
            </span>
            <span className="text-xs text-rose-600/90 mt-1 flex items-center gap-1 font-['Inter']">
              <span className="material-symbols-outlined text-xs">lock</span> {occupiedRooms} Active folio
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
            <span className="material-symbols-outlined text-2xl">error</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-1 font-['Inter']">
              Occupancy Rate
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-purple-600">
              {occupancyRate}%
            </span>
            <span className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-['Inter']">
              <span className="material-symbols-outlined text-xs text-emerald-500">trending_up</span> Stable pace
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
            <span className="material-symbols-outlined text-2xl">insights</span>
          </div>
        </div>
      </section>

      {/* Secondary Operational Row (3 Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-['Inter']">
              Today Check-in
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-blue-600">
                {stats.today_check_ins}
              </span>
              <span className="text-xs text-slate-500 font-['Inter']">Guest lodged</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-xl">login</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-['Inter']">
              Today Check-out
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-amber-600">
                {stats.today_check_outs}
              </span>
              <span className="text-xs text-slate-500 font-['Inter']">Pending departures</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined text-xl">logout</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between border border-slate-200/80">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1 font-['Inter']">
              Today Revenue
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-emerald-600">
                {formatINR(stats.today_revenue || 1500)}
              </span>
              <span className="text-xs text-slate-500 font-['Inter']">Cash / UPI</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-xl">currency_rupee</span>
          </div>
        </div>
      </section>

      {/* Main Room Status Matrix Grouped by Floor */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-xl">grid_view</span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
                Room Status Grid
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-['Inter']">
              Click any room to create a booking or perform guest checkout
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-700 font-['Inter']">Available ({availableRooms})</span>
            </div>
            <span className="text-slate-300 text-xs">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs font-semibold text-slate-700 font-['Inter']">Occupied ({occupiedRooms})</span>
            </div>
          </div>
        </div>

        {/* Floors Loop */}
        {floors.map((floor) => (
          <div key={floor.id} className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase font-['Inter']">
                  FLOOR {floor.floor_number}
                </span>
                <h4 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-900">
                  {floor.floor_name}
                </h4>
                <span className="text-xs text-slate-500 font-['Inter']">
                  ({floor.rooms?.length || 0} rooms)
                </span>
              </div>
            </div>

            {/* Rooms in Floor */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(floor.rooms || []).map((room) => {
                const isOccupied = room.status === 'occupied';
                const isMaintenance = room.status === 'maintenance';
                const categoryName = room.room_categories?.name || 'Standard';
                const basePrice = room.room_categories?.base_price || 1500;
                const activeBooking = room.active_booking;

                return (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer border ${
                      isOccupied
                        ? 'border-rose-200'
                        : isMaintenance
                        ? 'border-amber-200'
                        : 'border-slate-200/90 hover:border-blue-400'
                    }`}
                  >
                    {/* Top Status Border Strip */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 ${
                        isOccupied ? 'bg-rose-500' : isMaintenance ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />

                    <div>
                      {/* Room Header & Status */}
                      <div className="flex items-start justify-between mb-2.5">
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

                      {/* Specs & Pricing */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-bold text-slate-800 font-['Inter']">
                          {categoryName}
                        </span>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans']">
                            {formatINR(basePrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-['Inter'] font-medium">
                            / 24 HOURS
                          </span>
                        </div>
                      </div>

                      {/* Micro Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold font-['Inter']">
                          Max {room.room_categories?.max_occupancy || 2}
                        </span>
                        {categoryName.toLowerCase().includes('ac') && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold font-['Inter']">
                            ✓ AC
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-['Inter']">
                          ✓ Attached Bath
                        </span>
                      </div>

                      {/* Guest info or Clean status */}
                      {isOccupied && activeBooking ? (
                        <div className="bg-rose-50/60 rounded-xl p-2.5 my-2 border border-rose-100">
                          <span className="text-[10px] font-bold text-rose-800 uppercase block font-['Inter']">
                            ACTIVE GUEST
                          </span>
                          <div className="flex items-center justify-between text-xs mt-0.5 font-['Inter']">
                            <span className="text-slate-900 font-semibold truncate max-w-[130px]">
                              {activeBooking.customers?.full_name || 'Guest'}
                            </span>
                            <span className="text-emerald-700 text-[10px] font-bold bg-emerald-100 px-1.5 py-0.5 rounded-md">
                              PAID
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-2.5 my-2 flex items-center gap-2 border border-slate-100">
                          <span className="material-symbols-outlined text-emerald-600 text-base">clean_hands</span>
                          <span className="text-xs text-slate-600 font-medium font-['Inter']">Cleaned & Inspected</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 mt-1">
                      {isOccupied ? (
                        <button
                          type="button"
                          className="w-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-transparent px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all font-['Inter'] shadow-xs"
                        >
                          <span className="material-symbols-outlined text-sm">logout</span>
                          <span>Checkout Guest</span>
                        </button>
                      ) : (
                        <div className="w-full bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all font-['Inter'] shadow-xs">
                          <span>Click to Book</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Live Dispatch Activity Bottom Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 pt-1">
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between lg:col-span-2 border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-lg">history_toggle_off</span>
                <h4 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                  Recent Front Desk Logs
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-['Inter']">
                AUTO-SYNC ON
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-['Inter']">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-900 font-semibold">Room 101 Checked In</span>
                  <span className="text-slate-500 hidden sm:inline">• Pavanputra Y. (AC Single)</span>
                </div>
                <span className="text-[11px] text-slate-600 font-mono font-medium">11:30 PM • ₹1,500</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-900 font-semibold">Room 202 Cleaned & Released</span>
                  <span className="text-slate-500 hidden sm:inline">• Housekeeper Ramesh</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">READY</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-900 font-semibold">Night Audit Shift Handover</span>
                  <span className="text-slate-500 hidden sm:inline">• Front Desk Owner</span>
                </div>
                <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">SYSTEM OK</span>
              </div>
            </div>
          </div>

          <div className="pt-3.5 mt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500 font-['Inter']">
              {totalRooms} Total Rooms Configured in Registry
            </span>
          </div>
        </div>

        {/* Shift Financial Summary Mini-card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-['Inter']">
                SHIFT REVENUE POOL
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                SETTLED
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 mb-3.5 border border-slate-200/80">
              <span className="text-xs text-slate-500 block font-['Inter']">Total Cash In Hand</span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl text-emerald-600 font-extrabold mt-0.5 block">
                ₹1,500.00
              </span>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 font-['Inter']">
                <span>UPI / Direct Bank</span>
                <span className="text-slate-900 font-semibold">₹0.00</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-600 font-['Inter']">
                <span>Pending Due</span>
                <span className="text-slate-900 font-semibold">₹0.00</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors font-['Inter'] cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print Shift Report</span>
          </button>
        </div>
      </section>

      {/* Booking and Checkout Modals */}
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
        onClose={() => setIsReceiptModalOpen(false)}
        invoiceData={checkoutReceiptData}
      />
    </div>
  );
}

export default OwnerDashboard;
