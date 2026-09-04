import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianDateTime } from '../../utils/dateUtils';
import customerService from '../../services/customerService';
import { User, Phone, MapPin, Calendar, CreditCard, ShieldCheck } from 'lucide-react';

export function CustomerHistoryModal({ isOpen, onClose, customerId }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !customerId) return;
    setLoading(true);
    customerService
      .getCustomerById(customerId)
      .then((data) => setCustomer(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile & Stay History" maxWidth="max-w-2xl">
      {loading || !customer ? (
        <div className="py-12 text-center text-gray-400">Loading customer profile...</div>
      ) : (
        <div className="space-y-6">
          {/* Header info */}
          <div className="p-4 rounded-xl bg-[#161f33] border border-[#24314c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {customer.full_name?.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-100">{customer.full_name}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    {customer.phone}
                  </span>
                  <span>•</span>
                  <span>{customer.gender || 'Male'}, {customer.age || '—'} yrs</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-400">Total Visits</span>
              <p className="text-lg font-bold text-blue-400">{customer.booking_history?.length || 1}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#161f33]/60 border border-[#1f293d]">
              <span className="text-gray-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Address
              </span>
              <p className="text-gray-200">{customer.address || 'Not specified'}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#161f33]/60 border border-[#1f293d]">
              <span className="text-gray-400 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Aadhaar Reference
              </span>
              <p className="text-gray-200 font-mono">{customer.aadhaar_reference || 'XXXX-XXXX-XXXX'}</p>
            </div>
          </div>

          {/* Stays History */}
          <div>
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Previous Stays History</h5>
            {customer.booking_history && customer.booking_history.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {customer.booking_history.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg bg-[#161f33]/80 border border-[#1f293d] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-200">
                        Room {b.rooms?.room_number || '—'} ({b.rooms?.room_categories?.name || 'Standard'})
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        In: {formatIndianDateTime(b.check_in_at || b.check_in)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{formatINR(b.total_amount)}</p>
                      <Badge variant={b.status === 'checked_out' ? 'default' : 'occupied'} className="mt-1">
                        {b.status === 'checked_out' ? 'Completed' : 'Active Stay'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No previous stays recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default CustomerHistoryModal;
