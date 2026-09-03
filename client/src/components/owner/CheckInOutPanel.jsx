import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { bookingService } from '../../services/bookingService';
import { formatDateTime, formatCurrency, toISOLocal } from '../../utils/dateFormat';
import { estimateTotal, formatDuration } from '../../utils/billingCalculator';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  User, Phone, MapPin, CreditCard, Clock, LogIn, LogOut,
  Calendar, IndianRupee, Users, Hash, CheckCircle
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
      console.error('Failed to fetch booking:', err);
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
      title={`Room ${room?.room_number || ''} — ${isCheckedIn ? 'Check Out' : 'Check In'}`}
      size="lg"
    >
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
        </div>
      ) : !booking ? (
        <div className="text-center py-8 text-surface-400">
          <p className="font-medium">No active booking found for this room</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Room info banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-room-occupied/10 border border-room-occupied/20">
            <div className={`p-2 rounded-lg ${isCheckedIn ? 'bg-room-occupied/20' : 'bg-room-reserved/20'}`}>
              <CreditCard className={`w-5 h-5 ${isCheckedIn ? 'text-room-occupied' : 'text-room-reserved'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-800">
                Room {room.room_number} — {category.name}
              </p>
              <p className="text-xs text-surface-500">
                ₹{Number(booking.rate_per_day || 0).toLocaleString()} per day • Status: {booking.status}
              </p>
            </div>
          </div>

          {/* Customer details (read-only) */}
          <div className="bg-surface-50 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-surface-700 flex items-center gap-2">
              <User className="w-4 h-4" /> Customer Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-surface-600">
                <User className="w-4 h-4 text-surface-400" />
                <span className="font-medium">{customer?.full_name || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-surface-600">
                <Phone className="w-4 h-4 text-surface-400" />
                <span>{customer?.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-surface-600">
                <Users className="w-4 h-4 text-surface-400" />
                <span>{booking.no_of_persons} person(s), Age: {customer?.age || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-surface-600">
                <Hash className="w-4 h-4 text-surface-400" />
                <span>Aadhar: {customer?.aadhar_number || '—'}</span>
              </div>
              {customer?.address && (
                <div className="sm:col-span-2 flex items-start gap-2 text-surface-600">
                  <MapPin className="w-4 h-4 text-surface-400 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking timestamps */}
          <div className="bg-surface-50 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-surface-700 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Booking Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-surface-500">
                  <Calendar className="w-4 h-4" /> Booking Date
                </span>
                <span className="font-medium text-surface-700">{booking.booking_date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-surface-500">
                  <LogIn className="w-4 h-4" /> Check-In
                </span>
                <span className={`font-medium ${booking.check_in ? 'text-green-600' : 'text-surface-400'}`}>
                  {booking.check_in ? formatDateTime(booking.check_in) : 'Not checked in'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-surface-500">
                  <LogOut className="w-4 h-4" /> Check-Out
                </span>
                <span className="font-medium text-surface-400">Pending</span>
              </div>
            </div>
          </div>

          {/* Billing preview (only if checked in) */}
          {billingPreview && (
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gold-800 flex items-center gap-2 mb-2">
                <IndianRupee className="w-4 h-4" /> Billing Preview (Live)
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-gold-700">
                  Stay so far: {formatDuration(booking.check_in, new Date().toISOString())}
                </span>
                <span className="font-bold text-gold-900">
                  {billingPreview.days} day(s) → {formatCurrency(billingPreview.total)}
                </span>
              </div>
              <p className="text-xs text-gold-600 mt-1">
                * Based on 24-hour slab rule. Final amount computed at checkout.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
            >
              Close
            </button>

            {isBooked && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Record Check-In
              </button>
            )}

            {isCheckedIn && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-room-occupied to-red-600 shadow-lg shadow-red-500/25 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Record Check-Out & Bill
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
