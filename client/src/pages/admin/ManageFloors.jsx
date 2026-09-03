import { useState } from 'react';
import { motion } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit3, Trash2, Save, X, BedDouble } from 'lucide-react';

export default function ManageFloors() {
  const { floors, refreshFloors } = useResidency();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ floor_number: '', floor_name: '' });
  const [loading, setLoading] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.floor_name || form.floor_number === '') return toast.error('Please specify floor number and name');
    try {
      setLoading(true);
      await api.post('/floors', { floor_number: Number(form.floor_number), floor_name: form.floor_name });
      toast.success('Building level added successfully ✅');
      setShowAdd(false);
      setForm({ floor_number: '', floor_name: '' });
      refreshFloors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add floor');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id) {
    try {
      setLoading(true);
      await api.put(`/floors/${id}`, { floor_number: Number(form.floor_number), floor_name: form.floor_name });
      toast.success('Floor updated successfully ✅');
      setEditId(null);
      refreshFloors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update floor');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This will also remove all rooms associated with this floor.`)) return;
    try {
      await api.delete(`/floors/${id}`);
      toast.success('Floor removed');
      refreshFloors();
    } catch (err) {
      toast.error('Failed to delete floor');
    }
  }

  function startEdit(floor) {
    setEditId(floor.id);
    setForm({ floor_number: floor.floor_number, floor_name: floor.floor_name });
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Building2 className="w-6 h-6" />
            </span>
            Manage Building Levels
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Configure hotel floors, level identifiers, and room allocations
          </p>
        </div>

        <button
          onClick={() => {
            setShowAdd(true);
            setForm({ floor_number: floors.length, floor_name: '' });
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-gold hover:from-amber-300 hover:to-amber-400 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Floor</span>
        </button>
      </div>

      {/* Add New Floor Form Card */}
      {showAdd && (
        <motion.form
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-luxury space-y-4"
        >
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" />
            New Building Floor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Level Index (0, 1, 2...)
              </label>
              <input
                type="number"
                required
                value={form.floor_number}
                onChange={(e) => setForm({ ...form, floor_number: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
                placeholder="e.g. 0 for Ground, 1 for 1st"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={form.floor_name}
                onChange={(e) => setForm({ ...form, floor_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
                placeholder="e.g. Ground Floor, First Level"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Adding...' : 'Save Floor'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* Floors List Cards */}
      <div className="space-y-3">
        {floors.map((floor, i) => (
          <motion.div
            key={floor.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-luxury-sm p-4 sm:p-5 hover:border-slate-300 transition-all"
          >
            {editId === floor.id ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  value={form.floor_number}
                  onChange={(e) => setForm({ ...form, floor_number: e.target.value })}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
                <input
                  type="text"
                  value={form.floor_name}
                  onChange={(e) => setForm({ ...form, floor_name: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdate(floor.id)}
                    disabled={loading}
                    className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 font-black text-base flex items-center justify-center border border-amber-500/20">
                    {floor.floor_number}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {floor.floor_name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        {floor.stats?.totalRooms || (floor.rooms?.length || 0)} Units Assigned
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(floor)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Edit Floor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(floor.id, floor.floor_name)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Floor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
