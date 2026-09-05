import React, { useState } from 'react';
import useRevenue from '../../hooks/useRevenue';
import { useResidency } from '../../context/ResidencyContext';
import { formatINR } from '../../utils/currencyUtils';
import { exportToCSV } from '../../utils/exportUtils';

export function OwnerRevenue() {
  const [dateFilter, setDateFilter] = useState('month');
  const { data: revenueData } = useRevenue();
  const { floors } = useResidency();

  const totalRev = revenueData?.total_revenue || 0;
  const totalStays = revenueData?.total_bookings || 0;
  const avgRev = totalStays > 0 ? Math.round(totalRev / totalStays) : 0;
  const byDate = revenueData?.by_date || [];
  const byCategory = revenueData?.by_category || [];
  const byFloor = revenueData?.by_floor || [];

  function handleDownloadPL() {
    window.print();
  }

  function handleExportCSV() {
    const csvData =
      byFloor.length > 0
        ? byFloor.map((f) => ({
            Floor: f.floor,
            Revenue: f.revenue,
            Stays: f.bookings,
          }))
        : [
            {
              Floor: 'All Floors',
              Revenue: totalRev,
              Stays: totalStays,
            },
          ];
    exportToCSV(csvData, 'sridevi_residency_revenue_pnl.csv');
  }

  const maxDailyRev = byDate.length > 0 ? Math.max(...byDate.map((d) => d.revenue)) : 1;

  return (
    <div className="flex flex-col w-full gap-5 sm:gap-6">
      {/* Header Block with Title and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <span className="material-symbols-outlined text-xl">trending_up</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Revenue Analytics
            </h1>
          </div>
          <p className="font-['Inter'] text-xs text-slate-500">
            Financial insights, daily collections, and category distribution
          </p>
        </div>

        {/* Quick Action / Date Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative inline-flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 text-base pointer-events-none">
              calendar_month
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white text-slate-800 text-xs pl-9 pr-7 py-2 rounded-xl appearance-none cursor-pointer border border-slate-200 focus:border-blue-500 focus:outline-none shadow-xs font-['Inter'] font-semibold"
            >
              <option value="month">This Month (Current)</option>
              <option value="prev">Previous Month</option>
              <option value="quarter">Current Quarter</option>
              <option value="year">Financial Year</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadPL}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-['Inter'] px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download P&L Statement</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Export Raw CSV"
          >
            <span className="material-symbols-outlined text-base">receipt</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-['Inter']">
                TOTAL REVENUE
              </span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {formatINR(totalRev)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <span className="material-symbols-outlined text-2xl">currency_rupee</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs font-['Inter']">
            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-bold text-[10px]">
              <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span>Live
            </span>
            <span className="text-slate-500 font-medium">Verified billing balance</span>
          </div>
        </div>

        {/* 2. Total Checkouts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-['Inter']">
                TOTAL CHECKOUTS
              </span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalStays} <span className="text-xs text-slate-400 font-normal">Stays</span>
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <span className="material-symbols-outlined text-2xl">hotel</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs font-['Inter']">
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
              100% Settled
            </span>
            <span className="text-slate-500">• 0 pending billing</span>
          </div>
        </div>

        {/* 3. Avg Revenue / Stay */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-['Inter']">
                AVG. REVENUE / STAY
              </span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {formatINR(avgRev)}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <span className="material-symbols-outlined text-2xl">query_stats</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs font-['Inter']">
            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
              ADR Metric
            </span>
            <span className="text-slate-500">Per registered checkout</span>
          </div>
        </div>

        {/* 4. Settlement Currency */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-slate-200/80 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-['Inter']">
                SETTLEMENT CURRENCY
              </span>
              <span className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                INR (₹)
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] font-['Inter']">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />UPI / Digital
            </span>
            <span className="text-blue-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Cash Desk
            </span>
            <span className="text-purple-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />POS Cards
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Timeline Chart & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Panel 1: Daily Revenue Timeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl">finance_mode</span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                    Daily Revenue Timeline
                  </h2>
                  <p className="text-xs text-slate-500 font-['Inter']">
                    Revenue trend across completed stays
                  </p>
                </div>
              </div>
              {byDate.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-['Inter']">
                  Peak: {formatINR(maxDailyRev)}
                </span>
              )}
            </div>

            {/* Custom Bar Visualization */}
            <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-baseline justify-between mb-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-['Inter']">
                <span>COLLECTION DISTRIBUTION</span>
                <span>REALTIME LIVE RUN</span>
              </div>

              {byDate.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                  <span className="material-symbols-outlined text-slate-300 text-4xl mb-1">bar_chart</span>
                  <span className="text-xs text-slate-400 font-['Inter']">
                    No checkout transactions recorded yet.
                  </span>
                  <span className="text-[11px] text-slate-400 font-['Inter']">
                    Completed bookings will automatically plot here.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 items-end h-40 pt-2 px-2">
                  {byDate.map((day) => {
                    const heightPercent = Math.max(15, Math.round((day.revenue / maxDailyRev) * 100));
                    return (
                      <div key={day.date} className="flex flex-col items-center h-full justify-end gap-1.5 group cursor-pointer">
                        <span className="text-[10px] font-mono text-slate-600 font-bold group-hover:text-blue-600">
                          {formatINR(day.revenue)}
                        </span>
                        <div
                          className="w-full max-w-[40px] bg-blue-600 rounded-t-lg transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[10px] text-slate-500 font-['Inter']">{day.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel 2: Room Categories Revenue Split (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-xl">pie_chart</span>
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">Room Categories</h2>
                  <p className="text-xs text-slate-500 font-['Inter']">Revenue split by room type</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-['Inter']">
                {byCategory.length} Types
              </span>
            </div>

            {/* Category Items */}
            {byCategory.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-slate-300 text-4xl mb-1">donut_large</span>
                <span className="text-xs text-slate-400 font-['Inter']">
                  No category earnings recorded yet.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                {byCategory.map((cat) => {
                  const percent = totalRev > 0 ? Math.round((cat.revenue / totalRev) * 100) : 0;
                  return (
                    <div key={cat.category} className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span className="text-xs font-bold text-slate-900 font-['Inter']">{cat.category}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-extrabold text-blue-600 font-['Plus_Jakarta_Sans']">
                            {formatINR(cat.revenue)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">{percent}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px] font-['Inter']">
                        <span>{cat.bookings} {cat.bookings === 1 ? 'Stay' : 'Stays'} Recorded</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel 3: Revenue by Floor */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-lg">layers</span>
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">Revenue by Floor</h2>
              <p className="text-xs text-slate-500 font-['Inter']">Comparison of earnings and room capacity across residency floors</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
            {floors.length} Floors Configured
          </span>
        </div>

        {floors.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-400 font-['Inter']">
            No residency floors configured. Add floors in Admin Portal to view floor-level financials.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {floors.map((floor) => {
              const floorData = byFloor.find((f) => f.floor === floor.floor_name) || { revenue: 0, bookings: 0 };
              const floorRevPercent = totalRev > 0 ? Math.round((floorData.revenue / totalRev) * 100) : 0;
              const fRooms = floor.rooms || [];

              return (
                <div key={floor.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider font-['Inter']">
                        LEVEL {floor.floor_number}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {fRooms.length} Rooms
                      </span>
                    </div>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-900 mt-1.5">{floor.floor_name}</h3>
                    <div className="mt-3">
                      <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-emerald-600">
                        {formatINR(floorData.revenue)}
                      </span>
                      <span className="text-xs text-slate-400 font-['Inter'] block mt-0.5">
                        {floorRevPercent}% of total revenue
                      </span>
                    </div>
                  </div>
                  <div className="mt-3.5 pt-2 flex flex-col gap-1 border-t border-slate-200">
                    <div className="flex justify-between text-xs text-slate-600 font-['Inter']">
                      <span>Stays Settled</span>
                      <span className="text-slate-900 font-bold">{floorData.bookings}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-Time Shift Reconciliation Quick Ribbon */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Front Desk Shift Reconciliation
            </h4>
            <p className="text-xs text-slate-500 font-['Inter'] mt-0.5">
              Live audit verification & digital register balance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block font-['Inter']">
              TOTAL COLLECTED REVENUE
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-emerald-600">
              {formatINR(totalRev)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 font-['Inter'] cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print Day Book</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnerRevenue;
