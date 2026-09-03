import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { revenueService } from '../../services/revenueService';
import { useResidency } from '../../context/ResidencyContext';
import { RevenueBarChart, RevenueLineChart, CategoryChart } from '../../components/owner/RevenueChart';
import { formatCurrency } from '../../utils/dateFormat';
import Loader from '../../components/common/Loader';
import {
  IndianRupee, TrendingUp, Calendar, Filter, BarChart3,
  LineChart as LineIcon, Building2, CheckCircle2, ShieldAlert
} from 'lucide-react';

const quickFilters = [
  { label: 'Today', key: 'today' },
  { label: 'Past 7 Days', key: 'week' },
  { label: 'Past 30 Days', key: 'month' },
  { label: 'Custom Range', key: 'custom' },
];

export default function RevenuePage() {
  const { floors, categories } = useResidency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('month');
  const [chartType, setChartType] = useState('bar');
  const [floorFilter, setFloorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchRevenue();
  }, [activeFilter, floorFilter, categoryFilter, customRange.from, customRange.to]);

  function getDateRange() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (activeFilter) {
      case 'today':
        return { from_date: today, to_date: today };
      case 'week': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return { from_date: weekAgo, to_date: today };
      }
      case 'month': {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return { from_date: monthAgo, to_date: today };
      }
      case 'custom':
        return { from_date: customRange.from || undefined, to_date: customRange.to || undefined };
      default:
        return {};
    }
  }

  async function fetchRevenue() {
    try {
      setLoading(true);
      const params = {
        ...getDateRange(),
        floor_id: floorFilter || undefined,
        category_id: categoryFilter || undefined,
      };
      const result = await revenueService.getRevenueSummary(params);
      setData(result);
    } catch (err) {
      console.warn('Revenue fetch warning — using zero-state data');
      setData({ total_revenue: 0, total_bookings: 0, by_date: [], by_floor: [], by_category: [] });
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = data?.total_revenue || 0;
  const totalBookings = data?.total_bookings || 0;
  const avgTicket = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <IndianRupee className="w-6 h-6" />
            </span>
            Revenue & Financial Analytics
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Auto-derived financial metrics strictly based on completed 24-hour checkout slabs
          </p>
        </div>

        {/* 24-Hour Rule Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-amber-300 border border-slate-800 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>24-Hour Slab Formula Active</span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {quickFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === f.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Select Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 outline-none"
            >
              <option value="">All Building Levels</option>
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>{fl.floor_name}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 outline-none"
            >
              <option value="">All Room Types</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Range Selector */}
        {activeFilter === 'custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-medium">
            <span className="text-slate-500 font-bold uppercase">Range:</span>
            <input
              type="date"
              value={customRange.from}
              onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
              className="px-3 py-1 rounded-lg border border-slate-200 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customRange.to}
              onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
              className="px-3 py-1 rounded-lg border border-slate-200 text-xs"
            />
          </div>
        )}
      </div>

      {loading ? (
        <Loader type="card" count={3} />
      ) : (
        <>
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-luxury-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Total Derived Revenue
                </span>
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <IndianRupee className="w-5 h-5" />
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-amber-300">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Calculated via billable checkouts</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Completed Stays
                </span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {totalBookings}
              </p>
              <p className="text-xs text-slate-400 mt-1">Full checkout cycles recorded</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-luxury-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                  Average Revenue / Stay
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {formatCurrency(avgTicket)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Average per customer stay</p>
            </div>
          </div>

          {/* Charts Area */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-luxury-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Revenue Timeline</h2>
                <p className="text-xs text-slate-500">Chronological distribution of check-out amounts</p>
              </div>

              {/* Chart Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartType === 'bar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                  }`}
                  title="Bar Chart"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartType === 'line' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                  }`}
                  title="Line Trend"
                >
                  <LineIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              {chartType === 'bar' ? (
                <RevenueBarChart data={data?.by_date} />
              ) : (
                <RevenueLineChart data={data?.by_date} />
              )}
            </div>
          </div>

          {/* Breakdown by Category & Floor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-luxury-sm">
              <h2 className="text-base font-extrabold text-slate-900 mb-1">Performance by Unit Type</h2>
              <p className="text-xs text-slate-500 mb-4">Total revenue generated by each room category</p>
              <CategoryChart data={data?.by_category} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-luxury-sm">
              <h2 className="text-base font-extrabold text-slate-900 mb-1">Level-Wise Distribution</h2>
              <p className="text-xs text-slate-500 mb-4">Earnings comparison across floors</p>
              
              <div className="space-y-3">
                {data?.by_floor && data.by_floor.length > 0 ? (
                  data.by_floor.map((fl) => (
                    <div
                      key={fl.floor}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">{fl.floor}</p>
                        <p className="text-[11px] text-slate-500">{fl.bookings} completed stays</p>
                      </div>
                      <p className="font-black text-sm text-slate-900">
                        {formatCurrency(fl.revenue)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    No completed checkout records for this period yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
