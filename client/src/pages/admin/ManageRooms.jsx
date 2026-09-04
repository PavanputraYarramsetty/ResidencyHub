import { useState, useEffect } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

export default function ManageRooms() {
  const { floors, categories, addRoom, refreshData } = useResidency();
  const [activeTab, setActiveTab] = useState('rooms');

  // New Room State
  const [roomNumber, setRoomNumber] = useState('');
  const [floorId, setFloorId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // New Category State
  const [catName, setCatName] = useState('');
  const [catPrice, setCatPrice] = useState('');
  const [catMax, setCatMax] = useState('2');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (floors.length > 0 && !floorId) setFloorId(floors[0].id);
    if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
  }, [floors, categories]);

  async function handleAddRoom(e) {
    e.preventDefault();
    if (!roomNumber || !floorId) return toast.error('Please fill in room number and select a floor');

    const selCategory = categories.find((c) => c.id === categoryId) || {
      id: categoryId || 'cat-1',
      name: 'AC Single',
      base_price: 1500,
    };

    try {
      setSubmitting(true);
      await addRoom(floorId, {
        room_number: roomNumber,
        category: selCategory,
      });
      toast.success(`Room ${roomNumber} added successfully! 🏨`);
      setRoomNumber('');
    } catch (err) {
      toast.error('Failed to add room');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!catName || !catPrice) return toast.error('Please fill in category name and price');

    try {
      setSubmitting(true);
      await api.post('/categories', {
        name: catName,
        base_price: parseFloat(catPrice),
        max_occupancy: parseInt(catMax, 10) || 2,
      });
      toast.success(`Category "${catName}" created!`);
      setCatName('');
      setCatPrice('');
      refreshData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-lg px-space-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 mt-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              Inventory & Rate Configuration
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">Manage Rooms & Tariff Slabs</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Configure room inventory and category base pricing</p>
        </div>

        <div className="flex items-center bg-surface-container p-space-xxs rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-colors ${
              activeTab === 'rooms'
                ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Room Units
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-colors ${
              activeTab === 'categories'
                ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Tariff Categories
          </button>
        </div>
      </div>

      {activeTab === 'rooms' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface">Add New Room Unit</h2>
            <form onSubmit={handleAddRoom} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Room Number *</label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 106, 204"
                  className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
                />
              </div>

              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Building Floor Level *</label>
                <select
                  value={floorId}
                  onChange={(e) => setFloorId(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md p-space-sm rounded-lg focus:outline-none border border-surface-container-high/60 cursor-pointer"
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.floor_name} (Level {f.floor_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Tariff Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md p-space-sm rounded-lg focus:outline-none border border-surface-container-high/60 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ({formatCurrency(c.base_price)}/24h)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="py-space-sm px-space-md rounded-lg bg-secondary text-on-secondary font-label-lg hover:bg-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-space-xs cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Add Room Unit</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-space-md">
            {floors.map((f) => (
              <div key={f.id} className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex flex-col gap-space-sm">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{f.floor_name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                  {(f.rooms || []).map((r) => (
                    <div key={r.id} className="p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high/40 flex flex-col">
                      <span className="font-tabular-numeric text-headline-sm font-bold text-on-surface">
                        Room {r.room_number}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {r.room_categories?.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md">
            <h2 className="font-headline-md text-headline-md text-on-surface">Add Tariff Category</h2>
            <form onSubmit={handleAddCategory} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. AC Suite, Deluxe Double"
                  className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
                />
              </div>

              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">24h Base Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={catPrice}
                  onChange={(e) => setCatPrice(e.target.value)}
                  placeholder="1500"
                  className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric focus:outline-none border border-surface-container-high/60"
                />
              </div>

              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Max Occupancy</label>
                <input
                  type="number"
                  value={catMax}
                  onChange={(e) => setCatMax(e.target.value)}
                  placeholder="2"
                  className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric focus:outline-none border border-surface-container-high/60"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="py-space-sm px-space-md rounded-lg bg-secondary text-on-secondary font-label-lg hover:bg-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-space-xs cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Create Tariff Category</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {categories.map((c) => (
              <div key={c.id} className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex flex-col justify-between gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{c.name}</span>
                  <span className="font-tabular-numeric text-headline-sm text-secondary font-bold">
                    {formatCurrency(c.base_price)}/24h
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Max Capacity: {c.max_occupancy || 2} Persons
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
