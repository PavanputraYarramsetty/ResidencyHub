import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { bookingService } from '../../services/bookingService';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';
import { estimateTotal, formatDuration } from '../../utils/billingCalculator';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CheckInOutPanel({ isOpen, onClose, room, onSuccess }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && room?.id) fetchActiveBooking();
  }, [isOpen, room?.id]);

  async function fetchActiveBooking() {
    try {
      setLoading(true);
      const { data } = await api.get(`/rooms/${room.id}`);
      setBooking(data.active_booking);
    } catch (err) {
      console.warn('Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!booking) return;
    try {
      setActionLoading(true);
      await bookingService.recordCheckIn(booking.id);
      toast.success(`Check-in recorded for Room ${room.room_number} ✅`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!booking) return;
    try {
      setActionLoading(true);
      const result = await bookingService.recordCheckOut(booking.id);
      const { billing } = result;
      toast.success(
        `Room ${room.room_number} checked out! ${billing.billableDays} day(s) — ${formatCurrency(billing.totalAmount)} ✅`,
        { duration: 6000 }
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setActionLoading(false);
    }
  }

  const customer = booking?.customers;
  const category = room?.room_categories || {};
  const isCheckedIn = booking?.status === 'checked_in';
  const isBooked = booking?.status === 'booked';

  let billingPreview = null;
  if (isCheckedIn && booking?.check_in) {
    billingPreview = estimateTotal(
      Number(booking.rate_per_day),
      booking.check_in,
      new Date().toISOString()
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Room ${room?.room_number || ''} — Guest Stay & Settlement`}
      subtitle={`Category: ${category.name || 'Standard'} • Rate: ${formatCurrency(booking?.rate_per_day || category.base_price || 0)}/24h`}
      size="lg"
    >
      {loading ? (
        <div className="space-y-4 py-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : !booking ? (
        <div className="text-center py-10 space-y-2">
          <p className="font-headline-sm text-headline-sm text-on-surface">No active stay found for this room</p>
          <p className="text-body-sm text-on-surface-variant">Unit is vacant or under housekeeping.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-space-md">
          {/* Guest Identity Card */}
          <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-container-high/60 flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">person</span>
              Guest Identification
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-body-sm">
              <div>
                <span className="text-on-surface-variant font-medium">Full Name: </span>
                <strong className="text-on-surface">{customer?.full_name || '—'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Phone: </span>
                <strong className="font-tabular-numeric text-on-surface">{customer?.phone || '—'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Govt ID: </span>
                <strong className="font-tabular-numeric text-on-surface">{customer?.aadhar_number || '—'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Occupancy: </span>
                <strong className="text-on-surface">{booking.no_of_persons} Person(s)</strong>
              </div>
            </div>
          </div>

          {/* Timeline Box */}
          <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-container-high/60 flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              Stay Timeline & Slabs
            </span>
            <div className="flex flex-col gap-space-xxs text-body-sm font-tabular-numeric">
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Reservation Date:</span>
                <span className="text-on-surface font-semibold">{booking.booking_date}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-surface-container-high/40">
                <span className="text-on-surface-variant">Check-In Timestamp:</span>
                <span className="text-on-tertiary-container font-bold">
                  {booking.check_in ? formatDateTime(booking.check_in) : 'Pending Record'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Billing Preview */}
          {billingPreview && (
            <div className="p-space-md rounded-xl bg-primary-container text-on-primary flex flex-col gap-space-xs shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-label-md text-surface-variant uppercase">Live Billing Estimation</span>
                <span className="font-tabular-numeric text-headline-sm text-secondary-fixed font-bold">
                  {formatCurrency(billingPreview.total)}
                </span>
              </div>
              <div className="flex justify-between text-body-sm text-surface-variant">
                <span>Elapsed: {formatDuration(booking.check_in, new Date().toISOString())}</span>
                <span>{billingPreview.days} Billable Slab(s) (24h rule)</span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="px-space-xl py-space-md -mx-space-xl -mb-space-xl bg-surface-container-low flex items-center justify-end gap-space-sm border-t border-surface-container-high/60 mt-space-sm">
            <button
              onClick={onClose}
              className="px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-colors border border-surface-container-high/60 cursor-pointer"
              type="button"
            >
              Close
            </button>

            {isBooked && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-space-xl py-space-sm rounded-lg bg-on-tertiary-container text-on-tertiary hover:opacity-90 font-label-lg text-label-lg flex items-center gap-space-xs shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Record Check-In</span>
              </button>
            )}

            {isCheckedIn && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-space-xl py-space-sm rounded-lg bg-error text-on-error hover:bg-on-error-container font-label-lg text-label-lg flex items-center gap-space-xs shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Record Check-Out & Bill</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
