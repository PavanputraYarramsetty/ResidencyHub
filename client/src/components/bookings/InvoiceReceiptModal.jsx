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
  const netTotal = invoiceData.netTotal !== undefined ? invoiceData.netTotal : (invoiceData.total_amount !== undefined ? invoiceData.total_amount : 0);
  const paymentMode = invoiceData.paymentMode || invoiceData.payment_mode || 'UPI';
  const discountPercent = invoiceData.discountPercent || invoiceData.discount_percent || 0;
  const discountAmount = invoiceData.discountAmount || invoiceData.discount_amount || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Checkout Invoice & Receipt" maxWidth="max-w-md">
      <div className="space-y-4 text-xs">
        {/* Printable invoice card */}
        <div id="invoice-receipt-print" className="p-5 rounded-xl bg-white text-gray-900 shadow-inner">
          <div className="text-center border-b pb-3 mb-3">
            <h3 className="text-base font-bold text-gray-900 tracking-wide">SRIDEVI RESIDENCY</h3>
            <p className="text-[11px] text-gray-500">Official Guest Stay Tax Invoice</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ph: +91 94910 08797 • Andhra Pradesh</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 pb-2 border-b">
            <div>
              <span className="text-gray-500 block">Guest Name:</span>
              <span className="font-bold">{customerName}</span>
              {phone !== '—' && <span className="block text-[10px] text-gray-400 font-mono">{phone}</span>}
            </div>
            <div className="text-right">
              <span className="text-gray-500 block">Room Number:</span>
              <span className="font-bold font-mono">Room {roomNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Check In:</span>
              <span>{formatIndianDateTime(checkIn)}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 block">Check Out:</span>
              <span>{formatIndianDateTime(checkOut)}</span>
            </div>
          </div>

          <table className="w-full text-left text-[11px] mb-3">
            <thead>
              <tr className="border-b text-gray-500 font-semibold">
                <th className="py-1">Description</th>
                <th className="py-1 text-center">Stay Units</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-1.5">{categoryName}</td>
                <td className="py-1.5 text-center font-mono">{billableDays} × 24h</td>
                <td className="py-1.5 text-right font-mono font-bold">{formatINR(netTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-1 text-right text-[11px]">
            {discountPercent > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount ({discountPercent}%):</span>
                <span>- {formatINR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t">
              <span>Net Total Paid ({paymentMode}):</span>
              <span>{formatINR(netTotal)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-4 pt-2 border-t">
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
