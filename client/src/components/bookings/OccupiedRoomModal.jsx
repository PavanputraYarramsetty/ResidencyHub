import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianDateTime } from '../../utils/dateUtils';
import { calculateStayDuration } from '../../utils/billingUtils';
import { User, Phone, Clock, LogOut } from 'lucide-react';

export function OccupiedRoomModal({ isOpen, onClose, room, onTriggerCheckout }) {
  if (!isOpen || !room) return null;

  const category = room.room_categories || { name: 'Standard', base_price: 1500, max_occupancy: 2 };
  const booking = room.active_booking;
  const rawCustomer = booking?.customers;
  const customerName = (rawCustomer?.full_name && rawCustomer.full_name !== 'Guest')
    ? rawCustomer.full_name
    : (booking?.full_name && booking.full_name !== 'Guest'
      ? booking.full_name
      : (room.full_name || 'Guest'));
  const customerPhone = (rawCustomer?.phone && rawCustomer.phone !== '—')
    ? rawCustomer.phone
    : (booking?.phone && booking.phone !== '—'
      ? booking.phone
      : (room.phone || '—'));
  const customerAddress = rawCustomer?.address || booking?.address || '';
  const ratePerDay = booking?.rate_per_day || category.base_price || 1500;
  const checkInTime = booking?.check_in || booking?.check_in_at || new Date().toISOString();

  const bookedDays = Math.max(1, Number(booking?.no_of_days || booking?.billable_days || 1));
  const expectedStayHours = bookedDays * 24;
  const stay = calculateStayDuration(checkInTime, new Date());
  const effectiveUnits = Math.max(bookedDays, stay.billingUnits);
  const billAmount = effectiveUnits * ratePerDay;
  const advance = Number(booking?.advance_amount || 0);
  const balanceDue = Math.max(0, billAmount - advance);
  const isOvertime = stay.totalHours > expectedStayHours;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Occupied Stay — Room ${room.room_number}`} maxWidth="max-w-xl">
      <div className="space-y-4 text-xs font-['Inter']">
        {/* Top Status Banner */}
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h4 className="text-base font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">Room {room.room_number}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                {category.name}
              </span>
              {isOvertime && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  Overtime ({stay.durationText})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-['Inter']">
              Active Stay • Checked in {formatIndianDateTime(checkInTime)} ({bookedDays} Day{bookedDays > 1 ? 's' : ''} Booked)
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-['Inter']">Rate / 24h</span>
            <p className="text-base font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">{formatINR(ratePerDay)}</p>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-['Inter']">Guest Information</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 flex items-center gap-1.5 mb-0.5 font-medium">
                <User className="w-3.5 h-3.5 text-blue-600" /> Guest Name
              </span>
              <p className="text-sm font-bold text-slate-900">{customerName}</p>
            </div>

            <div>
              <span className="text-slate-500 flex items-center gap-1.5 mb-0.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Phone Number
              </span>
              <p className="text-sm font-mono font-bold text-slate-800">{customerPhone}</p>
            </div>

            {customerAddress && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 mb-0.5 block font-medium">Address</span>
                <p className="text-xs text-slate-700">{customerAddress}</p>
              </div>
            )}
          </div>
        </div>

        {/* 24-Hour Stay & Billing Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Elapsed Stay Duration
            </span>
            <span className="font-bold text-slate-900">{stay.durationText} ({stay.totalHours} hrs)</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Booked Stay Duration</span>
            <span className="font-bold text-slate-900">{bookedDays} Day{bookedDays > 1 ? 's' : ''} ({expectedStayHours} hrs)</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Current Billing Units</span>
            <span className="font-bold text-blue-600 font-mono">{effectiveUnits} × 24h cycle</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-600 font-medium">Gross Total</span>
            <span className="font-extrabold text-slate-900">{formatINR(billAmount)}</span>
          </div>

          {advance > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-emerald-700 font-semibold">
              <span>Advance Paid</span>
              <span className="font-bold font-mono">- {formatINR(advance)}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-sm font-bold">
            <span className="text-slate-900">Balance Due</span>
            <span className="text-emerald-600 font-extrabold font-['Plus_Jakarta_Sans']">{formatINR(balanceDue)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onClose();
              onTriggerCheckout(room, booking);
            }}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default OccupiedRoomModal;
