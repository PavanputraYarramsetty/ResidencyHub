import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../common/Modal';
import CustomerAutosuggest from './CustomerAutosuggest';
import { validateBookingForm } from '../../utils/validators';
import { customerService } from '../../services/customerService';
import { bookingService } from '../../services/bookingService';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import {
  User, Phone, MapPin, CreditCard, Calendar, Users, Camera, Upload, X
} from 'lucide-react';

const initialForm = {
  full_name: '',
  phone: '',
  age: '',
  address: '',
  aadhar_number: '',
  no_of_persons: 1,
  booking_date: new Date().toISOString().split('T')[0],
};

export default function BookingForm({ isOpen, onClose, room, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aadharFile, setAadharFile] = useState(null);
  const [passportFile, setPassportFile] = useState(null);

  const category = room?.room_categories || {};

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }

  function handleCustomerSelect(customer) {
    setForm(prev => ({
      ...prev,
      full_name: customer.full_name || prev.full_name,
      phone: customer.phone || prev.phone,
      age: customer.age || prev.age,
      address: customer.address || prev.address,
      aadhar_number: customer.aadhar_number || prev.aadhar_number,
    }));
    setSearchQuery(customer.full_name);
    toast.success(`Customer "${customer.full_name}" loaded`);
  }

  async function uploadFile(file, bucket) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      console.error(`Upload error (${bucket}):`, error);
      return null;
    }
    return data?.path || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validateBookingForm(form);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);

      // Upload photos if provided
      let aadhar_photo_url = null;
      let passport_photo_url = null;

      if (aadharFile) {
        aadhar_photo_url = await uploadFile(aadharFile, 'aadhar-photos');
      }
      if (passportFile) {
        passport_photo_url = await uploadFile(passportFile, 'passport-photos');
      }

      // Find or create customer
      const { customer } = await customerService.findOrCreateCustomer({
        full_name: form.full_name,
        phone: form.phone,
        age: form.age ? Number(form.age) : null,
        address: form.address,
        aadhar_number: form.aadhar_number,
        aadhar_photo_url,
        passport_photo_url,
      });

      // Create booking
      await bookingService.createBooking({
        room_id: room.id,
        customer_id: customer.id,
        no_of_persons: Number(form.no_of_persons) || 1,
        booking_date: form.booking_date,
        rate_per_day: Number(category.base_price),
      });

      toast.success(`Room ${room.room_number} booked for ${form.full_name} ✅`);
      setForm(initialForm);
      setSearchQuery('');
      setAadharFile(null);
      setPassportFile(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book Room ${room?.room_number || ''}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Room info banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Room {room?.room_number} — {category.name}
            </p>
            <p className="text-xs font-semibold text-amber-700">₹{Number(category.base_price || 0).toLocaleString()} / 24-Hour Cycle</p>
          </div>
        </div>

        {/* Customer autosuggest */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">Search Existing Customer</label>
          <CustomerAutosuggest
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleCustomerSelect}
          />
        </div>

        <hr className="border-surface-200" />

        {/* Customer details form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.full_name ? 'border-red-400 focus:ring-red-500/20' : 'border-surface-200 focus:border-brand-500 focus:ring-brand-500/20'
                } focus:ring-2`}
                placeholder="Customer name"
              />
            </div>
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Phone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.phone ? 'border-red-400 focus:ring-red-500/20' : 'border-surface-200 focus:border-brand-500 focus:ring-brand-500/20'
                } focus:ring-2`}
                placeholder="10-digit phone number"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              placeholder="Age"
              min="1"
              max="150"
            />
            {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
          </div>

          {/* Persons */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">No. of Persons</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="number"
                value={form.no_of_persons}
                onChange={(e) => handleChange('no_of_persons', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                min="1"
                max={category.max_occupancy || 4}
              />
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-surface-400" />
              <textarea
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                rows="2"
                placeholder="Full address"
              />
            </div>
          </div>

          {/* Aadhar */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Aadhar Number</label>
            <input
              type="text"
              value={form.aadhar_number}
              onChange={(e) => handleChange('aadhar_number', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                errors.aadhar_number ? 'border-red-400' : 'border-surface-200 focus:border-brand-500'
              } focus:ring-2 focus:ring-brand-500/20`}
              placeholder="12-digit Aadhar"
              maxLength="14"
            />
            {errors.aadhar_number && <p className="text-xs text-red-500 mt-1">{errors.aadhar_number}</p>}
          </div>

          {/* Booking Date */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Booking Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="date"
                value={form.booking_date}
                onChange={(e) => handleChange('booking_date', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-surface-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
            {errors.booking_date && <p className="text-xs text-red-500 mt-1">{errors.booking_date}</p>}
          </div>
        </div>

        {/* Photo uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Aadhar Photo</label>
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-surface-300 cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all text-sm text-surface-500">
              <Upload className="w-4 h-4" />
              {aadharFile ? aadharFile.name : 'Upload Aadhar photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAadharFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Passport Photo</label>
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-surface-300 cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all text-sm text-surface-500">
              <Camera className="w-4 h-4" />
              {passportFile ? passportFile.name : 'Upload passport photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-gold hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                Confirming Stay...
              </span>
            ) : 'Confirm & Check-In'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
