import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianDateTime } from '../../utils/dateUtils';
import { printInvoiceDocument } from '../../utils/exportUtils';
import { Printer, CheckCircle, Hotel } from 'lucide-react';

export function InvoiceReceiptModal({ isOpen, onClose, invoiceData }) {
  if (!isOpen || !invoiceData) return null;

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
              <span className="font-bold">{invoiceData.customerName || invoiceData.full_name}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 block">Room Number:</span>
              <span className="font-bold font-mono">Room {invoiceData.roomNumber || invoiceData.room_number}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Check In:</span>
              <span>{formatIndianDateTime(invoiceData.checkIn)}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 block">Check Out:</span>
              <span>{formatIndianDateTime(invoiceData.checkOut)}</span>
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
                <td className="py-1.5">{invoiceData.categoryName || 'Standard Room'}</td>
                <td className="py-1.5 text-center font-mono">{invoiceData.billableDays || 1} × 24h</td>
                <td className="py-1.5 text-right font-mono font-bold">{formatINR(invoiceData.netTotal || invoiceData.total_amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-1 text-right text-[11px]">
            <div className="flex justify-between font-bold text-xs pt-1 border-t">
              <span>Net Total Paid ({invoiceData.paymentMode || 'UPI'}):</span>
              <span>{formatINR(invoiceData.netTotal || invoiceData.total_amount)}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-4 pt-2 border-t">
            Thank you for staying at Sridevi Residency! Have a safe journey.
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => printInvoiceDocument('invoice-receipt-print')}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print Guest Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default InvoiceReceiptModal;
