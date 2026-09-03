import { formatCurrency } from '../../utils/dateFormat';

export default function RoomCard({ room, onClick }) {
  const category = room.room_categories || {};
  const status = room.status || 'available';
  const activeBooking = room.active_booking;

  // Status configuration matching exact reference mockup
  const statusConfig = {
    occupied: {
      barClass: 'bg-error',
      pillClass: 'bg-error-container text-on-error-container',
      label: 'Occupied',
      btnText: 'Stay / Settle',
      btnIcon: 'receipt',
      btnClass: 'bg-surface-container-high hover:bg-surface-container text-on-surface',
    },
    available: {
      barClass: 'bg-on-tertiary-container',
      pillClass: 'bg-surface-container-highest text-on-tertiary-container',
      label: 'Available',
      btnText: 'Book Room +',
      btnIcon: 'add_circle',
      btnClass: 'bg-primary-container text-on-primary hover:bg-primary',
    },
    reserved: {
      barClass: 'bg-secondary',
      pillClass: 'bg-secondary-fixed text-on-secondary-fixed',
      label: 'Turnover',
      btnText: 'Mark Ready',
      btnIcon: 'done_all',
      btnClass: 'bg-secondary text-on-secondary hover:bg-on-secondary-container',
    },
  }[status] || {
    barClass: 'bg-outline',
    pillClass: 'bg-surface-container text-on-surface-variant',
    label: status,
    btnText: 'Manage',
    btnIcon: 'edit',
    btnClass: 'bg-surface-container hover:bg-surface-variant text-on-surface',
  };

  return (
    <div
      onClick={onClick}
      className="flex flex-col justify-between bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow cursor-pointer border border-surface-container-high/60"
    >
      {/* 4px Status Indicator Bar */}
      <div className={`h-1 w-full ${statusConfig.barClass}`} />

      {/* Main Content */}
      <div className="p-space-md flex flex-col gap-space-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-display-sm text-display-sm text-on-surface">
                {room.room_number}
              </span>
              <span className={`px-space-xs py-0.5 rounded font-label-md text-label-md ${statusConfig.pillClass}`}>
                {statusConfig.label}
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {category.name || 'Standard Unit'}
            </span>
          </div>

          {/* 24h Tariff Tag */}
          <span className="font-tabular-numeric text-tabular-numeric text-on-surface">
            {formatCurrency(category.base_price || 0)}
            <span className="text-body-sm text-on-surface-variant font-normal">/24h</span>
          </span>
        </div>

        {/* Dynamic Status Banner Snippet */}
        {status === 'occupied' && activeBooking ? (
          <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-space-xxs">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface truncate">
                {activeBooking.customers?.full_name || 'In-House Guest'}
              </span>
              <span className="font-label-md text-label-md text-error flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">timer</span>
                Active Stay
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              In: {activeBooking.check_in ? new Date(activeBooking.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>
        ) : status === 'reserved' ? (
          <div className="p-space-sm bg-secondary-fixed/30 rounded-lg flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-[20px] animate-spin">
              cyclone
            </span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-secondary-fixed-variant">
                Housekeeping In Progress
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Sanitizing for next guest
              </span>
            </div>
          </div>
        ) : (
          <div className="p-space-sm bg-surface-container-lowest border border-surface-container-low rounded-lg flex items-center gap-space-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">
                Ready For Occupancy
              </span>
              <span className="font-body-sm text-body-sm">Inspected & Sanitized</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Button */}
      <div className="px-space-md pb-space-md pt-0">
        <button
          type="button"
          className={`w-full py-space-xs px-space-sm rounded-lg transition-colors font-label-md text-label-md flex items-center justify-center gap-space-xs ${statusConfig.btnClass}`}
        >
          <span className="material-symbols-outlined text-[16px]">{statusConfig.btnIcon}</span>
          <span>{statusConfig.btnText}</span>
        </button>
      </div>
    </div>
  );
}
