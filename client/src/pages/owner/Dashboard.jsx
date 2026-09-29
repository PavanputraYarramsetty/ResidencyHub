import React, { useState, useEffect } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import { useIndianClock } from '../../hooks/useIndianClock';
import { formatINR } from '../../utils/currencyUtils';
import bookingService from '../../services/bookingService';
import roomService from '../../services/roomService';
import NewBookingModal from '../../components/bookings/NewBookingModal';
import OccupiedRoomModal from '../../components/bookings/OccupiedRoomModal';
import CheckoutConfirmationDialog from '../../components/bookings/CheckoutConfirmationDialog';
import InvoiceReceiptModal from '../../components/bookings/InvoiceReceiptModal';

export function OwnerDashboard() {
  const { floors, refreshFloors, markRoomAvailable, markRoomOccupied } = useResidency();
  const { timeString, dateFull } = useIndianClock();
  const [stats, setStats] = useState({ today_check_ins: 0, today_check_outs: 0, today_revenue: 0, total_cash: 0, total_upi: 0, total_due: 0 });

  // Modal States
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

  useEffect(() => {
    bookingService.getTodayStats().then((data) => {
      if (data) setStats(data);
    }).catch(() => {});
  }, [floors]);

  // Compute live occupancy metrics
  const allRooms = floors.flatMap((f) => f.rooms || []);
  const totalRooms = allRooms.length;
  const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length;
  const maintenanceRooms = allRooms.filter((r) => r.status === 'maintenance').length;
  const availableRooms = allRooms.filter((r) => r.status === 'available').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

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
    } catch (err) {
      console.warn('Booking notice (fallback occupy):', err);
    } finally {
      markRoomOccupied(bookingData.room_id, bookingData);
      setIsBookingModalOpen(false);
      setSelectedRoom(null);
      await refreshFloors();
    }
  }

  async function handleConfirmCheckout(checkoutData) {
    try {
      const targetId = checkoutData.bookingId || checkoutData.roomId;
      await bookingService.checkOut(targetId, checkoutData);
    } catch (err) {
      console.warn('Checkout notice:', err);
    } finally {
      markRoomAvailable(checkoutData.roomId, checkoutData);
      setIsOccupiedModalOpen(false);
      setIsCheckoutDialogOpen(false);
      setSelectedRoom(null);
      await refreshFloors();
    }
  }

  return (
    <div className="flex flex-col w-full gap-5 sm:gap-6">
      {/* Primary Metric Stats Grid (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Rooms */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-blue-100/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex flex-col relative z-10">
            <span className="text-[11px] font-extrabold text-blue-900/70 uppercase tracking-wider mb-1 font-['Inter']">
              Total Rooms
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-black text-slate-900">
              {totalRooms}
            </span>
            <span className="text-xs text-slate-500 mt-1 font-['Inter'] font-medium">Full property capacity</span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 relative z-10 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">bed</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-emerald-100/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex flex-col relative z-10">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider mb-1 font-['Inter']">
              Available
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-black text-emerald-700">
              {availableRooms}
            </span>
            <span className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-['Inter'] font-semibold">
              <span className="material-symbols-outlined text-xs">done_all</span> Ready for walk-ins
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 relative z-10 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-gradient-to-br from-white via-rose-50/30 to-amber-50/30 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-rose-100/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
          <div className="flex flex-col relative z-10">
            <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider mb-1 font-['Inter']">
              Occupied
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-black text-rose-700">
              {occupiedRooms}
            </span>
            <span className="text-xs text-rose-700 mt-1 flex items-center gap-1 font-['Inter'] font-semibold">
              <span className="material-symbols-outlined text-xs">lock</span>{' '}
              {occupiedRooms === 0
                ? 'No active stays'
                : occupiedRooms === 1
                ? '1 Active guest stay'
                : `${occupiedRooms} Active guest stays`}
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25 relative z-10 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">meeting_room</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 rounded-2xl p-5 shadow-sm hover-lift flex items-center justify-between border border-purple-100/90 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
          <div className="flex flex-col relative z-10">
            <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wider mb-1 font-['Inter']">
              Occupancy Rate
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-black text-purple-700">
              {occupancyRate}%
            </span>
            <span className="text-xs text-purple-700 mt-1 flex items-center gap-1 font-['Inter'] font-semibold">
              <span className="material-symbols-outlined text-xs">trending_up</span> {occupiedRooms > 0 ? 'Live occupancy' : 'Property vacant'}
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25 relative z-10 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">insights</span>
          </div>
        </div>
      </section>

      {/* Secondary Operational Row (3 Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover-lift flex items-center justify-between border border-slate-200/90 bg-gradient-to-r from-white to-blue-50/20">
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 font-['Inter']">
              Today Check-in
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-blue-600">
                {stats.today_check_ins}
              </span>
              <span className="text-xs text-slate-500 font-['Inter'] font-semibold">Guest lodged</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <span className="material-symbols-outlined text-xl">login</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover-lift flex items-center justify-between border border-slate-200/90 bg-gradient-to-r from-white to-amber-50/20">
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 font-['Inter']">
              Today Check-out
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-amber-600">
                {stats.today_check_outs}
              </span>
              <span className="text-xs text-slate-500 font-['Inter'] font-semibold">Pending departures</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
            <span className="material-symbols-outlined text-xl">logout</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover-lift flex items-center justify-between border border-slate-200/90 bg-gradient-to-r from-white to-emerald-50/20">
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider mb-1 font-['Inter']">
              Today Revenue
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-emerald-600">
                {formatINR(stats.today_revenue ?? 0)}
              </span>
              <span className="text-xs text-slate-500 font-['Inter'] font-semibold">Cash / UPI</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
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
                Room Status Overview
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-['Inter']">
              Live occupancy status across all residency floors (Manage & book in Rooms Matrix)
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
            <span className="text-slate-300 text-xs">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-slate-700 font-['Inter']">
                Maintenance ({allRooms.filter((r) => r.status === 'maintenance').length})
              </span>
            </div>
          </div>
        </div>

        {/* Floors Loop */}
        {floors.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-3xl mb-2">domain</span>
            <h4 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900 mb-1">
              No Floors or Rooms Registered Yet
            </h4>
            <p className="font-['Inter'] text-xs text-slate-500 max-w-sm">
              Use the Admin Panel to configure residency floors and room categories to start checking in guests.
            </p>
          </div>
        ) : (
          floors.map((floor) => (
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

            {/* Rooms in Floor - Visual Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(floor.rooms || []).map((room) => {
                const isOccupied = room.status === 'occupied';
                const isMaintenance = room.status === 'maintenance';
                const categoryName = room.room_categories?.name || 'Standard';
                const basePrice = room.room_categories?.base_price || room.room_categories?.price_per_24_hours || 1500;
                const activeBooking = room.active_booking;

                return (
                  <div
                    key={room.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover-lift flex flex-col justify-between relative overflow-hidden border transition-all duration-200 ${
                      isOccupied
                        ? 'border-rose-200/90 bg-gradient-to-b from-white via-rose-50/10 to-rose-50/30 shadow-rose-500/5'
                        : isMaintenance
                        ? 'border-amber-200/90 bg-gradient-to-b from-white via-amber-50/10 to-amber-50/30 shadow-amber-500/5'
                        : 'border-emerald-200/90 bg-gradient-to-b from-white via-emerald-50/10 to-emerald-50/30 shadow-emerald-500/5'
                    }`}
                  >
                    {/* Top Status Gradient Strip */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                        isOccupied
                          ? 'from-rose-500 via-pink-500 to-rose-600'
                          : isMaintenance
                          ? 'from-amber-500 via-orange-500 to-amber-600'
                          : 'from-emerald-500 via-teal-500 to-emerald-600'
                      }`}
                    />

                    <div>
                      {/* Room Header & Status */}
                      <div className="flex items-start justify-between mb-3 pt-1">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase block font-['Inter'] tracking-widest">
                            ROOM
                          </span>
                          <span className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-slate-900 tracking-tight">
                            {room.room_number}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-['Inter'] shadow-xs ${
                            isOccupied
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/90'
                              : isMaintenance
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/90'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/90'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOccupied ? 'bg-rose-500 animate-pulse' : isMaintenance ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          {isOccupied ? 'OCCUPIED' : isMaintenance ? 'MAINTENANCE' : 'AVAILABLE'}
                        </span>
                      </div>

                      {/* Specs & Pricing */}
                      <div className="flex items-center justify-between py-2 border-y border-slate-100/90">
                        <span className="text-xs font-bold text-slate-800 font-['Inter']">
                          {categoryName}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {formatINR(basePrice)}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-['Inter'] font-extrabold uppercase">
                            / 24 HOURS
                          </span>
                        </div>
                      </div>

                      {/* Micro Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 my-3">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold font-['Inter']">
                          Max {room.room_categories?.max_occupancy || room.room_categories?.max_persons || 2}
                        </span>
                        {categoryName.toLowerCase().includes('ac') && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-extrabold font-['Inter'] border border-blue-200/60">
                            ✓ AC
                          </span>
                        )}
                        <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium font-['Inter']">
                          ✓ Attached Bath
                        </span>
                      </div>

                      {/* Status Information Display */}
                      {isOccupied && activeBooking ? (
                        <div className="bg-gradient-to-r from-rose-50 to-pink-50/50 rounded-xl p-2.5 mt-2 border border-rose-200/90 shadow-2xs">
                          <span className="text-[9px] font-black text-rose-800 uppercase block font-['Inter'] tracking-wider">
                            ACTIVE GUEST
                          </span>
                          <div className="flex items-center justify-between text-xs mt-0.5 font-['Inter']">
                            <span className="text-slate-900 font-extrabold truncate max-w-[140px]">
                              {activeBooking.customers?.full_name || 'Guest'}
                            </span>
                            <span className="text-rose-700 text-[10px] font-mono font-black bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                              {activeBooking.check_in ? new Date(activeBooking.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'In Stay'}
                            </span>
                          </div>
                        </div>
                      ) : isMaintenance ? (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl p-2.5 mt-2 flex items-center justify-between border border-amber-200/90 shadow-2xs">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-amber-700 text-base">engineering</span>
                            <span className="text-xs text-amber-900 font-bold font-['Inter']">Under Maintenance</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleReleaseMaintenance(e, room)}
                            className="text-[10px] font-black text-emerald-700 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Release
                          </button>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl p-2.5 mt-2 flex items-center justify-between border border-emerald-200/90 shadow-2xs">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                            <span className="text-xs text-emerald-900 font-bold font-['Inter']">Vacant & Clean</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleSetMaintenance(e, room)}
                              className="text-[10px] font-bold text-amber-800 bg-white hover:bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 transition-all cursor-pointer shadow-xs active:scale-95"
                              title="Put room into maintenance"
                            >
                              Maintenance
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )))}
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
              {occupiedRooms === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <p className="font-medium">No front desk activity recorded today.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">New guest check-ins and check-outs will appear here live.</p>
                </div>
              ) : (
                allRooms
                  .filter((r) => r.status === 'occupied' && r.active_booking)
                  .map((r) => (
                    <div key={r.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-slate-900 font-semibold">Room {r.room_number} Checked In</span>
                        <span className="text-slate-500 hidden sm:inline">• {r.active_booking.customers?.full_name || 'Guest'} ({r.room_categories?.name || 'Room'})</span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-mono font-medium">
                        {r.active_booking.check_in ? new Date(r.active_booking.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Active'} • {formatINR(r.active_booking.total_amount || 0)}
                      </span>
                    </div>
                  ))
              )}
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
                LIVE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 mb-3.5 border border-slate-200/80">
              <span className="text-xs text-slate-500 block font-['Inter']">Total Shift Collections</span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl text-emerald-600 font-extrabold mt-0.5 block">
                {formatINR(stats.today_revenue || 0)}
              </span>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 font-['Inter']">
                <span>Cash Drawer</span>
                <span className="text-slate-900 font-semibold">{formatINR(stats.total_cash || 0)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-600 font-['Inter']">
                <span>UPI / Digital</span>
                <span className="text-slate-900 font-semibold">{formatINR(stats.total_upi || 0)}</span>
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
        onClose={() => {
          setIsReceiptModalOpen(false);
          setCheckoutReceiptData(null);
        }}
        invoiceData={checkoutReceiptData}
      />
    </div>
  );
}

export default OwnerDashboard;
