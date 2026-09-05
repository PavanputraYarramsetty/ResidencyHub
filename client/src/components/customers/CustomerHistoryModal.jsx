import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { formatINR } from '../../utils/currencyUtils';
import { formatIndianDateTime } from '../../utils/dateUtils';
import customerService from '../../services/customerService';
import { User, Phone, MapPin, Calendar, CreditCard, ShieldCheck, History } from 'lucide-react';

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
        <div className="py-12 text-center text-slate-400 font-['Inter'] text-xs font-medium">
          Loading customer profile...
        </div>
      ) : (
        <div className="space-y-5 text-xs font-['Inter']">
          {/* Header Profile Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg font-['Plus_Jakarta_Sans'] flex items-center justify-center shadow-md shadow-blue-600/20">
                {customer.full_name?.charAt(0) || 'G'}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                  {customer.full_name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                  <span className="flex items-center gap-1 font-mono font-medium">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    {customer.phone}
                  </span>
                  <span>•</span>
                  <span className="font-medium">{customer.gender || 'Male'}, {customer.age ? `${customer.age} yrs` : '—'}</span>
                </div>
              </div>
            </div>

            <div className="text-right bg-white px-3.5 py-2 rounded-xl border border-blue-100 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Inter']">
                Total Visits
              </span>
              <p className="text-xl font-extrabold text-blue-700 font-['Plus_Jakarta_Sans']">
                {customer.booking_history?.length || 1}
              </p>
            </div>
          </div>

          {/* Customer Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 mb-1 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-amber-500" /> Address / Location
              </span>
              <p className="text-slate-800 font-semibold">{customer.address || 'Not specified'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 mb-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Aadhaar Reference
              </span>
              <p className="text-slate-800 font-mono font-semibold">
                {customer.aadhar_number || customer.aadhaar_reference || 'XXXX-XXXX-XXXX'}
              </p>
            </div>
          </div>

          {/* Stays History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-600" />
                Previous Stays History
              </h5>
              <span className="text-[11px] text-slate-400">
                {customer.booking_history?.length || 0} Recorded Stays
              </span>
            </div>

            {customer.booking_history && customer.booking_history.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {customer.booking_history.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                        <span>Room {b.rooms?.room_number || b.room_number || '—'}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {b.rooms?.room_categories?.name || 'Standard'}
                        </span>
                      </p>
                      <p className="text-slate-500 text-[11px] mt-1 font-mono">
                        In: {formatIndianDateTime(b.check_in_at || b.check_in)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans'] text-sm">
                        {formatINR(b.total_amount)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${
                          b.status === 'checked_out'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.status === 'checked_out' ? '✓ Completed' : '• Active Stay'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200/80 text-slate-400 text-xs">
                No previous stay records found for this guest.
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default CustomerHistoryModal;
