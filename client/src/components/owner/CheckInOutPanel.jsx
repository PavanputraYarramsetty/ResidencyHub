import Modal from '../common/Modal';
import { useCheckInOut } from '../../hooks/useCheckInOut';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';

export default function CheckInOutPanel({ isOpen, onClose, room, onSuccess }) {
  const {
    booking,
    loading,
    actionLoading,
    step,
    setStep,
    discountPercent,
    setDiscountPercent,
    paymentMode,
    setPaymentMode,
    showPrintInvoice,
    setShowPrintInvoice,
    handleCheckIn,
    handleReceiveMoney,
    handleFinalCheckOut,
    customer,
    category,
    isCheckedIn,
    isBooked,
    calculatedDays,
    grossTotal,
    advancePaid,
    remainingBeforeDiscount,
    discountAmount,
    remainingPayable,
    dailyRate,
  } = useCheckInOut({ isOpen, onClose, room, onSuccess });

  return (
    <>
      <Modal
        isOpen={isOpen && !showPrintInvoice}
        onClose={onClose}
        title={step === 'generate_bill' ? `Room ${room?.room_number || ''} — Payment Received (Generate Bill & Checkout)` : `Room ${room?.room_number || ''} — Guest Stay & Settlement`}
        subtitle={`Category: ${category.name || 'Standard'} • Rate: ${formatCurrency(dailyRate)}/24h • Stay: ${calculatedDays} Day(s)`}
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
        ) : step === 'generate_bill' ? (
          /* STEP 2: Money Received -> Show Generate Bill & Then Checkout Button */
          <div className="flex flex-col gap-space-lg py-space-xs">
            {/* Status Alert Banner */}
            <div className="p-space-md rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[24px]">check</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Money Received: {formatCurrency(remainingPayable)}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    Settled via <strong>{paymentMode}</strong> for Guest <strong>{customer?.full_name || 'Patron'}</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('settle')}
                className="text-xs text-secondary underline hover:text-on-surface cursor-pointer"
              >
                Edit Amount / Payment Mode
              </button>
            </div>

            {/* Complete Breakdown Summary Box */}
            <div className="w-full bg-surface-container-low rounded-xl p-space-md border border-surface-container-high/60 flex flex-col gap-space-xs text-body-sm font-tabular-numeric">
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold mb-1">
                Final Bill Summary
              </span>
              <div className="flex justify-between py-1 border-b border-surface-container-high/40">
                <span className="text-on-surface-variant">Gross Room Tariff ({calculatedDays} Day(s)):</span>
                <span className="text-on-surface font-semibold">{formatCurrency(grossTotal)}</span>
              </div>
              {advancePaid > 0 && (
                <div className="flex justify-between py-1 border-b border-surface-container-high/40 text-blue-600">
                  <span>Less: Advance Paid at Check-In:</span>
                  <span className="font-bold">-{formatCurrency(advancePaid)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-surface-container-high/40 text-emerald-600">
                  <span>Less: Admin Discount ({discountPercent}%):</span>
                  <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-base font-bold text-on-surface">
                <span>Remaining Net Paid:</span>
                <span className="text-secondary font-headline-sm font-bold">{formatCurrency(remainingPayable)}</span>
              </div>
            </div>

            {/* Primary Action Workflow: 1. Generate Bill -> 2. Check Out */}
            <div className="p-space-md rounded-xl bg-surface-container-highest border border-surface-container-high flex flex-col gap-space-md">
              <div className="flex flex-col text-left">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-wider">
                  Next Actions
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  Generate the customer tax invoice first, then click <strong>Complete Check-Out</strong> to release Room {room?.room_number}.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-xs">
                {/* 1. Generate Bill Action */}
                <button
                  type="button"
                  onClick={() => setShowPrintInvoice(true)}
                  className="w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-lg flex items-center justify-center gap-space-xs shadow-md transition-all cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[20px]">print</span>
                  <span>1. Generate & Print Bill</span>
                </button>

                {/* 2. Complete Check-Out Action */}
                <button
                  type="button"
                  onClick={handleFinalCheckOut}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-error hover:bg-on-error-container text-on-error font-label-lg flex items-center justify-center gap-space-xs shadow-md transition-all cursor-pointer font-bold"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                  )}
                  <span>2. Complete Check-Out</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 1: Active Stay & Receive Money Screen */
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

            {/* Timeline & Duration Box */}
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
                  <span className="text-on-surface-variant">Stay Duration / Slabs:</span>
                  <span className="text-on-surface font-bold">
                    {calculatedDays} Day(s) ({formatCurrency(dailyRate)}/day)
                  </span>
                </div>
              </div>
            </div>

            {/* Settlement Breakdown Box: Advance Paid, Discount, Remaining Balance */}
            <div className="p-space-md rounded-xl bg-primary-container text-on-primary flex flex-col gap-space-md shadow-sm">
              <div className="flex justify-between items-center border-b border-surface-container-high/30 pb-space-xs">
                <span className="font-label-md text-label-md text-surface-variant uppercase">Settlement Breakdown</span>
                <div className="flex items-baseline gap-space-xs">
                  <span className="text-xs text-surface-variant">Remaining to Collect:</span>
                  <span className="font-tabular-numeric text-headline-sm text-secondary-fixed font-bold">
                    {formatCurrency(remainingPayable)}
                  </span>
                </div>
              </div>

              {/* 3-Part Financial Summary Strip */}
              <div className="grid grid-cols-3 gap-space-sm text-center">
                <div className="p-space-xs rounded-lg bg-surface-container flex flex-col">
                  <span className="text-[11px] text-surface-variant uppercase font-medium">Gross Total</span>
                  <span className="font-tabular-numeric font-bold text-on-primary text-body-lg">
                    {formatCurrency(grossTotal)}
                  </span>
                </div>
                <div className="p-space-xs rounded-lg bg-surface-container flex flex-col">
                  <span className="text-[11px] text-on-tertiary-container uppercase font-medium">Advance Paid</span>
                  <span className="font-tabular-numeric font-bold text-on-tertiary-container text-body-lg">
                    {formatCurrency(advancePaid)}
                  </span>
                </div>
                <div className="p-space-xs rounded-lg bg-surface-container-highest flex flex-col border border-secondary/40">
                  <span className="text-[11px] text-secondary-fixed uppercase font-bold">Balance Due</span>
                  <span className="font-tabular-numeric font-bold text-secondary-fixed text-body-lg">
                    {formatCurrency(remainingPayable)}
                  </span>
                </div>
              </div>

              {/* Admin Discount Entry Box (Applied on remaining amount) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs border-t border-surface-container-high/30">
                <div className="flex flex-col gap-space-xxs">
                  <label className="text-body-sm text-surface-variant font-medium">
                    Admin Discount on Balance (%)
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
                  <div>Remaining Balance: <span className="font-tabular-numeric text-on-primary font-semibold">{formatCurrency(remainingBeforeDiscount)}</span></div>
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
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Payment Mode (for {formatCurrency(remainingPayable)}):
              </span>
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

            {/* Action CTAs: Receive Money First */}
            <div className="px-space-xl py-space-md -mx-space-xl -mb-space-xl bg-surface-container-low flex items-center justify-between gap-space-sm border-t border-surface-container-high/60 mt-space-sm">
              <button
                onClick={onClose}
                className="px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-colors border border-surface-container-high/60 cursor-pointer"
                type="button"
              >
                Cancel
              </button>

              <div className="flex items-center gap-space-sm">
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
                    onClick={handleReceiveMoney}
                    className="px-space-xl py-space-sm rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-lg text-label-lg flex items-center gap-space-xs shadow-md transition-all cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    <span>Receive Money ({formatCurrency(remainingPayable)})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Invoice Modal with Complete Breakdown */}
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
                <div>Stay Duration: <strong>{calculatedDays} Day(s) @ {formatCurrency(dailyRate)}/day</strong></div>
              </div>
            </div>

            {/* Billing Table */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold">
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Cycle Slabs</th>
                  <th className="py-2 px-3 text-right">Daily Rate</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans">
                    Room {room?.room_number} Occupancy Tariff ({calculatedDays} Day{calculatedDays > 1 ? 's' : ''})
                  </td>
                  <td className="py-2 px-3 text-right">{calculatedDays} Slab(s)</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(dailyRate)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(grossTotal)}</td>
                </tr>
                {advancePaid > 0 && (
                  <tr className="text-blue-700 font-semibold">
                    <td className="py-2 px-3 font-sans">Less: Advance Paid at Check-In</td>
                    <td className="py-2 px-3 text-right">—</td>
                    <td className="py-2 px-3 text-right">—</td>
                    <td className="py-2 px-3 text-right">-{formatCurrency(advancePaid)}</td>
                  </tr>
                )}
                {discountAmount > 0 && (
                  <tr className="text-emerald-700 font-semibold">
                    <td className="py-2 px-3 font-sans">Less: Admin Discount ({discountPercent}% on Balance)</td>
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
                <span>Gross Total: <strong>{formatCurrency(grossTotal)}</strong></span>
                <span>Advance Paid: <strong>{formatCurrency(advancePaid)}</strong></span>
                <span>Status: <strong>SETTLED & PAID</strong></span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase">Remaining Paid at Checkout</span>
                <span className="text-2xl font-bold font-mono text-slate-950">{formatCurrency(remainingPayable)}</span>
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
