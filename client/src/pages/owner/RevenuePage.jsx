import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { revenueService } from '../../services/revenueService';
import { useResidency } from '../../context/ResidencyContext';
import { RevenueBarChart, RevenueLineChart, CategoryChart } from '../../components/owner/RevenueChart';
import { formatCurrency } from '../../utils/dateFormat';
import Loader from '../../components/common/Loader';
import { IndianRupee, TrendingUp, Calendar, Filter, BarChart3, LineChart as LineIcon } from 'lucide-react';

const quickFilters = [
  { label: 'Today', key: 'today' },
  { label: 'This Week', key: 'week' },
  { label: 'This Month', key: 'month' },
  { label: 'Custom', key: 'custom' },
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
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        return { from_date: weekAgo, to_date: today };
      }
      case 'month': {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
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
      console.error('Failed to fetch revenue:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <IndianRupee className="w-6 h-6 text-brand-600" /> Revenue
        </h1>
        <p className="text-sm text-surface-500">All revenue is auto-calculated from completed bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {quickFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === f.key
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
            }`}
          >
            {f.label}
          </button>
        ))}

        {activeFilter === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customRange.from} onChange={e => setCustomRange(r => ({ ...r, from: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-surface-200 text-sm" />
            <span className="text-surface-400">to</span>
            <input type="date" value={customRange.to} onChange={e => setCustomRange(r => ({ ...r, to: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-surface-200 text-sm" />
          </div>
        )}

        <select value={floorFilter} onChange={e => setFloorFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white">
          <option value="">All Floors</option>
          {floors.map(f => <option key={f.id} value={f.id}>{f.floor_name}</option>)}
        </select>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-surface-200 text-sm bg-white">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <Loader type="card" count={3} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-xl shadow-brand-600/20">
              <div className="flex items-center gap-2 text-brand-200 text-sm mb-1">
                <TrendingUp className="w-4 h-4" /> Total Revenue
              </div>
              <p className="text-3xl font-bold animate-count-up">{formatCurrency(data?.total_revenue || 0)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl p-5 bg-white border border-surface-200 shadow-sm">
              <div className="flex items-center gap-2 text-surface-400 text-sm mb-1">
                <Calendar className="w-4 h-4" /> Completed Bookings
              </div>
              <p className="text-3xl font-bold text-surface-900 animate-count-up">{data?.total_bookings || 0}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-5 bg-white border border-surface-200 shadow-sm">
              <div className="flex items-center gap-2 text-surface-400 text-sm mb-1">
                <IndianRupee className="w-4 h-4" /> Avg per Booking
              </div>
              <p className="text-3xl font-bold text-surface-900 animate-count-up">
                {data?.total_bookings ? formatCurrency(data.total_revenue / data.total_bookings) : '—'}
              </p>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-surface-800">Revenue Over Time</h2>
              <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1">
                <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-400'}`}>
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button onClick={() => setChartType('line')} className={`p-2 rounded-lg transition-colors ${chartType === 'line' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-400'}`}>
                  <LineIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            {chartType === 'bar' ? <RevenueBarChart data={data?.by_date} /> : <RevenueLineChart data={data?.by_date} />}
          </div>

          {/* By category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
              <h2 className="font-bold text-surface-800 mb-4">Revenue by Category</h2>
              <CategoryChart data={data?.by_category} />
            </div>
            <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
              <h2 className="font-bold text-surface-800 mb-4">Revenue by Floor</h2>
              <div className="space-y-3">
                {data?.by_floor?.map((f, i) => (
                  <div key={f.floor} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                    <span className="font-medium text-surface-700">{f.floor}</span>
                    <div className="text-right">
                      <p className="font-bold text-surface-900">{formatCurrency(f.revenue)}</p>
                      <p className="text-xs text-surface-400">{f.bookings} bookings</p>
                    </div>
                  </div>
                ))}
                {!data?.by_floor?.length && <p className="text-sm text-surface-400 text-center py-4">No data</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
