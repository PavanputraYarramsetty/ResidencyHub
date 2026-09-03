import { Link } from 'react-router-dom';
import { useResidency } from '../../context/ResidencyContext';

export default function AdminDashboard() {
  const { floors } = useResidency();
  const totalRooms = floors.reduce((sum, f) => sum + (f.rooms?.length || 0), 0);

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-lg px-space-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 mt-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              System Administration
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-space-xxs">
              <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">verified</span>
              Full Privileges
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">
            Admin Configuration Overview
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Property level management, room category pricing slabs, and privilege controls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Total Floors</span>
            <span className="font-display-sm text-display-sm text-on-surface font-tabular-numeric">{floors.length}</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">apartment</span>
        </div>

        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Configured Units</span>
            <span className="font-display-sm text-display-sm text-on-surface font-tabular-numeric">{totalRooms}</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">king_bed</span>
        </div>

        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">System Health</span>
            <span className="font-headline-sm text-headline-sm text-on-tertiary-container font-bold">Optimal</span>
          </div>
          <span className="material-symbols-outlined text-on-tertiary-container text-[28px]">check_circle</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <Link
          to="/admin/floors"
          className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-space-md">
            <span className="material-symbols-outlined text-secondary text-[32px]">apartment</span>
            <div className="flex flex-col">
              <h3 className="font-headline-md text-headline-md text-on-surface">Manage Building Levels</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Add or reorder floors</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>

        <Link
          to="/admin/rooms"
          className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-space-md">
            <span className="material-symbols-outlined text-secondary text-[32px]">king_bed</span>
            <div className="flex flex-col">
              <h3 className="font-headline-md text-headline-md text-on-surface">Manage Rooms & Tariff Slabs</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Configure room inventory and rates</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}
