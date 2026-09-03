import { useState } from 'react';
import { motion } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit3, Trash2, Save, X } from 'lucide-react';

export default function ManageFloors() {
  const { floors, refreshFloors } = useResidency();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ floor_number: '', floor_name: '' });
  const [loading, setLoading] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.floor_name || form.floor_number === '') return toast.error('Fill all fields');
    try {
      setLoading(true);
      await api.post('/floors', { floor_number: Number(form.floor_number), floor_name: form.floor_name });
      toast.success('Floor added ✅');
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
      toast.success('Floor updated ✅');
      setEditId(null);
      refreshFloors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This will also delete all rooms on this floor.`)) return;
    try {
      await api.delete(`/floors/${id}`);
      toast.success('Floor deleted');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" /> Manage Floors
          </h1>
          <p className="text-sm text-surface-500">{floors.length} floors configured</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm({ floor_number: floors.length, floor_name: '' }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 shadow-lg shadow-brand-600/25 hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Add Floor
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5"
        >
          <h3 className="font-bold text-surface-800 mb-4">Add New Floor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="number" value={form.floor_number} onChange={e => setForm(f => ({ ...f, floor_number: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="Floor Number (0, 1, 2...)" />
            <input type="text" value={form.floor_name} onChange={e => setForm(f => ({ ...f, floor_name: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="Floor Name (e.g. Ground Floor)" />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 disabled:opacity-50">
                {loading ? 'Adding...' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100">Cancel</button>
            </div>
          </div>
        </motion.form>
      )}

      {/* Floors list */}
      <div className="space-y-3">
        {floors.map((floor, i) => (
          <motion.div
            key={floor.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5"
          >
            {editId === floor.id ? (
              <div className="flex items-center gap-4">
                <input type="number" value={form.floor_number} onChange={e => setForm(f => ({ ...f, floor_number: e.target.value }))}
                  className="w-24 px-3 py-2 rounded-xl border border-surface-200 text-sm" />
                <input type="text" value={form.floor_name} onChange={e => setForm(f => ({ ...f, floor_name: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl border border-surface-200 text-sm" />
                <button onClick={() => handleUpdate(floor.id)} disabled={loading} className="p-2 rounded-lg text-green-600 hover:bg-green-50">
                  <Save className="w-5 h-5" />
                </button>
                <button onClick={() => setEditId(null)} className="p-2 rounded-lg text-surface-400 hover:bg-surface-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <span className="text-lg font-bold text-brand-600">{floor.floor_number}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-800">{floor.floor_name}</h3>
                    <p className="text-xs text-surface-400">{floor.stats?.totalRooms || 0} rooms</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(floor)} className="p-2 rounded-lg text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(floor.id, floor.floor_name)} className="p-2 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {!floors.length && (
          <div className="text-center py-12 text-surface-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No floors yet. Add your first floor to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
