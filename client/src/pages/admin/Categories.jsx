import React, { useState } from 'react';
import { useResidency } from '../../context/ResidencyContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { formatINR } from '../../utils/currencyUtils';
import roomService from '../../services/roomService';
import { Tags, Plus, Edit2, Trash2, Users, CheckSquare, Sparkles } from 'lucide-react';

const COMMON_AMENITIES = ['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser', 'Mini Fridge', 'Smart TV', 'Room Service'];

export function AdminCategories() {
  const { categories, refreshCategories } = useResidency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxPersons, setMaxPersons] = useState(2);
  const [pricePer24Hours, setPricePer24Hours] = useState(1500);
  const [selectedAmenities, setSelectedAmenities] = useState(['TV', 'Attached Bathroom']);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenAdd() {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setMaxPersons(2);
    setPricePer24Hours(1500);
    setSelectedAmenities(['TV', 'Attached Bathroom']);
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat) {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setMaxPersons(cat.max_persons || cat.max_occupancy || 2);
    setPricePer24Hours(cat.price_per_24_hours || cat.base_price || 1500);
    setSelectedAmenities(cat.amenities || ['TV', 'Attached Bathroom']);
    setIsModalOpen(true);
  }

  function toggleAmenity(amenity) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingCategory) {
        await roomService.updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim(),
          max_persons: Number(maxPersons),
          price_per_24_hours: Number(pricePer24Hours),
          amenities: selectedAmenities,
        });
      } else {
        await roomService.createCategory({
          name: name.trim(),
          description: description.trim(),
          max_persons: Number(maxPersons),
          price_per_24_hours: Number(pricePer24Hours),
          amenities: selectedAmenities,
        });
      }
      await refreshCategories();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this category?')) {
      await roomService.deleteCategory(id);
      await refreshCategories();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
            <Tags className="w-6 h-6 text-amber-600" />
            Room Categories & Pricing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Define room classifications, 24-hour tariff rates, and amenities</p>
        </div>

        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <Card key={cat.id} className="p-5 space-y-3.5 flex flex-col justify-between border-slate-200">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{cat.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cat.description || 'Standard room tier'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price & Capacity */}
              <div className="my-3 py-2.5 border-y border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Tariff / 24h</span>
                  <p className="text-base font-extrabold text-emerald-700 font-mono">
                    {formatINR(cat.price_per_24_hours || cat.base_price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Max Persons</span>
                  <p className="text-sm font-bold text-slate-800">
                    {cat.max_persons || cat.max_occupancy || 2} Persons
                  </p>
                </div>
              </div>

              {/* Amenities tags */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Included Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(cat.amenities || ['TV', 'Attached Bathroom']).map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Room Category' : 'Create Room Category'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Category Name *"
            placeholder="e.g. AC Double, Deluxe Suite"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="e.g. Luxury suite with king bed and balcony"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price / 24 Hours (₹) *"
              type="number"
              value={pricePer24Hours}
              onChange={(e) => setPricePer24Hours(e.target.value)}
              required
            />

            <Input
              label="Max Persons Limit *"
              type="number"
              value={maxPersons}
              onChange={(e) => setMaxPersons(e.target.value)}
              required
            />
          </div>

          {/* Amenities checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Amenities Checklist</label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_AMENITIES.map((am) => {
                const isChecked = selectedAmenities.includes(am);
                return (
                  <button
                    key={am}
                    type="button"
                    onClick={() => toggleAmenity(am)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isChecked
                        ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'}`}>
                      {isChecked ? '✓' : ''}
                    </span>
                    <span>{am}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminCategories;
