import React, { useState } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Layers, Plus, Edit2, Trash2, BedDouble } from 'lucide-react';

export function AdminFloors() {
  const { floors, addFloor, updateFloor, deleteFloor, refreshFloors } = useResidency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [floorName, setFloorName] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleOpenAdd() {
    setEditingFloor(null);
    setFloorName(`Floor ${floors.length}`);
    setFloorNumber(floors.length);
    setIsModalOpen(true);
  }

  function handleOpenEdit(floor) {
    setEditingFloor(floor);
    setFloorName(floor.floor_name);
    setFloorNumber(floor.floor_number);
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!floorName.trim()) return;

    setSubmitting(true);
    try {
      if (editingFloor) {
        await updateFloor(editingFloor.id, {
          floor_name: floorName.trim(),
          floor_number: Number(floorNumber),
        });
      } else {
        await addFloor(floorName.trim(), Number(floorNumber));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this floor?')) {
      await deleteFloor(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
            <Layers className="w-6 h-6 text-blue-600" />
            Floor Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Configure floor hierarchy, room allocations, and layout</p>
        </div>

        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Floor
        </Button>
      </div>

      {/* Floor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floors.map((floor) => {
          const roomsCount = floor.rooms?.length || 0;
          const availableCount = floor.rooms?.filter((r) => r.status === 'available').length || 0;
          const occupiedCount = floor.rooms?.filter((r) => r.status === 'occupied').length || 0;

          return (
            <Card key={floor.id} className="p-5 space-y-4 border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">Level {floor.floor_number}</span>
                  <h4 className="text-lg font-bold text-slate-900 mt-1.5">{floor.floor_name}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(floor)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(floor.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Total</span>
                  <span className="font-extrabold text-slate-800 font-mono text-sm">{roomsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Available</span>
                  <span className="font-extrabold text-emerald-700 font-mono text-sm">{availableCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 font-semibold block">Occupied</span>
                  <span className="font-extrabold text-rose-700 font-mono text-sm">{occupiedCount}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Floor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFloor ? 'Edit Floor Details' : 'Add New Residency Floor'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Floor Name *"
            placeholder="e.g. Ground Floor, First Floor"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
            required
          />

          <Input
            label="Floor Number Index *"
            type="number"
            placeholder="e.g. 0, 1, 2"
            value={floorNumber}
            onChange={(e) => setFloorNumber(e.target.value)}
            required
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingFloor ? 'Save Changes' : 'Create Floor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminFloors;
