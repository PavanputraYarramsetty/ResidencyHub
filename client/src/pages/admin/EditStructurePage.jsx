import { useState } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import Modal from '../../components/common/Modal';
import { formatCurrency } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

const ROOM_CATEGORIES_PRESETS = [
  { id: 'cat-1', name: 'AC Single', base_price: 1500 },
  { id: 'cat-2', name: 'AC Double', base_price: 2000 },
  { id: 'cat-3', name: 'Non-AC Single', base_price: 800 },
  { id: 'cat-4', name: 'Non-AC Double', base_price: 1200 },
  { id: 'cat-5', name: 'Deluxe Suite', base_price: 3000 },
];

export default function EditStructurePage() {
  const { floors, addFloor, deleteFloor, addRoom, deleteRoom } = useResidency();

  // Modal States
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorNumber, setNewFloorNumber] = useState('');

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [targetFloorId, setTargetFloorId] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('cat-1');
  const [customPrice, setCustomPrice] = useState('');

  // Handle Create Floor
  function handleCreateFloor(e) {
    e.preventDefault();
    if (!newFloorName) return toast.error('Please enter a floor name');
    addFloor(newFloorName, newFloorNumber || floors.length);
    toast.success(`Floor "${newFloorName}" created successfully!`);
    setNewFloorName('');
    setNewFloorNumber('');
    setShowAddFloorModal(false);
  }

  // Handle Delete Floor
  function handleDeleteFloor(floor) {
    if (window.confirm(`Are you sure you want to delete ${floor.floor_name} and all rooms in it?`)) {
      deleteFloor(floor.id);
      toast.success(`${floor.floor_name} removed.`);
    }
  }

  // Open Add Room Modal for a specific floor
  function openAddRoomForFloor(floorId) {
    setTargetFloorId(floorId);
    setNewRoomNumber('');
    setSelectedPresetId('cat-1');
    const preset = ROOM_CATEGORIES_PRESETS[0];
    setCustomPrice(preset.base_price.toString());
    setShowAddRoomModal(true);
  }

  // Handle Preset Change
  function handleCategoryPresetChange(catId) {
    setSelectedPresetId(catId);
    const preset = ROOM_CATEGORIES_PRESETS.find((c) => c.id === catId);
    if (preset) setCustomPrice(preset.base_price.toString());
  }

  // Handle Create Room
  function handleCreateRoom(e) {
    e.preventDefault();
    if (!newRoomNumber) return toast.error('Please enter a room number');
    if (!targetFloorId) return toast.error('Target floor required');

    const preset = ROOM_CATEGORIES_PRESETS.find((c) => c.id === selectedPresetId) || ROOM_CATEGORIES_PRESETS[0];
    const categoryObj = {
      id: preset.id,
      name: preset.name,
      base_price: customPrice ? parseFloat(customPrice) : preset.base_price,
    };

    addRoom(targetFloorId, {
      room_number: newRoomNumber,
      category: categoryObj,
    });

    const targetFloor = floors.find((f) => f.id === targetFloorId);
    toast.success(`Room ${newRoomNumber} added to ${targetFloor?.floor_name || 'Floor'}! 🏨`);
    setShowAddRoomModal(false);
  }

  // Handle Delete Room
  function handleDeleteRoom(floorId, room) {
    if (window.confirm(`Are you sure you want to remove Room ${room.room_number}?`)) {
      deleteRoom(floorId, room.id);
      toast.success(`Room ${room.room_number} deleted.`);
    }
  }

  const targetFloorObj = floors.find((f) => f.id === targetFloorId);

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-lg px-space-lg">
      {/* Top Command Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 mt-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              Admin Hotel Upgradation Console
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">
            Edit Structure & Room Inventory
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Add or remove floor levels, configure room categories & tariffs. All structural changes reflect live on the owner map grid.
          </p>
        </div>

        <button
          onClick={() => setShowAddFloorModal(true)}
          className="px-space-lg py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg hover:bg-on-secondary-container transition-colors flex items-center gap-space-xs shadow-sm cursor-pointer font-bold"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
          <span>+ Add New Floor Level</span>
        </button>
      </div>

      {/* Structural Floors & Rooms List */}
      <div className="flex flex-col gap-space-xl">
        {floors.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high/60">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">apartment</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No Floor Levels Found</h3>
            <p className="text-body-sm text-on-surface-variant mt-1">Click "+ Add New Floor Level" above to start building the hotel structure.</p>
          </div>
        ) : (
          floors.map((floor) => {
            const rooms = floor.rooms || [];
            return (
              <div
                key={floor.id}
                className="flex flex-col gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60"
              >
                {/* Floor Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container-high/60 pb-space-md">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-headline-sm text-headline-sm font-bold shadow-xs">
                      {floor.floor_number ?? floor.floor_name?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-headline-md text-headline-md text-on-surface leading-tight font-bold">
                        {floor.floor_name}
                      </h2>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {rooms.length} Room{rooms.length !== 1 ? 's' : ''} Configured on Level {floor.floor_number ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <button
                      onClick={() => openAddRoomForFloor(floor.id)}
                      className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors border border-surface-container-high cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">add</span>
                      <span>Add Room to {floor.floor_name}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFloor(floor)}
                      className="p-space-xs rounded-lg text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                      title="Delete Floor Level"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Rooms Grid inside Floor */}
                {rooms.length === 0 ? (
                  <div className="p-space-md text-center bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                    <span className="text-body-sm text-on-surface-variant">
                      No rooms present on {floor.floor_name}. Click <strong>"+ Add Room to {floor.floor_name}"</strong> to add rooms.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-space-md">
                    {rooms.map((room) => {
                      const category = room.room_categories || {};
                      const isOccupied = room.status === 'occupied';

                      return (
                        <div
                          key={room.id}
                          className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/60 flex flex-col justify-between gap-space-sm relative group hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col">
                              <span className="font-display-sm text-display-sm font-bold text-on-surface">
                                Room {room.room_number}
                              </span>
                              <span className="font-label-md text-label-md text-secondary font-semibold">
                                {category.name || 'Standard'}
                              </span>
                            </div>

                            <span
                              className={`px-space-xs py-0.5 rounded font-label-md text-[11px] font-bold ${
                                isOccupied
                                  ? 'bg-error-container text-on-error-container'
                                  : 'bg-on-tertiary-container/10 text-on-tertiary-container'
                              }`}
                            >
                              {isOccupied ? 'Occupied' : 'Available'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-surface-container-high/40 pt-space-xs font-tabular-numeric">
                            <span className="text-body-sm text-on-surface-variant">24h Tariff:</span>
                            <span className="font-bold text-on-surface text-body-md">
                              {formatCurrency(category.base_price || 0)}
                            </span>
                          </div>

                          {/* Delete Room Action */}
                          <div className="flex justify-end pt-space-xxs">
                            <button
                              onClick={() => handleDeleteRoom(floor.id, room)}
                              className="text-xs text-error hover:underline flex items-center gap-0.5 cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              <span>Delete Room</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Add New Floor Level */}
      {showAddFloorModal && (
        <Modal
          isOpen={showAddFloorModal}
          onClose={() => setShowAddFloorModal(false)}
          title="Add New Floor Level"
          subtitle="Expand residency structure with new floors"
          size="md"
        >
          <form onSubmit={handleCreateFloor} className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">
                Floor Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="e.g. 3rd Floor or Executive Suite Floor"
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high/60"
              />
            </div>

            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">Floor Index / Level Number</label>
              <input
                type="number"
                value={newFloorNumber}
                onChange={(e) => setNewFloorNumber(e.target.value)}
                placeholder={floors.length.toString()}
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric focus:outline-none border border-surface-container-high/60"
              />
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-md border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setShowAddFloorModal(false)}
                className="px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg transition-colors border border-surface-container-high/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-space-xl py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg hover:bg-on-secondary-container transition-colors font-bold cursor-pointer"
              >
                Create Floor
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Add Room to Floor */}
      {showAddRoomModal && (
        <Modal
          isOpen={showAddRoomModal}
          onClose={() => setShowAddRoomModal(false)}
          title={`Add Room to ${targetFloorObj?.floor_name || 'Floor'}`}
          subtitle="Specify room number, category type, and 24-hour rate"
          size="md"
        >
          <form onSubmit={handleCreateRoom} className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">
                Room Number <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                placeholder="e.g. 106 or 301"
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high/60 font-bold"
              />
            </div>

            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">Room Category Preset</label>
              <select
                value={selectedPresetId}
                onChange={(e) => handleCategoryPresetChange(e.target.value)}
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none border border-surface-container-high/60 cursor-pointer"
              >
                {ROOM_CATEGORIES_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} — ({formatCurrency(preset.base_price)}/24h)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">
                24-Hour Tariff Rate (₹)
              </label>
              <div className="flex rounded-lg overflow-hidden border border-surface-container-high/60 bg-surface-container-low">
                <span className="px-space-md py-space-sm bg-surface-container text-on-surface-variant font-bold flex items-center justify-center">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="1500"
                  className="w-full px-space-md py-space-sm bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-md border-t border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg transition-colors border border-surface-container-high/60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-space-xl py-space-sm rounded-lg bg-secondary text-on-secondary font-label-lg hover:bg-on-secondary-container transition-colors font-bold cursor-pointer"
              >
                Add Room Unit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
