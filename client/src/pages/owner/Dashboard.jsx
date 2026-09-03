import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResidency } from '../../context/ResidencyContext';
import { bookingService } from '../../services/bookingService';
import { formatCurrency } from '../../utils/dateFormat';

export default function Dashboard() {
  const { profile } = useAuth();
  const { floors } = useResidency();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const data = await bookingService.getTodayStats();
      setStats(data);
    } catch (err) {
      console.warn('Stats fetch warning — using local defaults');
    }
  }

  // Room calculations
  const totalRooms = floors.reduce((sum, f) => sum + (f.stats?.totalRooms || (f.rooms?.length || 0)), 0);
  const occupiedRooms = floors.reduce((sum, f) => sum + (f.stats?.occupiedRooms || (f.rooms?.filter(r => r.status === 'occupied').length || 0)), 0);
  const availableRooms = Math.max(0, totalRooms - occupiedRooms);
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Today's Movements — derived from actual room data + checkout audit ledger
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // Count today's check-ins from currently occupied rooms
  const allRooms = floors.flatMap((f) => f.rooms || []);
  const todayCheckIns = allRooms.filter((r) => {
    if (r.status !== 'occupied' || !r.active_booking?.check_in) return false;
    return new Date(r.active_booking.check_in) >= todayStart;
  }).length;

  // Count today's check-outs from the audit ledger stored in localStorage
  const auditLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
  const todayCheckOuts = auditLedger.filter((log) => {
    if (!log.check_out) return false;
    return new Date(log.check_out) >= todayStart;
  }).length;

  // Use local counts, fallback to API stats
  const totalCheckInsToday = todayCheckIns || (stats?.today_check_ins ?? 0);
  const totalCheckOutsToday = todayCheckOuts || (stats?.today_check_outs ?? 0);

  // Compute Total Revenue Today Calculated:
  // 1. Backend API today's revenue stats
  const apiTodayRevenue = Number(stats?.today_revenue) || 0;

  // 2. Local audit ledger checked-out revenue today
  const todayRevenueLocal = auditLedger.reduce((sum, log) => {
    if (!log.check_out) return sum;
    const checkOutDate = new Date(log.check_out);
    if (isNaN(checkOutDate.getTime()) || checkOutDate < todayStart) return sum;
    return sum + (Number(log.total_amount) || 0);
  }, 0);

  // 3. Occupied rooms revenue checked in today (or currently active)
  const activeOccupiedRevenue = allRooms.reduce((sum, r) => {
    if (r.status === 'occupied' && r.active_booking) {
      const b = r.active_booking;
      const roomTotal = Number(b.total_amount) || (Number(b.rate_per_day || r.room_categories?.base_price || 1000) * Number(b.no_of_days || 1));
      return sum + roomTotal;
    }
    return sum;
  }, 0);

  // Grand Total Revenue Today
  const totalRevenueTodayCalculated = apiTodayRevenue + todayRevenueLocal + activeOccupiedRevenue;

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-lg px-space-lg">
      {/* Top Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 mt-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              Sridevi Residency Executive Desk
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">
            Welcome back, {profile?.full_name || 'Front Desk'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Live residency metrics, room occupancy ratios, and strict 24-hour billing cycle controls.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <Link
            to="/rooms"
            className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg hover:bg-on-secondary-container transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            <span>Open Room Status Grid</span>
          </Link>
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
                Total Revenue Today Calculated
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-xs">
                <span className="font-display-sm text-display-sm text-on-surface font-tabular-numeric tracking-tight">
                  {formatCurrency(totalRevenueTodayCalculated)}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="mt-space-md flex items-end justify-between pt-space-xs">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Checkouts & Advance Receipts
            </span>
            <span className="font-label-md text-label-md text-on-tertiary-container font-semibold">
              24h Slab Cycle Policy
            </span>
          </div>
        </div>

        {/* KPI 2: Available Units */}
        <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-on-tertiary-container" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Available Units
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-xs">
                <span className="font-display-sm text-display-sm text-on-surface font-tabular-numeric tracking-tight">
                  {availableRooms}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  of {totalRooms || 16} Total
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-tertiary-container">
              <span className="material-symbols-outlined text-[18px]">king_bed</span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col gap-space-xxs pt-space-xs">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Ready for immediate check-in</span>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div
                className="bg-on-tertiary-container h-full rounded-full"
                style={{ width: `${totalRooms ? (availableRooms / totalRooms) * 100 : 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Occupancy Rate */}
        <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Active Occupancy Ratio
              </span>
              <div className="flex items-baseline gap-space-xs mt-space-xs">
                <span className="font-display-sm text-display-sm text-on-surface font-tabular-numeric tracking-tight">
                  {occupancyRate}%
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  ({occupiedRooms} Rooms)
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined text-[18px]">meeting_room</span>
            </div>
          </div>
          <div className="mt-space-md flex flex-col gap-space-xxs pt-space-xs">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Active stays currently in progress</span>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div
                className="bg-error h-full rounded-full"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4: Movements */}
        <div className="relative bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container" />
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Today's Movements
              </span>
              <div className="flex items-center gap-space-md mt-space-xs font-tabular-numeric">
                <span className="font-display-sm text-display-sm text-on-tertiary-container">
                  +{totalCheckInsToday}
                </span>
                <span className="text-outline-variant font-label-md">•</span>
                <span className="font-display-sm text-display-sm text-error">
                  -{totalCheckOutsToday}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            </div>
          </div>
          <div className="mt-space-md flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-space-xs">
            <span>Check-Ins: {totalCheckInsToday}</span>
            <span>Check-Outs: {totalCheckOutsToday}</span>
          </div>
        </div>
      </div>

      {/* Floor Overview Progress Cards */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-[24px]">apartment</span>
            <div className="flex flex-col">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Floor-Wise Occupancy Ratios
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Live level capacity distribution
              </span>
            </div>
          </div>
          <Link
            to="/rooms"
            className="font-label-md text-label-md text-secondary hover:underline flex items-center gap-space-xxs"
          >
            <span>View All Floors</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {floors.map((floor) => {
            const fRooms = floor.rooms || [];
            const fOccupied = fRooms.filter((r) => r.status === 'occupied').length;
            const fAvailable = fRooms.filter((r) => r.status === 'available').length;
            const fPct = fRooms.length > 0 ? Math.round((fOccupied / fRooms.length) * 100) : 0;

            return (
              <div
                key={floor.id}
                className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/60 flex flex-col gap-space-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    {floor.floor_name}
                  </span>
                  <span className="px-space-xs py-0.5 rounded font-label-md text-label-md bg-surface-container-lowest text-on-surface">
                    {fPct}% Occupied
                  </span>
                </div>

                <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      fPct > 80 ? 'bg-error' : fPct > 40 ? 'bg-secondary' : 'bg-on-tertiary-container'
                    }`}
                    style={{ width: `${fPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between font-label-md text-label-md">
                  <span className="text-on-tertiary-container font-semibold">
                    {fAvailable} Available
                  </span>
                  <span className="text-error font-semibold">
                    {fOccupied} Occupied
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <Link
          to="/rooms"
          className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-space-md group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-secondary text-[28px] group-hover:scale-110 transition-transform">
              grid_view
            </span>
            <span className="px-space-xs py-0.5 rounded font-label-md text-label-md bg-surface-container-low text-on-surface-variant">
              Live Map
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Room Management</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Floor grids, status badges & instant walk-in registration
            </p>
          </div>
          <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 group-hover:underline">
            Open Grid →
          </span>
        </Link>

        <Link
          to="/customers"
          className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-space-md group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-secondary text-[28px] group-hover:scale-110 transition-transform">
              badge
            </span>
            <span className="px-space-xs py-0.5 rounded font-label-md text-label-md bg-surface-container-low text-on-surface-variant">
              Registry
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Guest Directory</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Customer records, Aadhaar verification & repeat guest lookup
            </p>
          </div>
          <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 group-hover:underline">
            View Guests →
          </span>
        </Link>

        <Link
          to="/revenue"
          className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-space-md group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-secondary text-[28px] group-hover:scale-110 transition-transform">
              receipt_long
            </span>
            <span className="px-space-xs py-0.5 rounded font-label-md text-label-md bg-surface-container-low text-on-surface-variant">
              Billing
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Revenue Analytics</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              24-hour tariff slab billings & financial reports
            </p>
          </div>
          <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 group-hover:underline">
            Analyze Revenue →
          </span>
        </Link>

        <Link
          to="/statistics"
          className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-space-md group"
        >
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-secondary text-[28px] group-hover:scale-110 transition-transform">
              history_toggle_off
            </span>
            <span className="px-space-xs py-0.5 rounded font-label-md text-label-md bg-surface-container-low text-on-surface-variant">
              Audit
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Audit & History</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Filter stay duration, revenue history & export CSV reports
            </p>
          </div>
          <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1 group-hover:underline">
            View Audit Log →
          </span>
        </Link>
      </div>
    </div>
  );
}
