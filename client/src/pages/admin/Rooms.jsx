import React, { useState } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatINR } from '../../utils/currencyUtils';
import { BedDouble, Plus, Edit2, Trash2, Users, Wrench } from 'lucide-react';

export function AdminRooms() {
  const { floors, categories, addRoom, updateRoom, deleteRoom } = useResidency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form State
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [status, setStatus] = useState('available');
  const [submitting, setSubmitting] = useState(false);

  const allRooms = floors.flatMap((f) =>
    (f.rooms || []).map((r) => ({ ...r, floor_name: f.floor_name, floor_id: f.id }))
  );

  function handleOpenAdd() {
    setEditingRoom(null);
    setSelectedFloorId(floors[0]?.id || '');
    setRoomNumber('');
    setSelectedCategoryId(categories[0]?.id || '');
    setStatus('available');
    setIsModalOpen(true);
  }

  function handleOpenEdit(room) {
    setEditingRoom(room);
    setSelectedFloorId(room.floor_id);
    setRoomNumber(room.room_number);
    setSelectedCategoryId(room.category_id || categories[0]?.id || '');
    setStatus(room.status || 'available');
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roomNumber.trim() || !selectedFloorId) return;

    setSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === selectedCategoryId) || categories[0];
      if (editingRoom) {
        await updateRoom(editingRoom.id, {
          room_number: roomNumber.trim(),
          category_id: selectedCategoryId,
          floor_id: selectedFloorId,
          status: status === 'occupied' ? 'available' : status, // Occupancy comes only from bookings (rule 21)
        });
      } else {
        await addRoom(selectedFloorId, {
          room_number: roomNumber.trim(),
          category_id: selectedCategoryId,
          category_name: selectedCat?.name || 'Standard',
          base_price: selectedCat?.price_per_24_hours || 1500,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(roomId, floorId) {
    if (confirm('Are you sure you want to delete this room?')) {
      await deleteRoom(floorId, roomId);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
            <BedDouble className="w-6 h-6 text-purple-600" />
            Room Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Configure room numbers, categories, pricing, and maintenance flags</p>
        </div>

        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Room
        </Button>
      </div>

      {/* Rooms Table */}
      <Card className="overflow-hidden p-0 border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-4">Room No.</th>
                <th className="p-4">Floor</th>
                <th className="p-4">Category</th>
                <th className="p-4">24h Tariff</th>
                <th className="p-4">Max Capacity</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allRooms.map((room) => {
                const cat = room.room_categories || { name: 'Standard', base_price: 1500, max_occupancy: 2 };
                return (
                  <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold font-mono text-slate-900 text-sm">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-extrabold text-slate-800">
                        {room.room_number}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{room.floor_name}</td>
                    <td className="p-4 font-semibold text-slate-800">{cat.name}</td>
                    <td className="p-4 font-extrabold text-emerald-700 font-mono">
                      {formatINR(cat.base_price || cat.price_per_24_hours || 1500)}
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        {cat.max_occupancy || cat.max_persons || 2} Persons
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={room.status}>{room.status?.toUpperCase()}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(room.id, room.floor_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add Room to Residency'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Floor *</label>
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              required
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.floor_name} (Floor {f.floor_number})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Room Number *"
            placeholder="e.g. 101, 205, 302"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Room Category *</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {formatINR(c.price_per_24_hours || c.base_price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Operational Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="available">Available</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Note: "Occupied" status is automatically assigned upon guest check-in (Rule 21).
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminRooms;
