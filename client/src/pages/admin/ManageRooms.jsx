import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useResidency } from '../../context/ResidencyContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { DoorOpen, Plus, Edit3, Trash2, Save, X, Tags } from 'lucide-react';

export default function ManageRooms() {
  const { floors, categories, refreshFloors, refreshCategories } = useResidency();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [roomForm, setRoomForm] = useState({ room_number: '', floor_id: '', category_id: '' });
  const [catForm, setCatForm] = useState({ name: '', base_price: '', max_occupancy: 2 });
  const [tab, setTab] = useState('rooms');

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setLoading(true);
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRoom(e) {
    e.preventDefault();
    if (!roomForm.room_number || !roomForm.floor_id || !roomForm.category_id) return toast.error('Fill all fields');
    try {
      await api.post('/rooms', roomForm);
      toast.success('Room added ✅');
      setShowAddRoom(false);
      setRoomForm({ room_number: '', floor_id: '', category_id: '' });
      fetchRooms();
      refreshFloors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add room');
    }
  }

  async function handleDeleteRoom(id, number) {
    if (!confirm(`Delete room ${number}?`)) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      fetchRooms();
      refreshFloors();
    } catch (err) {
      toast.error('Failed to delete room');
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!catForm.name || !catForm.base_price) return toast.error('Name and price are required');
    try {
      await api.post('/rooms/categories', { ...catForm, base_price: Number(catForm.base_price), max_occupancy: Number(catForm.max_occupancy) });
      toast.success('Category added ✅');
      setShowAddCategory(false);
      setCatForm({ name: '', base_price: '', max_occupancy: 2 });
      refreshCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add category');
    }
  }

  async function handleDeleteCategory(id, name) {
    if (!confirm(`Delete category "${name}"? Rooms using this category may be affected.`)) return;
    try {
      await api.delete(`/rooms/categories/${id}`);
      toast.success('Category deleted');
      refreshCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  }

  // Group rooms by floor
  const roomsByFloor = {};
  rooms.forEach(r => {
    const floorName = r.floors?.floor_name || 'Unknown';
    if (!roomsByFloor[floorName]) roomsByFloor[floorName] = [];
    roomsByFloor[floorName].push(r);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-brand-600" /> Manage Rooms
          </h1>
          <p className="text-sm text-surface-500">{rooms.length} rooms, {categories.length} categories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('rooms')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'rooms' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500'}`}>
          Rooms
        </button>
        <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'categories' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500'}`}>
          Categories
        </button>
      </div>

      {tab === 'rooms' && (
        <>
          <button
            onClick={() => setShowAddRoom(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 shadow-lg shadow-brand-600/25"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>

          {showAddRoom && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleAddRoom}
              className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
              <h3 className="font-bold text-surface-800 mb-4">Add New Room</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <input type="text" value={roomForm.room_number} onChange={e => setRoomForm(f => ({ ...f, room_number: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="Room Number (e.g. 101)" />
                <select value={roomForm.floor_id} onChange={e => setRoomForm(f => ({ ...f, floor_id: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm bg-white">
                  <option value="">Select Floor</option>
                  {floors.map(f => <option key={f.id} value={f.id}>{f.floor_name}</option>)}
                </select>
                <select value={roomForm.category_id} onChange={e => setRoomForm(f => ({ ...f, category_id: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm bg-white">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} (₹{c.base_price})</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600">Add</button>
                  <button type="button" onClick={() => setShowAddRoom(false)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100">Cancel</button>
                </div>
              </div>
            </motion.form>
          )}

          {Object.entries(roomsByFloor).map(([floorName, floorRooms]) => (
            <div key={floorName}>
              <h3 className="font-bold text-surface-700 mb-3">{floorName}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {floorRooms.map(room => (
                  <div key={room.id} className="bg-white rounded-xl border border-surface-200 p-3 text-center group relative">
                    <p className="text-xl font-bold text-surface-800">{room.room_number}</p>
                    <p className="text-xs text-surface-400">{room.room_categories?.name}</p>
                    <p className="text-xs text-surface-400">₹{Number(room.room_categories?.base_price || 0).toLocaleString()}</p>
                    <button
                      onClick={() => handleDeleteRoom(room.id, room.room_number)}
                      className="absolute top-1 right-1 p-1 rounded-lg text-surface-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'categories' && (
        <>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>

          {showAddCategory && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleAddCategory}
              className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
              <h3 className="font-bold text-surface-800 mb-4">Add Room Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="Category name" />
                <input type="number" value={catForm.base_price} onChange={e => setCatForm(f => ({ ...f, base_price: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="Base price per day" />
                <input type="number" value={catForm.max_occupancy} onChange={e => setCatForm(f => ({ ...f, max_occupancy: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-surface-200 text-sm" placeholder="Max occupancy" />
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600">Add</button>
                  <button type="button" onClick={() => setShowAddCategory(false)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100">Cancel</button>
                </div>
              </div>
            </motion.form>
          )}

          <div className="space-y-3">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Tags className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-800">{cat.name}</h3>
                    <p className="text-xs text-surface-400">₹{Number(cat.base_price).toLocaleString()}/day • Max {cat.max_occupancy} guests</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="p-2 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            {!categories.length && (
              <div className="text-center py-12 text-surface-400">
                <Tags className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No categories yet. Add your first room category.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
