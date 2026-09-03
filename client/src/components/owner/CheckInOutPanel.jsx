import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { bookingService } from '../../services/bookingService';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';
import { estimateTotal, formatDuration } from '../../utils/billingCalculator';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  User, Phone, MapPin, CreditCard, Clock, LogIn, LogOut,
  Calendar, IndianRupee, Users, Hash, CheckCircle, Sparkles
} from 'lucide-react';

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

  // Estimate billing preview if checked in
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
      title={`Room ${room?.room_number || ''} — ${isCheckedIn ? 'Guest Stay & Check-Out' : 'Confirm Check-In'}`}
      size="lg"
    >
      {loading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !booking ? (
        <div className="text-center py-10 space-y-2">
          <p className="text-base font-extrabold text-slate-900">No active stay found for this unit</p>
          <p className="text-xs text-slate-500">This room is currently available or under preparation.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Room Banner */}
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-extrabold text-white">
                Room {room.room_number} — {category.name || 'Standard Unit'}
              </p>
              <p className="text-xs font-semibold text-amber-300">
                {formatCurrency(booking.rate_per_day)} / 24-Hour Cycle • Status: <span className="uppercase font-extrabold">{booking.status}</span>
              </p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              Guest Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase w-16">Name:</span>
                <span className="font-extrabold text-slate-900 text-sm">{customer?.full_name || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase w-16">Phone:</span>
                <span className="font-semibold text-slate-800 font-mono">{customer?.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase w-16">Persons:</span>
                <span className="font-semibold text-slate-800">{booking.no_of_persons} Guest(s) (Age: {customer?.age || '—'})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase w-16">Aadhar:</span>
                <span className="font-semibold text-slate-800 font-mono">{customer?.aadhar_number || '—'}</span>
              </div>
              {customer?.address && (
                <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400 font-bold uppercase w-16">Address:</span>
                  <span className="font-medium text-slate-700">{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Stay Timeline & Slabs
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Reservation Date
                </span>
                <span className="font-extrabold text-slate-800 font-mono">{booking.booking_date}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-200/60">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                  Check-In Timestamp
                </span>
                <span className={`font-mono font-extrabold ${booking.check_in ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {booking.check_in ? formatDateTime(booking.check_in) : 'Not recorded yet'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-200/60">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  Check-Out Timestamp
                </span>
                <span className="font-mono font-bold text-slate-500">
                  {booking.check_out ? formatDateTime(booking.check_out) : 'Pending Checkout'}
                </span>
              </div>
            </div>
          </div>

          {/* Billing Preview Pill */}
          {billingPreview && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-amber-600" />
                  Live Billing Estimation
                </span>
                <span className="text-base font-black text-amber-950">
                  {formatCurrency(billingPreview.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                <span>Duration so far: {formatDuration(booking.check_in, new Date().toISOString())}</span>
                <span>{billingPreview.days} Billable Slab(s)</span>
              </div>
              <p className="text-[10px] text-amber-700/80 italic pt-1 border-t border-amber-200">
                * Enforcing 24-hour slab ceiling rule: ceil(duration / 24h). Final amount computed on checkout.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            {isBooked && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Record Check-In</span>
              </button>
            )}

            {isCheckedIn && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Check-Out Guest & Bill</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
