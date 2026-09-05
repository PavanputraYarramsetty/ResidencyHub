import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatINR } from '../../utils/currencyUtils';
import { calculateStayDuration } from '../../utils/billingUtils';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export function CheckoutConfirmationDialog({
  isOpen,
  onClose,
  room,
  booking,
  onConfirmCheckout,
}) {
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [discountPercent, setDiscountPercent] = useState('');
  const [excuseOvertime, setExcuseOvertime] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !room) return null;

  const activeBooking = booking || room.active_booking;
  const rawCustomer = activeBooking?.customers;
  const customerName = (rawCustomer?.full_name && rawCustomer.full_name !== 'Guest')
    ? rawCustomer.full_name
    : (activeBooking?.full_name || room.full_name || 'Guest');
  const customerPhone = (rawCustomer?.phone && rawCustomer.phone !== '—')
    ? rawCustomer.phone
    : (activeBooking?.phone || room.phone || '—');
  const ratePerDay = activeBooking?.rate_per_day || room.room_categories?.base_price || 1500;
  const checkInTime = activeBooking?.check_in || activeBooking?.check_in_at || new Date().toISOString();

  const stay = calculateStayDuration(checkInTime, new Date());
  const calculatedUnits = stay.billingUnits;
  const isOvertime = stay.totalHours > 24;

  const billableDays = (isOvertime && excuseOvertime) ? Math.max(1, calculatedUnits - 1) : calculatedUnits;
  const grossAmount = billableDays * ratePerDay;
  const advance = Number(activeBooking?.advance_amount || 0);

  const percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountRupees = Math.round((grossAmount * percent) / 100);
  const netTotal = Math.max(0, grossAmount - discountRupees);
  const balanceToCollect = Math.max(0, netTotal - advance);

  async function handleCheckout() {
    setSubmitting(true);
    try {
      await onConfirmCheckout({
        bookingId: activeBooking?.id,
        roomId: room.id,
        roomNumber: room.room_number,
        categoryName: room.room_categories?.name || 'Standard',
        customerName,
        phone: customerPhone,
        checkIn: checkInTime,
        checkOut: new Date().toISOString(),
        billableDays,
        grossAmount,
        discountPercent: percent,
        discountAmount: discountRupees,
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
      <div className="space-y-4 text-xs font-['Inter']">
        {/* Warning banner */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-amber-900">Checkout Confirmation</h5>
            <p className="text-amber-800 mt-0.5">
              Checking out <span className="font-bold text-slate-900">{customerName}</span> ({customerPhone}) from{' '}
              <span className="font-bold text-slate-900">Room {room.room_number}</span>.
            </p>
          </div>
        </div>

        {/* Overtime Waive Option */}
        {isOvertime && (
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-blue-950">Overtime Detected ({stay.durationText})</p>
                <p className="text-[11px] text-blue-700">Calculated stay exceeds 24 hours ({calculatedUnits} days billable).</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={excuseOvertime}
                onChange={(e) => setExcuseOvertime(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">Excuse Overtime</span>
            </label>
          </div>
        )}

        {/* 24-hr Stay Billing Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Stay Duration:</span>
            <span className="font-bold text-slate-900">{stay.durationText} ({stay.totalHours} hrs)</span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Billable Units (24h Rule):</span>
            <span className="font-bold text-blue-600 font-mono">
              {billableDays} × 24h cycle {excuseOvertime && <span className="text-[10px] text-emerald-600 font-semibold">(1 Day Waived)</span>}
            </span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Gross Total:</span>
            <span className="font-extrabold text-slate-900">{formatINR(grossAmount)}</span>
          </div>

          {percent > 0 && (
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-rose-600 font-medium">
              <span>Discount ({percent}%):</span>
              <span className="font-bold font-mono">- {formatINR(discountRupees)}</span>
            </div>
          )}

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
            <label className="block text-xs font-bold text-slate-700 mb-1">
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Discount (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 10"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant="success" onClick={handleCheckout} isLoading={submitting}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Complete Checkout & Release Room
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CheckoutConfirmationDialog;
