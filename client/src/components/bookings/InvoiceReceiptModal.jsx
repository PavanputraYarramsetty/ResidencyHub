import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianDateTime } from '../../utils/dateUtils';
import { printInvoiceDocument } from '../../utils/exportUtils';
import { Printer, CheckCircle, Hotel } from 'lucide-react';

export function InvoiceReceiptModal({ isOpen, onClose, invoiceData }) {
  if (!isOpen || !invoiceData) return null;

  const customerName = invoiceData.customerName || invoiceData.full_name || invoiceData.customers?.full_name || 'Guest';
  const phone = invoiceData.phone || invoiceData.customers?.phone || '—';
  const roomNumber = invoiceData.roomNumber || invoiceData.room_number || invoiceData.rooms?.room_number || '—';
  const categoryName = invoiceData.categoryName || invoiceData.category_name || invoiceData.rooms?.room_categories?.name || 'Standard Room';
  const checkIn = invoiceData.checkIn || invoiceData.check_in || invoiceData.created_at || new Date().toISOString();
  const checkOut = invoiceData.checkOut || invoiceData.check_out || new Date().toISOString();
  const billableDays = invoiceData.billableDays || invoiceData.billable_days || invoiceData.billing_units || 1;

  const grossAmount = invoiceData.grossAmount !== undefined
    ? Number(invoiceData.grossAmount)
    : (invoiceData.gross_amount !== undefined
        ? Number(invoiceData.gross_amount)
        : Number((invoiceData.rate_per_day || 1500) * billableDays));

  const advanceAmount = invoiceData.advanceAmount !== undefined
    ? Number(invoiceData.advanceAmount)
    : (invoiceData.advance_amount !== undefined ? Number(invoiceData.advance_amount) : 0);

  const discountPercent = Number(invoiceData.discountPercent || invoiceData.discount_percent || 0);
  const discountAmount = invoiceData.discountAmount !== undefined
    ? Number(invoiceData.discountAmount)
    : (invoiceData.discount_amount !== undefined
        ? Number(invoiceData.discount_amount)
        : Math.round((grossAmount * discountPercent) / 100));

  const netTotal = Math.max(0, grossAmount - discountAmount);
  const balanceCollected = invoiceData.balanceCollected !== undefined
    ? Number(invoiceData.balanceCollected)
    : (invoiceData.balance_collected !== undefined
        ? Number(invoiceData.balance_collected)
        : Math.max(0, netTotal - advanceAmount));

  const paymentMode = invoiceData.paymentMode || invoiceData.payment_mode || 'UPI';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Checkout Invoice & Receipt" maxWidth="max-w-md">
      <div className="space-y-4 text-xs">
        {/* Printable invoice card */}
        <div id="invoice-receipt-print" className="p-5 rounded-xl bg-white text-gray-900 shadow-inner border border-slate-200">
          <div className="text-center border-b pb-3 mb-3">
            <h3 className="text-base font-extrabold text-gray-900 tracking-wide font-['Plus_Jakarta_Sans']">SRIDEVI RESIDENCY</h3>
            <p className="text-[11px] text-gray-500 font-['Inter']">Official Guest Stay Tax Invoice</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ph: +91 94910 08797 • Andhra Pradesh</p>
          </div>

          {/* Guest & Room Details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 pb-3 border-b border-slate-200 font-['Inter']">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Guest Name</span>
              <span className="font-bold text-slate-900 text-sm block">{customerName}</span>
              {phone !== '—' && <span className="block text-[11px] text-slate-600 font-mono font-medium">{phone}</span>}
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Room Assigned</span>
              <span className="font-extrabold font-mono text-slate-900 text-sm block">Room {roomNumber}</span>
              <span className="text-[10px] text-slate-500 font-medium">{categoryName}</span>
            </div>
            <div className="mt-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Check In</span>
              <span className="text-slate-700 font-medium">{formatIndianDateTime(checkIn)}</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Check Out</span>
              <span className="text-slate-700 font-medium">{formatIndianDateTime(checkOut)}</span>
            </div>
          </div>

          <table className="w-full text-left text-[11px] mb-3 font-['Inter']">
            <thead>
              <tr className="border-b text-slate-500 font-semibold">
                <th className="py-1">Description</th>
                <th className="py-1 text-center">Stay Duration</th>
                <th className="py-1 text-right">Gross Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b text-slate-800">
                <td className="py-2 font-medium">{categoryName}</td>
                <td className="py-2 text-center font-mono">{billableDays} × 24h cycle</td>
                <td className="py-2 text-right font-mono font-bold text-slate-900">{formatINR(grossAmount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Detailed Financial Breakdown */}
          <div className="space-y-1.5 text-right text-[11px] font-['Inter'] pt-1">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Total Gross Amount:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(grossAmount)}</span>
            </div>

            {advanceAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Advance Paid:</span>
                <span className="font-mono font-bold">- {formatINR(advanceAmount)}</span>
              </div>
            )}

            {discountPercent > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono font-bold">- {formatINR(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-xs pt-2 border-t border-slate-200">
              <span className="text-slate-900">Remaining Balance Paid ({paymentMode}):</span>
              <span className="text-emerald-700 font-extrabold font-mono text-sm">{formatINR(balanceCollected)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-4 pt-2 border-t border-slate-100 font-['Inter']">
            Thank you for staying at Sridevi Residency! Have a safe journey.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="primary" onClick={() => printInvoiceDocument('invoice-receipt-print')}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print Guest Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default InvoiceReceiptModal;
