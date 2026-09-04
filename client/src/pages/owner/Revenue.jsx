import React, { useState } from 'react';
import useRevenue from '../../hooks/useRevenue';
import { formatINR } from '../../utils/currencyUtils';
import { exportToCSV } from '../../utils/exportUtils';

export function OwnerRevenue() {
  const [dateFilter, setDateFilter] = useState('month');
  const { data: revenueData } = useRevenue();

  const totalRev = revenueData?.total_revenue || 48500;
  const totalStays = revenueData?.total_bookings || 32;

  function handleDownloadPL() {
    window.print();
  }

  function handleExportCSV() {
    exportToCSV(
      [
        { Floor: 'Ground Floor', Rooms: '101, 102, 103, 104', Revenue: 24000, Utilization: '85%' },
        { Floor: 'First Floor', Rooms: '201, 202, 203, 204', Revenue: 18500, Utilization: '70%' },
        { Floor: 'Second Floor', Rooms: '301, 302', Revenue: 6000, Utilization: '50%' },
        { Floor: 'Third Floor', Rooms: '401', Revenue: 0, Utilization: '0% (Maintenance)' },
      ],
      'sridevi_residency_revenue_pnl.csv'
    );
  }

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
              <option value="month">This Month (September 2026)</option>
              <option value="prev">Previous Month (August 2026)</option>
              <option value="quarter">Current Quarter (Q3 2026)</option>
              <option value="year">Financial Year 2026-27</option>
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
              <span className="material-symbols-outlined text-xs mr-0.5">arrow_upward</span>+14.2%
            </span>
            <span className="text-slate-500 font-medium">vs last month</span>
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
                ₹1,515
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <span className="material-symbols-outlined text-2xl">query_stats</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs font-['Inter']">
            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
              ₹1,320 Avg ADR
            </span>
            <span className="text-slate-500">+ Amenities ₹195</span>
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />UPI: 61%
            </span>
            <span className="text-blue-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Cash: 29%
            </span>
            <span className="text-purple-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Cards: 10%
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
                    Revenue trend across completed stays (Sep 01 - Sep 04)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-['Inter']">
                Peak: Sep 03 (₹16,200)
              </span>
            </div>

            {/* Custom Bar Visualization */}
            <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-baseline justify-between mb-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-['Inter']">
                <span>COLLECTION DISTRIBUTION</span>
                <span>SEPTEMBER 2026 LIVE RUN</span>
              </div>

              <div className="grid grid-cols-4 gap-3 items-end h-40 pt-2 px-2">
                {/* Day 1 */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5 group cursor-pointer">
                  <span className="text-[10px] font-mono text-slate-600 font-bold group-hover:text-blue-600">₹9,800</span>
                  <div className="w-full max-w-[50px] bg-slate-200 rounded-t-lg overflow-hidden flex flex-col justify-end h-[58%]">
                    <div className="bg-blue-600 w-full h-[65%]" />
                    <div className="bg-emerald-500 w-full h-[35%]" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-['Inter']">01 Sep</span>
                </div>

                {/* Day 2 */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5 group cursor-pointer">
                  <span className="text-[10px] font-mono text-slate-600 font-bold group-hover:text-blue-600">₹11,500</span>
                  <div className="w-full max-w-[50px] bg-slate-200 rounded-t-lg overflow-hidden flex flex-col justify-end h-[68%]">
                    <div className="bg-blue-600 w-full h-[70%]" />
                    <div className="bg-emerald-500 w-full h-[30%]" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-['Inter']">02 Sep</span>
                </div>

                {/* Day 3 (Peak) */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5 group cursor-pointer">
                  <span className="text-[10px] font-mono text-emerald-600 font-extrabold">₹16,200 ★</span>
                  <div className="w-full max-w-[50px] bg-slate-200 rounded-t-lg overflow-hidden flex flex-col justify-end h-[95%]">
                    <div className="bg-blue-600 w-full h-[35%]" />
                    <div className="bg-emerald-500 w-full h-[65%]" />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold font-['Inter']">03 Sep</span>
                </div>

                {/* Day 4 (Today) */}
                <div className="flex flex-col items-center h-full justify-end gap-1.5 group cursor-pointer">
                  <span className="text-[10px] font-mono text-slate-600 font-bold group-hover:text-blue-600">₹11,000</span>
                  <div className="w-full max-w-[50px] bg-slate-200 rounded-t-lg overflow-hidden flex flex-col justify-end h-[65%]">
                    <div className="bg-blue-600 w-full h-[55%]" />
                    <div className="bg-emerald-500 w-full h-[45%]" />
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold font-['Inter']">04 Sep (Today)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Channel Tally */}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <div className="bg-emerald-50/70 p-3 rounded-xl flex flex-col border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 uppercase font-['Inter']">UPI / QR SCAN</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base text-emerald-700 font-extrabold mt-0.5">₹29,500</span>
              <span className="text-[10px] text-emerald-600 font-['Inter']">21 transactions</span>
            </div>
            <div className="bg-blue-50/70 p-3 rounded-xl flex flex-col border border-blue-100">
              <span className="text-[10px] font-bold text-blue-800 uppercase font-['Inter']">CASH REGISTER</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base text-blue-700 font-extrabold mt-0.5">₹14,000</span>
              <span className="text-[10px] text-blue-600 font-['Inter']">9 front counter</span>
            </div>
            <div className="bg-purple-50/70 p-3 rounded-xl flex flex-col border border-purple-100">
              <span className="text-[10px] font-bold text-purple-800 uppercase font-['Inter']">POS / CARDS</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base text-purple-700 font-extrabold mt-0.5">₹5,000</span>
              <span className="text-[10px] text-purple-600 font-['Inter']">2 corporate</span>
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
                4 Types
              </span>
            </div>

            {/* Category Items with Detailed Bars */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 font-['Inter']">AC Double</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans']">₹22,000</span>
                    <span className="text-[10px] text-slate-500 font-bold">45%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
                <div className="flex justify-between text-slate-500 text-[10px] font-['Inter']">
                  <span>Tariff: ₹2,000 / 24h</span>
                  <span>15 Stays Recorded</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-xs font-bold text-slate-900 font-['Inter']">AC Single</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-extrabold text-blue-600 font-['Plus_Jakarta_Sans']">₹13,500</span>
                    <span className="text-[10px] text-slate-500 font-bold">28%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '28%' }} />
                </div>
                <div className="flex justify-between text-slate-500 text-[10px] font-['Inter']">
                  <span>Tariff: ₹1,500 / 24h</span>
                  <span>9 Stays Recorded</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span className="text-xs font-bold text-slate-900 font-['Inter']">Non-AC Double</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-extrabold text-purple-600 font-['Plus_Jakarta_Sans']">₹7,200</span>
                    <span className="text-[10px] text-slate-500 font-bold">15%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '15%' }} />
                </div>
                <div className="flex justify-between text-slate-500 text-[10px] font-['Inter']">
                  <span>Tariff: ₹1,200 / 24h</span>
                  <span>5 Stays Recorded</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-slate-900 font-['Inter']">AC Triple</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-extrabold text-rose-600 font-['Plus_Jakarta_Sans']">₹5,800</span>
                    <span className="text-[10px] text-slate-500 font-bold">12%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '12%' }} />
                </div>
                <div className="flex justify-between text-slate-500 text-[10px] font-['Inter']">
                  <span>Tariff: ₹2,500 / 24h</span>
                  <span>3 Stays Recorded</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 flex items-center justify-between text-slate-500 text-xs font-['Inter'] border-t border-slate-100">
            <span>Highest Earner: <strong className="text-slate-900">Room 102 (AC Double)</strong></span>
          </div>
        </div>
      </div>

      {/* Panel 3: Revenue by Floor (Full Width Bottom Grid) */}
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
            Total Lodge Capacity: 11 Rooms
          </span>
        </div>

        {/* 4 Floors Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {/* Ground Floor */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-['Inter']">LEVEL 0</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">High Demand</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-900 mt-1.5">Ground Floor</h3>
              <p className="text-xs text-slate-500 font-['Inter']">Rooms: 101, 102, 103, 104</p>
              <div className="mt-3">
                <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-emerald-600">₹24,000</span>
                <span className="text-xs text-slate-400 font-['Inter'] block mt-0.5">49.5% of total revenue</span>
              </div>
            </div>
            <div className="mt-3.5 pt-2 flex flex-col gap-1 border-t border-slate-200">
              <div className="flex justify-between text-xs text-slate-600 font-['Inter']">
                <span>Utilization</span>
                <span className="text-emerald-700 font-bold">85%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>

          {/* First Floor */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider font-['Inter']">LEVEL 1</span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Steady</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-900 mt-1.5">First Floor</h3>
              <p className="text-xs text-slate-500 font-['Inter']">Rooms: 201, 202, 203, 204</p>
              <div className="mt-3">
                <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-slate-900">₹18,500</span>
                <span className="text-xs text-slate-400 font-['Inter'] block mt-0.5">38.1% of total revenue</span>
              </div>
            </div>
            <div className="mt-3.5 pt-2 flex flex-col gap-1 border-t border-slate-200">
              <div className="flex justify-between text-xs text-slate-600 font-['Inter']">
                <span>Utilization</span>
                <span className="text-blue-700 font-bold">70%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
          </div>

          {/* Second Floor */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-['Inter']">LEVEL 2</span>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Moderate</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-900 mt-1.5">Second Floor</h3>
              <p className="text-xs text-slate-500 font-['Inter']">Rooms: 301, 302</p>
              <div className="mt-3">
                <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-slate-900">₹6,000</span>
                <span className="text-xs text-slate-400 font-['Inter'] block mt-0.5">12.4% of total revenue</span>
              </div>
            </div>
            <div className="mt-3.5 pt-2 flex flex-col gap-1 border-t border-slate-200">
              <div className="flex justify-between text-xs text-slate-600 font-['Inter']">
                <span>Utilization</span>
                <span className="text-slate-900 font-bold">50%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-500 h-full rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
          </div>

          {/* Third Floor (Maintenance) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider font-['Inter']">LEVEL 3</span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">build</span> Maintenance
                </span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-slate-900 mt-1.5">Third Floor</h3>
              <p className="text-xs text-slate-500 font-['Inter']">Room: 401 (Penthouse Suite)</p>
              <div className="mt-3">
                <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-slate-400">₹0</span>
                <span className="text-xs text-rose-600 font-['Inter'] block mt-0.5">Renovation in progress</span>
              </div>
            </div>
            <div className="mt-3.5 pt-2 flex flex-col gap-1 border-t border-slate-200">
              <div className="flex justify-between text-xs text-slate-500 font-['Inter']">
                <span>Utilization</span>
                <span className="text-slate-400">0%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Shift Reconciliation Quick Ribbon */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Night Auditor Cash Drawer Reconciliation
            </h4>
            <p className="text-xs text-slate-500 font-['Inter'] mt-0.5">
              Handover shift register balance verified by Front Desk Owner at 11:30 PM IST
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block font-['Inter']">
              VERIFIED IN-HAND CASH
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-emerald-600">
              ₹14,000.00
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
