import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatINR } from '../../utils/currencyUtils';
import { calculateStayDuration } from '../../utils/billingUtils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function CheckoutConfirmationDialog({
  isOpen,
  onClose,
  room,
  booking,
  onConfirmCheckout,
}) {
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [discountAmount, setDiscountAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !room) return null;

  const activeBooking = booking || room.active_booking;
  const customer = activeBooking?.customers || { full_name: 'Guest', phone: '—' };
  const ratePerDay = activeBooking?.rate_per_day || room.room_categories?.base_price || 1500;
  const checkInTime = activeBooking?.check_in || activeBooking?.check_in_at || new Date().toISOString();

  const stay = calculateStayDuration(checkInTime, new Date());
  const grossAmount = stay.billingUnits * ratePerDay;
  const advance = Number(activeBooking?.advance_amount || 0);
  const discount = Number(discountAmount || 0);
  const netTotal = Math.max(0, grossAmount - discount);
  const balanceToCollect = Math.max(0, netTotal - advance);

  async function handleCheckout() {
    setSubmitting(true);
    try {
      await onConfirmCheckout({
        bookingId: activeBooking?.id,
        roomId: room.id,
        roomNumber: room.room_number,
        categoryName: room.room_categories?.name || 'Standard',
        customerName: customer.full_name,
        phone: customer.phone,
        checkIn: checkInTime,
        checkOut: new Date().toISOString(),
        billableDays: stay.billingUnits,
        grossAmount,
        discountAmount: discount,
        netTotal,
        paymentMode,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Guest Checkout" maxWidth="max-w-lg">
      <div className="space-y-4 text-xs">
        {/* Warning banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-amber-900">Checkout Confirmation</h5>
            <p className="text-amber-800 mt-0.5">
              Are you sure you want to checkout <span className="font-bold text-slate-900">{customer.full_name}</span> from{' '}
              <span className="font-bold text-slate-900">Room {room.room_number}</span>?
            </p>
          </div>
        </div>

        {/* 24-hr Stay Billing Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Stay Duration:</span>
            <span className="font-bold text-slate-900">{stay.durationText}</span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Billable Stay Units (24h Rule):</span>
            <span className="font-bold text-blue-600 font-mono">{stay.billingUnits} × 24h stay</span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Gross Total:</span>
            <span className="font-extrabold text-slate-900">{formatINR(grossAmount)}</span>
          </div>

          {advance > 0 && (
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-emerald-700 font-semibold">
              <span>Advance Paid:</span>
              <span className="font-bold font-mono">- {formatINR(advance)}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-sm font-bold">
            <span className="text-slate-900">Final Balance to Collect:</span>
            <span className="text-emerald-600 font-extrabold font-['Plus_Jakarta_Sans']">{formatINR(balanceToCollect)}</span>
          </div>
        </div>

        {/* Settlement parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
              Payment Method
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
            >
              <option value="UPI">UPI / QR Code</option>
              <option value="Cash">Cash</option>
              <option value="Card">Debit / Credit Card</option>
            </select>
          </div>

          <Input
            label="Discount (₹)"
            type="number"
            placeholder="0"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCheckout} isLoading={submitting}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Complete Checkout & Release Room
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CheckoutConfirmationDialog;
