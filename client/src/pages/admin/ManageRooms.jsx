import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { DoorOpen, Plus, Trash2, Tags, BedDouble, Users, Wind } from 'lucide-react';
import { formatCurrency } from '../../utils/dateFormat';

export default function ManageRooms() {
  const { floors, categories, refreshFloors, refreshCategories } = useResidency();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [roomForm, setRoomForm] = useState({ room_number: '', floor_id: '', category_id: '' });
  const [catForm, setCatForm] = useState({ name: '', base_price: '', max_occupancy: 2 });
  const [activeTab, setActiveTab] = useState('rooms');

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setLoading(true);
      const { data } = await api.get('/rooms');
      setRooms(data || []);
    } catch (err) {
      console.warn('Rooms fetch warning — using local floor room data');
      const list = [];
      floors.forEach((f) => {
        (f.rooms || []).forEach((r) => list.push({ ...r, floors: f }));
      });
      setRooms(list);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRoom(e) {
    e.preventDefault();
    if (!roomForm.room_number || !roomForm.floor_id || !roomForm.category_id) {
      return toast.error('Please fill in room number, floor, and category');
    }
    try {
      await api.post('/rooms', roomForm);
      toast.success(`Room ${roomForm.room_number} added successfully ✅`);
      setShowAddRoom(false);
      setRoomForm({ room_number: '', floor_id: '', category_id: '' });
      fetchRooms();
      refreshFloors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add room');
    }
  }

  async function handleDeleteRoom(id, number) {
    if (!confirm(`Delete Room ${number}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success(`Room ${number} removed`);
      fetchRooms();
      refreshFloors();
    } catch (err) {
      toast.error('Failed to delete room');
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!catForm.name || !catForm.base_price) {
      return toast.error('Please provide category name and base price');
    }
    try {
      await api.post('/rooms/categories', {
        ...catForm,
        base_price: Number(catForm.base_price),
        max_occupancy: Number(catForm.max_occupancy),
      });
      toast.success(`Category "${catForm.name}" created ✅`);
      setShowAddCategory(false);
      setCatForm({ name: '', base_price: '', max_occupancy: 2 });
      refreshCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    }
  }

  async function handleDeleteCategory(id, name) {
    if (!confirm(`Delete category "${name}"? Rooms linked to it may lose their category styling.`)) return;
    try {
      await api.delete(`/rooms/categories/${id}`);
      toast.success(`Category "${name}" removed`);
      refreshCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  }

  // Group rooms by floor
  const roomsByFloor = {};
  rooms.forEach((r) => {
    const floorName = r.floors?.floor_name || 'Ground Floor';
    if (!roomsByFloor[floorName]) roomsByFloor[floorName] = [];
    roomsByFloor[floorName].push(r);
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <DoorOpen className="w-6 h-6" />
            </span>
            Rooms & Category Catalog
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Configure room numbers, 24-hour tariff rates, guest capacity & amenities
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rooms'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tariff Slabs ({categories.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Rooms */}
      {activeTab === 'rooms' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Building Room Inventory
            </h2>
            <button
              onClick={() => setShowAddRoom(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-gold hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Room</span>
            </button>
          </div>

          {/* Add Room Inline Form */}
          {showAddRoom && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddRoom}
              className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-luxury space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900">Add New Hotel Room</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    placeholder="e.g. 101, 204"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Floor Level *</label>
                  <select
                    required
                    value={roomForm.floor_id}
                    onChange={(e) => setRoomForm({ ...roomForm, floor_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none"
                  >
                    <option value="">Select Floor Level</option>
                    {floors.map((fl) => (
                      <option key={fl.id} value={fl.id}>{fl.floor_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category & Tariff *</label>
                  <select
                    required
                    value={roomForm.category_id}
                    onChange={(e) => setRoomForm({ ...roomForm, category_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCurrency(c.base_price)}/24h)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoom(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm"
                >
                  Save Unit
                </button>
              </div>
            </motion.form>
          )}

          {/* Rooms Grouped by Floor */}
          <div className="space-y-6">
            {Object.entries(roomsByFloor).map(([floorName, floorRooms]) => (
              <div key={floorName} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-luxury-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {floorName}
                  </h3>
                  <span className="text-xs font-bold text-slate-500">{floorRooms.length} Units</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {floorRooms.map((r) => {
                    const cat = r.room_categories || {};
                    return (
                      <div
                        key={r.id}
                        className="group relative rounded-xl border border-slate-200/80 p-3 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-lg font-black text-slate-900">{r.room_number}</span>
                          <button
                            onClick={() => handleDeleteRoom(r.id, r.room_number)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete Room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-bold text-slate-600 truncate mt-1">{cat.name || 'Standard'}</p>
                        <p className="text-[10px] font-extrabold text-amber-700">
                          {cat.base_price ? formatCurrency(cat.base_price) : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Configured Room Categories
            </h2>
            <button
              onClick={() => setShowAddCategory(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-gold hover:from-amber-300 hover:to-amber-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          {showAddCategory && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddCategory}
              className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-luxury space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900">Add Room Category Slab</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="e.g. Deluxe Suite"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Base Price / 24h (INR) *</label>
                  <input
                    type="number"
                    required
                    value={catForm.base_price}
                    onChange={(e) => setCatForm({ ...catForm, base_price: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Max Occupancy *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={catForm.max_occupancy}
                    onChange={(e) => setCatForm({ ...catForm, max_occupancy: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </motion.form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-luxury-sm flex items-center justify-between hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                    <Tags className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{c.name}</h3>
                    <p className="text-xs font-black text-amber-600">{formatCurrency(c.base_price)} / 24h</p>
                    <p className="text-[11px] text-slate-400 font-medium">Max {c.max_occupancy || 2} Guests</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
