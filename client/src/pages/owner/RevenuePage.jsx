import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

const MOCK_REVENUE_ITEMS = [];

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30days');
  const [invoiceItem, setInvoiceItem] = useState(null);

  useEffect(() => {
    fetchRevenue();
  }, []);

  async function fetchRevenue() {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings/revenue');
      const localLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
      const combined = [...localLedger, ...(data || [])];
      setRevenueData(combined.length > 0 ? combined : MOCK_REVENUE_ITEMS);
    } catch (err) {
      const localLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
      setRevenueData(localLedger.length > 0 ? localLedger : MOCK_REVENUE_ITEMS);
    } finally {
      setLoading(false);
    }
  }

  // Derived calculations
  const totalGrossRevenue = revenueData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const completedStaysCount = revenueData.length;
  const avgRevenuePerStay = completedStaysCount > 0 ? Math.round(totalGrossRevenue / completedStaysCount) : 0;

  function handleExportReport() {
    if (!revenueData.length) return toast.error('No settlement data to export');
    const headers = ['Booking ID', 'Room #', 'Guest', 'Check In', 'Check Out', 'Billable Days', 'Total Amount'];
    const rows = revenueData.map((b) => [
      b.id,
      b.rooms?.room_number || '',
      `"${b.customers?.full_name || ''}"`,
      formatDateTime(b.check_in),
      formatDateTime(b.check_out),
      b.billable_days || 1,
      b.total_amount || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sridevi_Residency_Revenue_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Revenue report exported! 📊');
  }

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-xl px-space-lg">
      {/* Top Command & Filter Deck */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg pt-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs text-secondary font-label-md uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">finance_mode</span>
            <span>Executive Ledger • Fiscal Audit</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            Revenue & 24-Hour Billing Analytics
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Financial performance, checkout settlement audits, and room occupancy yields across standard 24-hour tariff cycles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Segmented Filter */}
          <div className="flex items-center bg-surface-container p-space-xxs rounded-xl shadow-inner">
            {['today', '7days', '30days'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                  timeFilter === tf
                    ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                {tf === 'today' ? 'Today' : tf === '7days' ? 'Past 7 Days' : 'Past 30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg font-label-lg text-label-lg shadow-sm border border-surface-container-high transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">file_download</span>
            <span>Export Tax Report</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Executive KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* KPI 1: Gross Revenue */}
        <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Total Gross Revenue
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-xs">
                <span className="font-display-sm text-display-sm text-on-surface font-tabular-numeric tracking-tight">
                  {formatCurrency(totalGrossRevenue)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-xxs px-space-xs py-space-xxs rounded bg-surface-container-highest text-on-tertiary-container font-tabular-numeric text-body-sm">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Live Synced</span>
            </div>
          </div>
          <div className="mt-space-md flex items-end justify-between pt-space-xs">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-on-surface-variant">settled stays count</span>
              <span className="font-label-md text-label-md text-on-surface font-tabular-numeric">
                {completedStaysCount} Checkouts
              </span>
            </div>
            <svg className="w-20 h-8 text-secondary" fill="none" viewBox="0 0 100 36">
              <path d="M0 28 L15 24 L30 29 L45 18 L60 21 L75 9 L90 14 L100 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* KPI 2: 24h Slab Billings */}
        <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                24-Hour Slab Billings
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-xs">
                <span className="font-display-sm text-display-sm text-on-surface font-tabular-numeric tracking-tight">
                  {completedStaysCount}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Completed Stays</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">timelapse</span>
            </div>
          </div>
          <div className="mt-space-md flex items-center justify-between pt-space-xs">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Average Per Stay</span>
              <span className="font-tabular-numeric text-tabular-numeric text-on-surface font-semibold">
                {formatCurrency(avgRevenuePerStay)} / 24h
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Occupancy Rate */}
        <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-on-tertiary-container" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Settlement Status
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-xs">
                <span className="font-display-sm text-display-sm text-on-tertiary-container font-tabular-numeric tracking-tight">
                  100% Paid
                </span>
              </div>
            </div>
            <div className="px-space-xs py-space-xxs rounded bg-surface-container-high text-on-surface font-label-md text-label-md">
              Ledger Active
            </div>
          </div>
          <div className="mt-space-md flex flex-col gap-space-xxs pt-space-xs">
            <div className="flex justify-between font-body-sm text-body-sm">
              <span className="text-on-surface-variant">Policy: <strong className="text-on-surface font-tabular-numeric">Strict 24h Cycle</strong></span>
              <span className="text-on-tertiary-container font-label-md font-semibold">Verified</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-on-tertiary-container h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* KPI 4: Cash vs Digital Split */}
        <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Settlement Modes
              </span>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <span className="font-headline-md text-headline-md text-on-surface font-tabular-numeric">UPI & Cash</span>
              </div>
            </div>
          </div>
          <div className="mt-space-md flex flex-col gap-space-xxs pt-space-xs">
            <div className="flex justify-between font-label-md text-label-md">
              <span className="text-on-surface font-tabular-numeric">Digital QR / POS</span>
              <span className="text-on-surface-variant font-tabular-numeric">Cash Desk</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex">
              <div className="bg-secondary h-full" style={{ width: '50%' }} />
              <div className="bg-primary-container h-full" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Checkout & 24-Hour Settlement Ledger Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col">
        <div className="p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest border-b border-surface-container-high/60">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-md text-headline-md text-on-surface">Recent Checkout & Settlement Log</h2>
              <span className="px-space-xs py-space-xxs rounded bg-surface-container-high text-on-surface font-label-md text-label-md">
                Live Audit
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Detailed calculations of 24h cycle billings, stay durations, and collection modes
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left font-body-md text-body-md text-on-surface">
            <thead className="bg-surface-container text-on-surface-variant font-label-md text-label-md uppercase tracking-wider border-b border-surface-container-high/60">
              <tr>
                <th className="py-space-sm px-space-lg">Room & Category</th>
                <th className="py-space-sm px-space-lg">Guest Folio</th>
                <th className="py-space-sm px-space-lg">Stay Timestamps</th>
                <th className="py-space-sm px-space-lg text-right">Billable Slabs</th>
                <th className="py-space-sm px-space-lg text-right">Total Settled</th>
                <th className="py-space-sm px-space-lg text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading settlement ledger...
                  </td>
                </tr>
              ) : revenueData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    No completed checkout settlements recorded yet.
                  </td>
                </tr>
              ) : (
                revenueData.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-md px-space-lg">
                      <div className="flex items-center gap-space-sm">
                        <span className="font-tabular-numeric font-bold text-headline-sm text-on-surface">
                          Room {item.rooms?.room_number || 'Unit'}
                        </span>
                        <span className="px-space-xs py-space-xxs rounded bg-surface-container text-on-surface font-label-md text-label-md">
                          {item.rooms?.room_categories?.name || 'Standard'}
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-lg">
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface">
                          {item.customers?.full_name || 'Guest'}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {item.customers?.phone || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-lg">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface">
                          In: {formatDateTime(item.check_in)}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Out: {formatDateTime(item.check_out)}
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-lg text-right font-tabular-numeric font-bold">
                      {item.billable_days || 1} Slab(s) (24h)
                    </td>
                    <td className="py-space-md px-space-lg text-right font-tabular-numeric text-headline-sm text-secondary font-bold">
                      {formatCurrency(item.total_amount || 0)}
                    </td>
                    <td className="py-space-md px-space-lg text-center">
                      <div className="flex items-center justify-center gap-space-xs">
                        <button
                          type="button"
                          onClick={() => setInvoiceItem(item)}
                          className="px-space-md py-space-xs rounded bg-secondary text-on-secondary hover:bg-on-secondary-container font-label-md text-label-md font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">print</span>
                          <span>Generate Bill</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal for Specific Checkout Instance */}
      {invoiceItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl max-w-2xl w-full shadow-2xl border border-surface-container-high/60 flex flex-col gap-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">receipt_long</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Tax Invoice / Guest Bill
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceItem(null)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Printable Tax Invoice Content */}
            <div className="flex flex-col gap-space-lg p-space-md bg-white text-slate-900 border border-slate-200 rounded-xl font-sans" id="revenue-printable-invoice">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-space-md border-slate-200">
                <div className="flex flex-col">
                  <h1 className="font-display-sm text-display-sm text-slate-950 font-bold">
                    SRIDEVI RESIDENCY
                  </h1>
                  <span className="text-xs font-semibold text-slate-500">LODGE & HOTEL MANAGEMENT</span>
                  <span className="text-xs text-slate-500">Main Road, Rajahmundry, AP • GSTIN: 37AAAAA0000A1Z5</span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="font-bold text-sm text-slate-900 uppercase">OFFICIAL TAX INVOICE</span>
                  <span className="text-xs text-slate-500">Inv #: SR-INV-{invoiceItem.id?.slice(-6) || '1001'}</span>
                  <span className="text-xs text-slate-500">Date: {invoiceItem.check_out ? new Date(invoiceItem.check_out).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Particulars Grid */}
              <div className="grid grid-cols-2 gap-space-md text-xs border-b pb-space-md border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 uppercase block mb-1">Guest Particulars</span>
                  <div>Name: <strong>{invoiceItem.customers?.full_name || 'Guest'}</strong></div>
                  <div>Phone: <strong>{invoiceItem.customers?.phone || '—'}</strong></div>
                  <div>Govt ID / Aadhaar: <strong>{invoiceItem.customers?.aadhar_number || '—'}</strong></div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase block mb-1">Stay Particulars</span>
                  <div>Room Unit: <strong>Room {invoiceItem.rooms?.room_number || 'Unit'} ({invoiceItem.rooms?.room_categories?.name || 'Standard'})</strong></div>
                  <div>Check-In: <strong>{invoiceItem.check_in ? formatDateTime(invoiceItem.check_in) : '—'}</strong></div>
                  <div>Check-Out: <strong>{invoiceItem.check_out ? formatDateTime(invoiceItem.check_out) : '—'}</strong></div>
                  <div>Billable Duration: <strong>{invoiceItem.billable_days || 1} Day(s) (24h Cycle)</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold">
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Cycle Slabs</th>
                    <th className="py-2 px-3 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-sans">
                      Room {invoiceItem.rooms?.room_number} Occupancy Tariff ({invoiceItem.billable_days || 1} Day(s))
                    </td>
                    <td className="py-2 px-3 text-right">{invoiceItem.billable_days || 1} Slab(s)</td>
                    <td className="py-2 px-3 text-right font-bold">{formatCurrency(invoiceItem.total_amount || 0)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals & Sign */}
              <div className="flex items-center justify-between pt-space-md border-t border-slate-200">
                <div className="flex flex-col text-xs text-slate-500">
                  <span>Payment Mode: <strong>{invoiceItem.payment_mode || 'UPI / Cash'}</strong></span>
                  <span>Status: <strong className="text-emerald-700">SETTLED & PAID IN FULL</strong></span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-xs text-slate-400 mb-6">Authorized Signatory</span>
                  <span className="font-bold text-xs text-slate-900 border-t border-slate-300 pt-1">Sridevi Residency Front Desk</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setInvoiceItem(null)}
                className="px-space-lg py-space-xs rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-md"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-space-xl py-space-xs rounded bg-secondary text-on-secondary font-label-md font-bold hover:bg-on-secondary-container flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
