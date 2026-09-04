import { useState } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ManageFloors() {
  const { floors, addFloor, refreshData } = useResidency();
  const [floorName, setFloorName] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleAddFloor(e) {
    e.preventDefault();
    if (!floorName || floorNumber === '') return toast.error('Please enter floor name and number');

    try {
      setSubmitting(true);
      await addFloor(floorName, parseInt(floorNumber, 10));
      toast.success(`Floor "${floorName}" created successfully!`);
      setFloorName('');
      setFloorNumber('');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to create floor');
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
              Building Configuration
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">Manage Property Levels & Floors</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Add and organize residency floors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Add New Floor Level</h2>
          <form onSubmit={handleAddFloor} className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">Floor Level Number</label>
              <input
                type="number"
                required
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g. 0 for Ground, 1 for 1st Floor"
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
              />
            </div>

            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">Floor Display Name</label>
              <input
                type="text"
                required
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g. Ground Floor, 1st Floor"
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="py-space-sm px-space-md rounded-lg bg-secondary text-on-secondary font-label-lg hover:bg-on-secondary-container transition-colors shadow-sm flex items-center justify-center gap-space-xs cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Create Floor Level</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-space-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            {floors.map((f) => (
              <div
                key={f.id}
                className="p-space-lg rounded-xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex flex-col gap-space-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {f.floor_name}
                  </span>
                  <span className="px-space-xs py-0.5 rounded font-label-md text-label-md bg-surface-container-high text-on-surface">
                    Level {f.floor_number}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {(f.rooms || []).length} Configured Rooms
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
