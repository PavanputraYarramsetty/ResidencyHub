import React, { useState, useEffect } from 'react';
import revenueService from '../../services/revenueService';
import roomService from '../../services/roomService';
import floorService from '../../services/floorService';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianDateTime } from '../../utils/dateUtils';
import { exportToCSV, printInvoiceDocument } from '../../utils/exportUtils';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { BarChart3, Download, Printer, Filter, Search, Calendar, BedDouble } from 'lucide-react';

export function OwnerStatistics() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([floorService.getFloors(), roomService.getCategories()]).then(
      ([flrs, cats]) => {
        setFloors(flrs || []);
        setCategories(cats || []);
      }
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    revenueService
      .getStatistics({
        floor_id: selectedFloor || undefined,
        category_id: selectedCategory || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      .then((res) => {
        setStats(res.bookings || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, selectedFloor, selectedCategory, statusFilter]);

  function handleExportCSV() {
    const headers = [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_phone', label: 'Phone' },
      { key: 'room_number', label: 'Room' },
      { key: 'floor_name', label: 'Floor' },
      { key: 'category_name', label: 'Room Category' },
      { key: 'check_in', label: 'Check In' },
      { key: 'check_out', label: 'Check Out' },
      { key: 'billing_units', label: 'Stay Units' },
      { key: 'total_amount', label: 'Total Amount (₹)' },
      { key: 'payment_mode', label: 'Payment Mode' },
      { key: 'status', label: 'Status' },
    ];
    exportToCSV('sridevi_residency_statistics', stats, headers);
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Booking Statistics & Audit View
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Historical database records with multi-filters and CSV export</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print Report
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Search Customer / Room</label>
            <Input
              placeholder="Search guest or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Filter Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">All Floors</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.floor_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Room Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Stay Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="checked_in">Checked In (Active)</option>
              <option value="checked_out">Checked Out (Completed)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Historical Ledger Table */}
      <Card className="overflow-hidden p-0 border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-4">Customer</th>
                <th className="p-4">Room</th>
                <th className="p-4">Floor & Category</th>
                <th className="p-4">Check-in (IST)</th>
                <th className="p-4">Check-out (IST)</th>
                <th className="p-4">Billing Units</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                stats.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-800">{b.customer_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{b.customer_phone}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold font-mono text-slate-900 border border-slate-200">
                        Room {b.room_number}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700">
                      <span className="font-medium">{b.floor_name}</span>
                      <span className="text-slate-500 block text-[11px]">{b.category_name}</span>
                    </td>

                    <td className="p-4 text-slate-600 font-mono text-[11px]">
                      {formatIndianDateTime(b.check_in)}
                    </td>

                    <td className="p-4 text-slate-600 font-mono text-[11px]">
                      {b.check_out ? formatIndianDateTime(b.check_out) : <span className="text-amber-700 font-bold">In Progress</span>}
                    </td>

                    <td className="p-4 text-slate-700 font-mono">
                      {b.billing_units} × 24h
                    </td>

                    <td className="p-4 font-extrabold text-emerald-700 font-mono">
                      {formatINR(b.total_amount)}
                    </td>

                    <td className="p-4 text-right">
                      <Badge variant={b.status === 'checked_out' ? 'default' : b.status === 'checked_in' ? 'occupied' : 'inactive'}>
                        {b.status === 'checked_out' ? 'Completed' : b.status === 'checked_in' ? 'Active' : b.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default OwnerStatistics;
