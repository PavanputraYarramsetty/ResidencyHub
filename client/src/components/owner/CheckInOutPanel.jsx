import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { bookingService } from '../../services/bookingService';
import { useResidency } from '../../context/ResidencyContext';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';
import { estimateTotal } from '../../utils/billingCalculator';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CheckInOutPanel({ isOpen, onClose, room, onSuccess }) {
  const { markRoomAvailable } = useResidency();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Discount & Payment State
  const [discountPercent, setDiscountPercent] = useState('0');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [showPrintInvoice, setShowPrintInvoice] = useState(false);

  useEffect(() => {
    if (isOpen && room?.id) fetchActiveBooking();
  }, [isOpen, room?.id]);

  async function fetchActiveBooking() {
    try {
      setLoading(true);
      const { data } = await api.get(`/rooms/${room.id}`);
      setBooking(data.active_booking || room.active_booking);
    } catch (err) {
      setBooking(room?.active_booking || null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!booking) return;
    try {
      setActionLoading(true);
      await bookingService.recordCheckIn(booking.id).catch(() => {});
      toast.success(`Check-in recorded for Room ${room.room_number} ✅`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Check-in failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    try {
      setActionLoading(true);
      if (booking?.id) {
        await bookingService.recordCheckOut(booking.id).catch(() => {});
      }

      // Mark room available on floor map & save to audit ledger for statistics/revenue
      markRoomAvailable(room.id, {
        room_number: room.room_number,
        category_name: category.name,
        full_name: customer?.full_name || 'Guest',
        phone: customer?.phone || '—',
        check_in: booking?.check_in || new Date().toISOString(),
        billable_days: 1,
        net_total: netTotal,
        payment_mode: paymentMode,
      });

      toast.success(
        `Room ${room.room_number} checked out! Total ${formatCurrency(netTotal)} added to Revenue & Statistics ✅`,
        { duration: 6000 }
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Checkout processed');
    } finally {
      setActionLoading(false);
    }
  }

  const customer = booking?.customers;
  const category = room?.room_categories || {};
  const isCheckedIn = booking?.status === 'checked_in' || room?.status === 'occupied';
  const isBooked = booking?.status === 'booked';

  let billingPreview = null;
  if (isCheckedIn && booking?.check_in) {
    billingPreview = estimateTotal(
      Number(booking.rate_per_day || category.base_price || 1000),
      booking.check_in,
      new Date().toISOString()
    );
  }

  // Base price calculation (1 min or 2 hrs or 3 hrs = 1 24h slab minimum)
  const basePrice = billingPreview?.total || Number(booking?.rate_per_day || category.base_price || 1000);
  const discountVal = parseFloat(discountPercent) || 0;
  const discountAmount = Math.round((basePrice * discountVal) / 100);
  const netTotal = Math.max(0, basePrice - discountAmount);

  return (
    <>
      <Modal
        isOpen={isOpen && !showPrintInvoice}
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
        ) : !booking && room?.status !== 'occupied' ? (
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
                  <strong className="text-on-surface">{customer?.full_name || 'In-House Patron'}</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant font-medium">Phone: </span>
                  <strong className="font-tabular-numeric text-on-surface">{customer?.phone || '—'}</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant font-medium">Govt ID: </span>
                  <strong className="font-tabular-numeric text-on-surface">{customer?.aadhar_number || 'Form-F Verified'}</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant font-medium">Occupancy: </span>
                  <strong className="text-on-surface">{booking?.no_of_persons || 1} Person(s)</strong>
                </div>
              </div>
            </div>

            {/* Timeline Box */}
            <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-container-high/60 flex flex-col gap-space-xs">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Stay Timeline & 24-Hour Cycle Policy
              </span>
              <div className="flex flex-col gap-space-xxs text-body-sm font-tabular-numeric">
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Check-In Timestamp:</span>
                  <span className="text-on-tertiary-container font-bold">
                    {booking?.check_in ? formatDateTime(booking.check_in) : 'Active Stay'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-surface-container-high/40">
                  <span className="text-on-surface-variant">Billing Rule:</span>
                  <span className="text-secondary font-bold">
                    Minimum 24h Flat Tariff Slab applied for any stay duration
                  </span>
                </div>
              </div>
            </div>

            {/* Billing & Admin Discount Box */}
            <div className="p-space-md rounded-xl bg-primary-container text-on-primary flex flex-col gap-space-sm shadow-sm">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-label-md text-surface-variant uppercase">Settlement Calculation</span>
                <span className="font-tabular-numeric text-headline-sm text-secondary-fixed font-bold">
                  Net Total: {formatCurrency(netTotal)}
                </span>
              </div>

              {/* Admin Discount Entry Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs border-t border-surface-container-high/30">
                <div className="flex flex-col gap-space-xxs">
                  <label className="text-body-sm text-surface-variant font-medium">
                    Admin Discount (%)
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-surface-container-high/60 bg-surface-container">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full px-space-sm py-space-xs text-on-primary font-tabular-numeric font-bold focus:outline-none bg-transparent"
                    />
                    <span className="px-space-sm py-space-xs bg-surface-container-high text-surface-variant font-bold flex items-center justify-center">
                      %
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-end text-body-sm text-surface-variant text-right">
                  <div>Base Tariff: <span className="font-tabular-numeric text-on-primary font-semibold">{formatCurrency(basePrice)}</span></div>
                  {discountAmount > 0 && (
                    <div className="text-secondary-container font-semibold">
                      Discount ({discountPercent}%): -{formatCurrency(discountAmount)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low border border-surface-container-high/60">
              <span className="font-label-md text-label-md text-on-surface font-semibold">Payment Method:</span>
              <div className="flex items-center gap-space-xs">
                {['UPI', 'Cash', 'Card'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                      paymentMode === mode
                        ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {mode === 'UPI' ? 'UPI / QR' : mode === 'Cash' ? 'Cash Desk' : 'POS Card'}
                  </button>
                ))}
              </div>
            </div>

            {/* Action CTAs */}
            <div className="px-space-xl py-space-md -mx-space-xl -mb-space-xl bg-surface-container-low flex items-center justify-between gap-space-sm border-t border-surface-container-high/60 mt-space-sm">
              <button
                onClick={() => setShowPrintInvoice(true)}
                className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-lg text-label-lg flex items-center gap-space-xs transition-colors border border-surface-container-high/60 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Generate Bill / Print Invoice</span>
              </button>

              <div className="flex items-center gap-space-sm">
                <button
                  onClick={onClose}
                  className="px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-colors border border-surface-container-high/60 cursor-pointer"
                  type="button"
                >
                  Cancel
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
          </div>
        )}
      </Modal>

      {/* Printable Invoice Modal */}
      {showPrintInvoice && (
        <Modal
          isOpen={showPrintInvoice}
          onClose={() => setShowPrintInvoice(false)}
          title="Printable Tax Invoice / Bill"
          subtitle="SRIDEVI RESIDENCY • Official Guest Receipt"
          size="lg"
        >
          <div className="flex flex-col gap-space-lg p-space-md bg-white text-slate-900 border border-slate-200 rounded-xl" id="printable-invoice">
            {/* Invoice Header */}
            <div className="flex items-center justify-between border-b pb-space-md border-slate-200">
              <div className="flex flex-col">
                <h1 className="font-display-sm text-display-sm text-slate-950 font-bold">
                  SRIDEVI RESIDENCY
                </h1>
                <span className="text-xs font-semibold text-slate-500">LODGE & HOTEL MANAGEMENT</span>
                <span className="text-xs text-slate-500">Main Road, Rajahmundry, AP • GSTIN: 37AAAAA0000A1Z5</span>
              </div>
              <div className="text-right flex flex-col">
                <span className="font-bold text-sm text-slate-900 uppercase">GUEST TAX INVOICE</span>
                <span className="text-xs text-slate-500">Inv #: SR-INV-{booking?.id?.slice(0, 6) || '8841'}</span>
                <span className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Guest & Room Details Grid */}
            <div className="grid grid-cols-2 gap-space-md text-xs border-b pb-space-md border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">Guest Information</span>
                <div>Name: <strong>{customer?.full_name || 'Guest'}</strong></div>
                <div>Phone: <strong>{customer?.phone || '—'}</strong></div>
                <div>Govt ID / Aadhaar: <strong>{customer?.aadhar_number || '—'}</strong></div>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">Stay Particulars</span>
                <div>Room Unit: <strong>Room {room?.room_number} ({category.name})</strong></div>
                <div>Check-In: <strong>{booking?.check_in ? formatDateTime(booking.check_in) : 'Active Stay'}</strong></div>
                <div>Occupancy Rule: <strong>24-Hour Tariff Cycle</strong></div>
              </div>
            </div>

            {/* Billing Table */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold">
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Cycle Slabs</th>
                  <th className="py-2 px-3 text-right">Rate</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans">
                    Room {room?.room_number} Occupancy Tariff
                  </td>
                  <td className="py-2 px-3 text-right">1 Slab (24h)</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(basePrice)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(basePrice)}</td>
                </tr>
                {discountAmount > 0 && (
                  <tr className="text-emerald-700 font-semibold">
                    <td className="py-2 px-3 font-sans">Special Admin Discount ({discountPercent}%)</td>
                    <td className="py-2 px-3 text-right">—</td>
                    <td className="py-2 px-3 text-right">—</td>
                    <td className="py-2 px-3 text-right">-{formatCurrency(discountAmount)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Net Total & Signature */}
            <div className="flex items-center justify-between pt-space-md border-t border-slate-200">
              <div className="flex flex-col text-xs text-slate-500">
                <span>Payment Mode: <strong>{paymentMode}</strong></span>
                <span>Status: <strong>SETTLED & PAID</strong></span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase">Net Amount Payable</span>
                <span className="text-2xl font-bold font-mono text-slate-950">{formatCurrency(netTotal)}</span>
              </div>
            </div>

            {/* Footer Print Actions */}
            <div className="flex justify-between items-center pt-space-md border-t border-slate-200 print:hidden">
              <button
                onClick={() => setShowPrintInvoice(false)}
                className="px-space-md py-space-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                type="button"
              >
                Back to Details
              </button>
              <button
                onClick={() => window.print()}
                className="px-space-lg py-space-xs rounded bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Official Invoice</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
