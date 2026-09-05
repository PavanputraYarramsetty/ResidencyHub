import React, { useState, useMemo } from 'react';
import useBookings from '../../hooks/useBookings';
import { useResidency } from '../../context/ResidencyContext';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianDateTime } from '../../utils/dateUtils';
import { exportToCSV } from '../../utils/exportUtils';
import InvoiceReceiptModal from '../../components/bookings/InvoiceReceiptModal';

export function OwnerBookings() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const { bookings } = useBookings({});
  const { floors } = useResidency();

  const realBookings = useMemo(() => bookings || [], [bookings]);

  // Dynamic KPI metrics
  const activeStayCount = realBookings.filter((b) => b.status === 'checked_in').length;
  const todayCollections = realBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const activeCycles = realBookings
    .filter((b) => b.status === 'checked_in')
    .reduce((sum, b) => sum + Number(b.billing_units || 1), 0);
  const completedCount = realBookings.filter((b) => b.status === 'checked_out').length;

  // Filtered
  const filteredBookings = realBookings.filter((b) => {
    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'checked_in' && b.status !== 'checked_in') return false;
      if (statusFilter === 'checked_out' && b.status !== 'checked_out') return false;
      if (statusFilter === 'cancelled' && b.status !== 'cancelled') return false;
    }

    // Floor Filter
    if (selectedFloor !== 'all') {
      const roomFloorId = b.rooms?.floor_id;
      if (roomFloorId && String(roomFloorId) !== String(selectedFloor)) return false;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const guestName = b.customers?.full_name?.toLowerCase() || '';
      const phone = b.customers?.phone?.toLowerCase() || '';
      const roomNum = String(b.rooms?.room_number || '').toLowerCase();
      if (!guestName.includes(q) && !phone.includes(q) && !roomNum.includes(q)) {
        return false;
      }
    }

    return true;
  });

  function handleExportCSV() {
    exportToCSV(
      filteredBookings.map((b) => ({
        Customer: b.customers?.full_name || 'Guest',
        Phone: b.customers?.phone || '',
        Room: b.rooms?.room_number || '',
        Category: b.rooms?.room_categories?.name || '',
        CheckIn: formatIndianDateTime(b.check_in),
        CheckOut: b.check_out ? formatIndianDateTime(b.check_out) : 'Active',
        Amount: b.total_amount,
        Status: b.status,
      })),
      'sridevi_residency_bookings_ledger.csv'
    );
  }

  function handlePrintFolio(b) {
    setSelectedInvoiceData({
      bookingId: b.id,
      customerName: b.customers?.full_name || b.full_name || 'Guest',
      full_name: b.customers?.full_name || b.full_name || 'Guest',
      phone: b.customers?.phone || b.phone || '—',
      roomNumber: b.rooms?.room_number || b.room_number || '—',
      room_number: b.rooms?.room_number || b.room_number || '—',
      categoryName: b.rooms?.room_categories?.name || b.category_name || 'Standard Room',
      category_name: b.rooms?.room_categories?.name || b.category_name || 'Standard Room',
      checkIn: b.check_in || b.created_at,
      check_in: b.check_in || b.created_at,
      checkOut: b.check_out || new Date().toISOString(),
      check_out: b.check_out || new Date().toISOString(),
      billableDays: b.billable_days || b.billing_units || b.no_of_days || 1,
      billable_days: b.billable_days || b.billing_units || b.no_of_days || 1,
      ratePerDay: b.rate_per_day || b.total_amount,
      discountPercent: b.discount_percent || 0,
      discountAmount: b.discount_amount || 0,
      netTotal: b.total_amount,
      total_amount: b.total_amount,
      paymentMode: b.payment_mode || 'UPI',
    });
    setIsInvoiceOpen(true);
  }

  return (
    <div className="flex flex-col w-full gap-5 sm:gap-6">
      {/* Top Command & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-blue-600 text-2xl">calendar_month</span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Bookings Ledger
            </h2>
          </div>
          <p className="font-['Inter'] text-xs text-slate-500">
            Comprehensive audit log of active and completed lodge stays & 24-hour cycle billings.
          </p>
        </div>

        {/* Right Status Switcher & Export CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white p-1 rounded-xl flex items-center border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Inter'] transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Stays ({realBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('checked_in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Inter'] transition-all cursor-pointer ${
                statusFilter === 'checked_in'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Checked In ({realBookings.filter((b) => b.status === 'checked_in').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('checked_out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Inter'] transition-all cursor-pointer ${
                statusFilter === 'checked_out'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Checked Out ({realBookings.filter((b) => b.status === 'checked_out').length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold font-['Inter'] border border-slate-200 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-['Inter'] transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Operational Metric Mini-Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 font-['Inter']">
              OCCUPIED ACTIVE FOIL
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-rose-600">
              {activeStayCount} {activeStayCount === 1 ? 'Room' : 'Rooms'}
            </span>
            <span className="text-xs text-slate-400 font-['Inter'] block mt-0.5">
              {activeStayCount > 0 ? 'Active Guest Stays' : 'No active occupancy'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <span className="material-symbols-outlined">meeting_room</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 font-['Inter']">
              TODAY'S COLLECTIONS
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-emerald-600">
              {formatINR(todayCollections)}
            </span>
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-['Inter'] mt-0.5 font-medium">
              <span className="material-symbols-outlined text-xs">trending_up</span> Realtime Live
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 font-['Inter']">
              ACTIVE 24H CYCLES
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-blue-600">
              {activeCycles} {activeCycles === 1 ? 'Unit' : 'Units'}
            </span>
            <span className="text-xs text-slate-400 font-['Inter'] block mt-0.5">24-hour cycles</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined">history_toggle_off</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5 font-['Inter']">
              COMPLETED STAYS
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-slate-900">
              {completedCount} {completedCount === 1 ? 'Stay' : 'Stays'}
            </span>
            <span className="text-xs text-slate-400 font-['Inter'] block mt-0.5">Checked out folios</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <span className="material-symbols-outlined">fact_check</span>
          </div>
        </div>
      </div>

      {/* Multi-parameter Filtering Section */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-['Inter']">
              Search Customer / Phone / Room
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search guest name, 10-digit mobile, or room no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-['Inter']">
              Filter Floor
            </label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all shadow-xs"
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.floor_name || `Floor ${f.floor_number}`}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-['Inter']">
              Stay Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all shadow-xs"
            >
              <option value="all">All Statuses</option>
              <option value="checked_in">Active Stay</option>
              <option value="checked_out">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Bookings Ledger Table Surface */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Info Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider font-['Inter']">
              AUDIT TRAIL VIEW
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-['Inter']">
              Showing {filteredBookings.length} verified lodge stays in current shift
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-['Inter']">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>Standard Indian Standard Time (IST) • 24hr Cycle Standard</span>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold tracking-wider uppercase select-none border-b border-slate-200">
                <th className="py-3 px-5 font-['Inter']">CUSTOMER</th>
                <th className="py-3 px-5 font-['Inter']">ROOM & CATEGORY</th>
                <th className="py-3 px-5 font-['Inter']">CHECK-IN (IST)</th>
                <th className="py-3 px-5 font-['Inter']">CHECK-OUT (IST)</th>
                <th className="py-3 px-5 font-['Inter']">DURATION / BILLING</th>
                <th className="py-3 px-5 font-['Inter']">TOTAL & PAYMENT</th>
                <th className="py-3 px-5 font-['Inter']">STATUS</th>
                <th className="py-3 px-5 font-['Inter'] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-['Inter']">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isCheckedIn = b.status === 'checked_in';
                  const initials = (b.customers?.full_name || 'Guest')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-['Plus_Jakarta_Sans'] font-bold text-xs shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {b.customers?.full_name || 'Guest'}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <span className="material-symbols-outlined text-xs">call</span>
                              {b.customers?.phone || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-xs text-slate-800 font-bold">
                            {b.rooms?.room_number || '101'}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">
                              {b.rooms?.room_categories?.name || 'AC Standard'}
                            </span>
                            <span className="text-[10px] text-slate-400">Ground Floor</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap font-mono text-xs text-slate-700 font-medium">
                        {formatIndianDateTime(b.check_in)}
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {isCheckedIn ? (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            In Progress
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-slate-600">
                            {b.check_out ? formatIndianDateTime(b.check_out) : '—'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-xs text-slate-800 block font-semibold">
                          {b.billing_units || 1} × 24h cycle
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Tariff: {formatINR(b.rate_per_day || 1500)}/day
                        </span>
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-xs text-emerald-600 font-extrabold block font-['Plus_Jakarta_Sans']">
                          {formatINR(b.total_amount)}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-0.5">
                          {b.payment_mode || 'UPI (Paid)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${
                            isCheckedIn
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCheckedIn ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                          {isCheckedIn ? 'Active Stay' : 'Completed'}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handlePrintFolio(b)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                            title="Print Stay Invoice"
                          >
                            <span className="material-symbols-outlined text-base">print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{filteredBookings.length}</strong> records</span>
          <span>Indian Standard Time (IST) 24h cycle</span>
        </div>
      </div>

      {/* 24-Hour Cycle Compliance Protocol */}
      <div className="p-4 sm:p-5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3 shadow-xs">
        <span className="material-symbols-outlined text-blue-600 text-xl mt-0.5">info</span>
        <div>
          <h4 className="text-xs font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            24-Hour Cycle Compliance Protocol
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-['Inter']">
            Sridevi Residency enforces standard 24-hour billing increments computed strictly from the registered Check-In timestamp. Extensions beyond a 30-minute grace window automatically prompt the front desk cashier to append a subsequent 24h billing block or apply hourly half-day tariff rules prior to guest checkout settlement.
          </p>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedInvoiceData(null);
        }}
        invoiceData={selectedInvoiceData}
      />
    </div>
  );
}

export default OwnerBookings;
