import React, { useState } from 'react';
import useCustomers from '../../hooks/useCustomers';
import customerService from '../../services/customerService';
import CustomerHistoryModal from '../../components/customers/CustomerHistoryModal';
import { Users, Search, History, Trash2 } from 'lucide-react';

export function OwnerCustomers() {
  const { customers, search, setSearch, refetch } = useCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  function handleOpenCustomer(id) {
    setSelectedCustomerId(id);
    setIsProfileModalOpen(true);
  }

  async function handleDeleteCustomer(cust) {
    if (!window.confirm(`Are you sure you want to delete customer "${cust.full_name}" (${cust.phone})?\nThis action will remove their profile from the residency directory.`)) {
      return;
    }

    try {
      setDeletingId(cust.id);
      await customerService.deleteCustomer(cust.id);
      await refetch();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      alert('Failed to delete customer. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col w-full gap-5 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Management
            </h2>
          </div>
          <p className="font-['Inter'] text-xs text-slate-500">
            Guest registry, previous visits, and ID verification logs
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Customer Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] font-['Inter'] select-none">
                <th className="py-3 px-5">Customer Name</th>
                <th className="py-3 px-5">Phone Number</th>
                <th className="py-3 px-5">Demographics</th>
                <th className="py-3 px-5">Address</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-['Inter']">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shadow-2xs font-['Plus_Jakarta_Sans']">
                          {cust.full_name?.charAt(0) || 'G'}
                        </div>
                        <span className="font-bold text-slate-900">{cust.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-600 font-medium">{cust.phone}</td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {cust.gender || 'Male'}, {cust.age ? `${cust.age} yrs` : '—'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">{cust.address || '—'}</td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCustomer(cust.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>View History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust)}
                          disabled={deletingId === cust.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                          title="Delete Customer Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === cust.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerHistoryModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        customerId={selectedCustomerId}
        onDeleteCustomer={async (cust) => {
          setIsProfileModalOpen(false);
          await handleDeleteCustomer(cust);
        }}
      />
    </div>
  );
}

export default OwnerCustomers;
