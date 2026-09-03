import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { customerService } from '../../services/customerService';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import {
  Users, Search, Plus, User, Phone, MapPin, Calendar,
  Hash, ChevronLeft, ChevronRight, BedDouble
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', phone: '', age: '', address: '', aadhar_number: '' });
  const [addLoading, setAddLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const data = await customerService.getCustomers({ page, limit, search: search || undefined });
      setCustomers(data.customers);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function viewCustomer(customer) {
    try {
      const full = await customerService.getCustomer(customer.id);
      setSelectedCustomer(full);
      setShowDetail(true);
    } catch (err) {
      toast.error('Failed to load customer details');
    }
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!addForm.full_name || !addForm.phone) return toast.error('Name and phone are required');
    try {
      setAddLoading(true);
      await customerService.createCustomer(addForm);
      toast.success('Customer added successfully ✅');
      setShowAddForm(false);
      setAddForm({ full_name: '', phone: '', age: '', address: '', aadhar_number: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add customer');
    } finally {
      setAddLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" /> Customers
          </h1>
          <p className="text-sm text-surface-500">{total} total customers</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 shadow-lg shadow-brand-600/25 hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-200 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          placeholder="Search by name or phone..."
        />
      </div>

      {/* Table */}
      {loading ? (
        <Loader type="table" count={8} />
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600 hidden md:table-cell">Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600 hidden lg:table-cell">Aadhar</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => viewCustomer(c)}
                    className="border-b border-surface-100 hover:bg-brand-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-surface-800">{c.full_name}</td>
                    <td className="px-4 py-3 text-surface-600">{c.phone}</td>
                    <td className="px-4 py-3 text-surface-500 truncate max-w-[200px] hidden md:table-cell">{c.address || '—'}</td>
                    <td className="px-4 py-3 text-surface-500 hidden lg:table-cell">{c.aadhar_number || '—'}</td>
                    <td className="px-4 py-3 text-surface-400">{formatDateTime(c.created_at)}</td>
                  </motion.tr>
                ))}
                {!customers.length && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-surface-400">No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
              <p className="text-xs text-surface-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Customer Details" size="lg">
        {selectedCustomer && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-surface-400">Name:</span> <span className="font-medium ml-1">{selectedCustomer.full_name}</span></div>
              <div><span className="text-surface-400">Phone:</span> <span className="font-medium ml-1">{selectedCustomer.phone}</span></div>
              <div><span className="text-surface-400">Age:</span> <span className="font-medium ml-1">{selectedCustomer.age || '—'}</span></div>
              <div><span className="text-surface-400">Aadhar:</span> <span className="font-medium ml-1">{selectedCustomer.aadhar_number || '—'}</span></div>
              <div className="col-span-2"><span className="text-surface-400">Address:</span> <span className="font-medium ml-1">{selectedCustomer.address || '—'}</span></div>
            </div>

            <div>
              <h3 className="font-bold text-surface-700 mb-3 flex items-center gap-2">
                <BedDouble className="w-4 h-4" /> Booking History ({selectedCustomer.booking_history?.length || 0})
              </h3>
              {selectedCustomer.booking_history?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCustomer.booking_history.map(b => (
                    <div key={b.id} className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Room {b.rooms?.room_number} ({b.rooms?.room_categories?.name})</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${
                          b.status === 'checked_out' ? 'bg-green-100 text-green-700' :
                          b.status === 'checked_in' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{b.status}</span>
                      </div>
                      <div className="text-xs text-surface-400 mt-1">
                        {formatDateTime(b.check_in)} → {b.check_out ? formatDateTime(b.check_out) : 'In progress'}
                        {b.total_amount && <span className="ml-2 font-semibold text-surface-600">{formatCurrency(b.total_amount)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-400">No booking history</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add customer modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Add Customer">
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Full Name *</label>
            <input type="text" value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="Customer name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Phone *</label>
            <input type="tel" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="Phone number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Age</label>
              <input type="number" value={addForm.age} onChange={e => setAddForm(f => ({ ...f, age: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Aadhar</label>
              <input type="text" value={addForm.aadhar_number} onChange={e => setAddForm(f => ({ ...f, aadhar_number: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="12 digits" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
            <textarea value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none" rows="2" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100">Cancel</button>
            <button type="submit" disabled={addLoading} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/25 disabled:opacity-50">
              {addLoading ? 'Adding...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
