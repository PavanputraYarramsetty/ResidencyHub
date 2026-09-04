import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

const MOCK_AUDIT_LOGS = [];

export default function StatisticsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const { data } = await api.get('/revenue');
      const serverBookings = data?.bookings || (Array.isArray(data) ? data : []);
      const localLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
      const combined = [...localLedger, ...serverBookings];
      setLogs(combined.length > 0 ? combined : MOCK_AUDIT_LOGS);
    } catch (err) {
      const localLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
      setLogs(localLedger.length > 0 ? localLedger : MOCK_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.rooms?.room_number?.toString().includes(q) ||
      log.customers?.full_name?.toLowerCase().includes(q) ||
      log.customers?.phone?.includes(q)
    );
  });

  function handleExportAuditCSV() {
    if (!logs.length) return toast.error('No audit logs to export');
    const headers = ['Booking ID', 'Room Number', 'Guest Name', 'Phone', 'Check-In', 'Check-Out', 'Billable Days', 'Total Amount'];
    const rows = logs.map((l) => [
      l.id,
      l.rooms?.room_number || '',
      `"${l.customers?.full_name || ''}"`,
      `"${l.customers?.phone || ''}"`,
      formatDateTime(l.check_in),
      formatDateTime(l.check_out),
      l.billable_days || 1,
      l.total_amount || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sridevi_Residency_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit log exported to CSV! 📄');
  }

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-lg px-space-lg">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 mt-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              Fiscal Governance & Audit
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-space-xxs">
              <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">verified</span>
              Immutable Records
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">
            Audit Logs & Historical Stay Ledger
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Permanent record of completed stays, 24-hour tariff calculation history, and audit compliance data.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            onClick={handleExportAuditCSV}
            className="flex items-center gap-space-xs px-space-md py-space-sm bg-secondary text-on-secondary rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-on-secondary-container transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/60">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Room # or Guest Name..."
            className="w-full pl-9 pr-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container placeholder:text-on-surface-variant"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left font-body-md text-body-md text-on-surface">
            <thead className="bg-surface-container text-on-surface-variant font-label-md text-label-md uppercase tracking-wider border-b border-surface-container-high/60">
              <tr>
                <th className="py-space-sm px-space-lg">Room Unit</th>
                <th className="py-space-sm px-space-lg">Primary Guest</th>
                <th className="py-space-sm px-space-lg">Check-In Timestamp</th>
                <th className="py-space-sm px-space-lg">Check-Out Timestamp</th>
                <th className="py-space-sm px-space-lg text-right">24h Billable Slabs</th>
                <th className="py-space-sm px-space-lg text-right">Derived Bill Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    No historical audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-space-md px-space-lg font-bold text-headline-sm text-on-surface">
                      Room {log.rooms?.room_number || 'Unit'}
                    </td>
                    <td className="py-space-md px-space-lg">
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface">
                          {log.customers?.full_name || 'Guest'}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {log.customers?.phone || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-lg font-tabular-numeric text-on-surface">
                      {formatDateTime(log.check_in)}
                    </td>
                    <td className="py-space-md px-space-lg font-tabular-numeric text-on-surface">
                      {formatDateTime(log.check_out)}
                    </td>
                    <td className="py-space-md px-space-lg text-right font-tabular-numeric font-bold">
                      {log.billable_days || 1} Slab(s) (24h)
                    </td>
                    <td className="py-space-md px-space-lg text-right font-tabular-numeric text-headline-sm text-secondary font-bold">
                      {formatCurrency(log.total_amount || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
