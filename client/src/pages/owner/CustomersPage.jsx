import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { customerService } from '../../services/customerService';
import { formatDateTime, formatCurrency } from '../../utils/dateFormat';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import {
  Users, Search, Plus, User, Phone, MapPin, Calendar,
  Hash, ChevronLeft, ChevronRight, BedDouble, History, IndianRupee
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
  const limit = 15;

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const data = await customerService.getCustomers({ page, limit, search: search || undefined });
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.warn('Failed to fetch customers:', err);
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
      toast.error('Failed to load customer profile');
    }
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!addForm.full_name || !addForm.phone) return toast.error('Full Name and Phone Number are required');
    try {
      setAddLoading(true);
      await customerService.createCustomer(addForm);
      toast.success(`Guest "${addForm.full_name}" registered successfully ✅`);
      setShowAddForm(false);
      setAddForm({ full_name: '', phone: '', age: '', address: '', aadhar_number: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add customer');
    } finally {
      setAddLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Users className="w-6 h-6" />
            </span>
            Guest Records & Profiles
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Registered customer directory, visit history & repeat guest lookup
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-gold hover:from-amber-300 hover:to-amber-400 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Guest</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search guest by name or phone number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 self-end sm:self-auto px-2">
          Total Guests: <strong className="text-slate-900">{total}</strong>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <Loader type="table" count={8} />
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No customer records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No guest matched your search query. Try another term.' : 'Start by registering your first guest using the button above.'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
          >
            Register Guest
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-luxury-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Guest Name</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Phone</th>
                  <th className="py-3.5 px-4 font-semibold hidden md:table-cell">City / Address</th>
                  <th className="py-3.5 px-4 font-semibold hidden lg:table-cell">Identity Document</th>
                  <th className="py-3.5 px-4 font-semibold">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => viewCustomer(c)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Name + Avatar */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                          {c.full_name?.charAt(0) || 'G'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {c.full_name}
                          </p>
                          {c.age && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              Age: {c.age} yrs
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.phone}
                      </span>
                    </td>

                    {/* Address */}
                    <td className="py-3 px-4 text-slate-600 hidden md:table-cell max-w-xs truncate">
                      {c.address || '—'}
                    </td>

                    {/* Aadhar */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {c.aadhar_number ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold">
                          <Hash className="w-3 h-3 text-emerald-500" />
                          {c.aadhar_number}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500">
                      {formatDateTime(c.created_at)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewCustomer(c);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail & Stay History Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Guest Profile & History" size="lg">
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Profile Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-800 font-black text-lg flex items-center justify-center">
                  {selectedCustomer.full_name?.charAt(0) || 'G'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedCustomer.full_name}</h3>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <span>{selectedCustomer.phone}</span>
                    {selectedCustomer.age && <span>• Age {selectedCustomer.age}</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
                <p><strong className="text-slate-400 font-bold uppercase">Aadhar:</strong> {selectedCustomer.aadhar_number || 'Not provided'}</p>
                <p><strong className="text-slate-400 font-bold uppercase">Address:</strong> {selectedCustomer.address || 'Not provided'}</p>
              </div>
            </div>

            {/* Stay History Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-500" />
                Booking & Stay History ({selectedCustomer.booking_history?.length || 0})
              </h4>

              {selectedCustomer.booking_history?.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedCustomer.booking_history.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">
                            Room {b.rooms?.room_number || '—'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {b.rooms?.room_categories?.name || 'Standard'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Check-in: {b.check_in ? formatDateTime(b.check_in) : 'Pending'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'checked_out'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'checked_in'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {b.status}
                        </span>
                        {b.total_amount && (
                          <p className="font-black text-slate-900 mt-1">
                            {formatCurrency(b.total_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No previous bookings recorded for this guest.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Guest Modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Register Walk-In Guest">
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={addForm.full_name}
              onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Age
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={addForm.age}
                onChange={(e) => setAddForm({ ...addForm, age: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
                placeholder="Age in years"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Aadhar Number (12 digits)
            </label>
            <input
              type="text"
              maxLength="14"
              value={addForm.aadhar_number}
              onChange={(e) => setAddForm({ ...addForm, aadhar_number: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none font-mono"
              placeholder="12-digit number"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Permanent Address
            </label>
            <textarea
              rows="2"
              value={addForm.address}
              onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none resize-none"
              placeholder="City, State, PIN"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50"
            >
              {addLoading ? 'Saving...' : 'Register Guest'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
