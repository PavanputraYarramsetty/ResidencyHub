import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { bookingService } from '../../services/bookingService';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';
import Loader from '../../components/common/Loader';
import {
  BarChart3, Download, Calendar, Filter,
  ChevronLeft, ChevronRight, Hash, FileSpreadsheet, CheckCircle, Clock, XCircle
} from 'lucide-react';

export default function StatisticsPage() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', from_date: '', to_date: '' });
  const limit = 20;

  useEffect(() => {
    fetchBookings();
  }, [page, filters]);

  async function fetchBookings() {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.from_date && { from_date: filters.from_date }),
        ...(filters.to_date && { to_date: filters.to_date }),
      };
      const data = await bookingService.getBookings(params);
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.warn('Failed to fetch booking statistics');
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!bookings.length) return;
    const headers = ['Room', 'Floor', 'Category', 'Customer', 'Phone', 'Check-In', 'Check-Out', 'Billable Days', 'Amount (INR)', 'Status'];
    const rows = bookings.map((b) => [
      b.rooms?.room_number || '',
      b.rooms?.floors?.floor_name || '',
      b.rooms?.room_categories?.name || '',
      b.customers?.full_name || '',
      b.customers?.phone || '',
      b.check_in || '',
      b.check_out || '',
      b.billable_days || '',
      b.total_amount || '',
      b.status || '',
    ]);

    const csvContent = [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sridevi_Residency_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / limit) || 1;

  const statusBadges = {
    checked_out: { label: 'Checked Out', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    checked_in: { label: 'Active Stay', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    booked: { label: 'Reserved', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <BarChart3 className="w-6 h-6" />
            </span>
            Booking Audit Logs & History
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Permanent, tamper-proof history of all reservations, timestamps & computed billings
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={bookings.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-gold hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 outline-none"
          >
            <option value="">All Booking Statuses</option>
            <option value="checked_out">Checked Out (Billed)</option>
            <option value="checked_in">Checked In (Active)</option>
            <option value="booked">Booked (Upcoming)</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex items-center gap-2 text-xs font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => {
                setFilters({ ...filters, from_date: e.target.value });
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => {
                setFilters({ ...filters, to_date: e.target.value });
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
            />
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Total Logs: <strong className="text-slate-900">{total}</strong>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <Loader type="table" count={8} />
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No booking records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Bookings will appear in this permanent audit log automatically as guests check in and check out.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-luxury-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Room / Unit</th>
                  <th className="py-3.5 px-4 font-semibold">Guest Contact</th>
                  <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Check-In Time</th>
                  <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Check-Out Time</th>
                  <th className="py-3.5 px-4 font-semibold text-center">24h Slabs</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Billed</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const badge = statusBadges[b.status] || { label: b.status, bg: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Room info */}
                      <td className="py-3.5 px-4 sm:px-6 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Room {b.rooms?.room_number || '—'}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {b.rooms?.room_categories?.name || 'Standard'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {b.rooms?.floors?.floor_name || 'Ground'}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-900">{b.customers?.full_name || 'Guest'}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{b.customers?.phone || '—'}</p>
                      </td>

                      {/* Check-In */}
                      <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell font-mono text-[11px]">
                        {formatDateTime(b.check_in)}
                      </td>

                      {/* Check-Out */}
                      <td className="py-3.5 px-4 text-slate-600 hidden md:table-cell font-mono text-[11px]">
                        {b.check_out ? formatDateTime(b.check_out) : <span className="text-slate-400 italic">In progress</span>}
                      </td>

                      {/* Billable Days */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {b.billable_days ? `${b.billable_days} day(s)` : '—'}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        {b.total_amount ? formatCurrency(b.total_amount) : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <span>Showing Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
