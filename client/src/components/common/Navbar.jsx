import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useResidency } from '../../context/ResidencyContext';
import LiveClock from './LiveClock';
import BookingForm from '../owner/BookingForm';

export default function Navbar({ mobileSidebarOpen, setMobileSidebarOpen }) {
  const { profile, signOut } = useAuth();
  const { floors, refreshData } = useResidency();
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Live room occupancy summary
  const totalRooms = floors.reduce((sum, f) => sum + (f.stats?.totalRooms || (f.rooms?.length || 0)), 0);
  const occupiedRooms = floors.reduce((sum, f) => sum + (f.stats?.occupiedRooms || (f.rooms?.filter(r => r.status === 'occupied').length || 0)), 0);
  const availableRooms = Math.max(0, totalRooms - occupiedRooms);

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-sidebar-width right-0 h-header-height bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg">
        {/* Left: Mobile Toggle & Clock & Room Pills */}
        <div className="flex items-center gap-space-md">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <LiveClock />

          <div className="hidden xl:flex items-center gap-space-xs">
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-low text-on-surface font-label-md text-label-md">
              {totalRooms || 16} Total Rooms
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-highest text-on-tertiary-container font-label-md text-label-md flex items-center gap-space-xxs">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              {availableRooms} Available
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-space-xxs">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              {occupiedRooms} Occupied
            </div>
          </div>
        </div>

        {/* Right: New Booking CTA & User Profile */}
        <div className="flex items-center gap-space-md">
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg hover:bg-on-secondary-container transition-colors shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>New Booking</span>
          </button>

          {/* Profile & Logout */}
          <div className="flex items-center gap-space-sm pl-space-sm border-l border-surface-container-high">
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-label-lg text-label-lg text-on-surface">
                {profile?.full_name || 'Front Desk'}
              </span>
              <span className="font-label-md text-label-md text-secondary font-bold capitalize">
                {profile?.role === 'admin' ? '⚡ System Admin' : '🏨 Owner / Reception'}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {profile?.role === 'admin' ? 'A' : 'O'}
            </div>

            <button
              onClick={signOut}
              className="p-space-xs rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors ml-1 cursor-pointer"
              title="Sign Out"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Instant Walk-in Booking Modal */}
      {showBookingModal && (
        <BookingForm
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            refreshData();
            setShowBookingModal(false);
          }}
        />
      )}
    </>
  );
}
