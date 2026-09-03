import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { bookingService } from '../../services/bookingService';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';
import Loader from '../../components/common/Loader';
import {
  BarChart3, Search, Download, Filter, Calendar,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function StatisticsPage() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', from_date: '', to_date: '' });
  const limit = 25;

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
      setBookings(data.bookings);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!bookings.length) return;
    const headers = ['Room', 'Floor', 'Category', 'Customer', 'Phone', 'Check-In', 'Check-Out', 'Days', 'Amount', 'Status'];
    const rows = bookings.map(b => [
      b.rooms?.room_number,
      b.rooms?.floors?.floor_name,
      b.rooms?.room_categories?.name,
      b.customers?.full_name,
      b.customers?.phone,
      b.check_in || '',
      b.check_out || '',
      b.billable_days || '',
      b.total_amount || '',
      b.status,
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sridevi-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (status) => {
    const styles = {
      checked_out: 'bg-green-100 text-green-700',
      checked_in: 'bg-red-100 text-red-700',
      booked: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-surface-100 text-surface-500',
    };
    return styles[status] || styles.booked;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" /> Statistics
          </h1>
          <p className="text-sm text-surface-500">{total} total booking records</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="checked_out">Checked Out</option>
          <option value="checked_in">Checked In</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-surface-400" />
          <input type="date" value={filters.from_date}
            onChange={e => { setFilters(f => ({ ...f, from_date: e.target.value })); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-surface-200 text-sm" />
          <span className="text-surface-400 text-sm">to</span>
          <input type="date" value={filters.to_date}
            onChange={e => { setFilters(f => ({ ...f, to_date: e.target.value })); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-surface-200 text-sm" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader type="table" count={10} />
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Room</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600 hidden md:table-cell">Floor</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600 hidden lg:table-cell">Check-In</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600 hidden lg:table-cell">Check-Out</th>
                  <th className="text-right px-4 py-3 font-semibold text-surface-600">Days</th>
                  <th className="text-right px-4 py-3 font-semibold text-surface-600">Amount</th>
                  <th className="text-center px-4 py-3 font-semibold text-surface-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-surface-100 hover:bg-surface-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-surface-800">
                      {b.rooms?.room_number}
                      <span className="text-xs text-surface-400 ml-1">({b.rooms?.room_categories?.name})</span>
                    </td>
                    <td className="px-4 py-3 text-surface-500 hidden md:table-cell">{b.rooms?.floors?.floor_name}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-700">{b.customers?.full_name}</div>
                      <div className="text-xs text-surface-400">{b.customers?.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-surface-500 text-xs hidden lg:table-cell">{formatDateTime(b.check_in)}</td>
                    <td className="px-4 py-3 text-surface-500 text-xs hidden lg:table-cell">{formatDateTime(b.check_out)}</td>
                    <td className="px-4 py-3 text-right text-surface-700 font-medium">{b.billable_days ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-surface-800">{formatCurrency(b.total_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${statusBadge(b.status)}`}>
                        {b.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </motion.tr>
                ))}
                {!bookings.length && (
                  <tr><td colSpan="8" className="text-center py-12 text-surface-400">No booking records found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
              <p className="text-xs text-surface-400">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
