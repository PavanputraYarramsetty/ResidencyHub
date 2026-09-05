import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CustomerAutosuggest from '../customers/CustomerAutosuggest';
import { formatINR } from '../../utils/currencyUtils';
import { Upload, Shield, FileText, Image, X } from 'lucide-react';

export function NewBookingModal({ isOpen, onClose, room, onConfirmBooking }) {
  const aadhaarInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [numberOfPersons, setNumberOfPersons] = useState(1);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [bookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  function handleAadhaarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAadhaarFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setAadhaarPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAadhaarPreview(file.name);
    }
  }

  function handlePhotoFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(file.name);
    }
  }

  function removeAadhaarFile() {
    setAadhaarFile(null);
    setAadhaarPreview(null);
    if (aadhaarInputRef.current) aadhaarInputRef.current.value = '';
  }

  function removePhotoFile() {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  if (!isOpen || !room) return null;

  const category = room.room_categories || { name: 'Standard', base_price: 1500, max_occupancy: 2 };
  const ratePerDay = category.base_price || room.base_price || 1500;

  function handleSelectCustomer(cust) {
    setSelectedCustomer(cust);
    if (cust.full_name) setCustomerName(cust.full_name);
    if (cust.phone) setPhone(cust.phone);
    if (cust.age) setAge(cust.age);
    if (cust.gender) setGender(cust.gender);
    if (cust.address) setAddress(cust.address);
    if (cust.aadhar_number) setAadharNumber(cust.aadhar_number);
  }

  function handleClearCustomer() {
    setSelectedCustomer(null);
    setCustomerName('');
    setPhone('');
    setAge('');
    setGender('Male');
    setAddress('');
    setAadharNumber('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      alert('Please provide Customer Name and Phone Number');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmBooking({
        room_id: room.id,
        customer_id: selectedCustomer?.id || null,
        full_name: customerName.trim(),
        phone: phone.trim(),
        age: age ? Number(age) : null,
        gender,
        address: address.trim(),
        aadhar_number: aadharNumber.trim(),
        no_of_persons: Number(numberOfPersons),
        no_of_days: Math.max(1, Number(numberOfDays) || 1),
        booking_date: bookingDate,
        rate_per_day: ratePerDay,
        total_amount: ratePerDay * Math.max(1, Number(numberOfDays) || 1),
        advance_amount: advanceAmount ? Number(advanceAmount) : 0,
        payment_mode: paymentMode,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`New Walk-In Booking — Room ${room.room_number}`} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Room & Pricing Header */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-['Inter']">
              Assigned Room
            </span>
            <p className="text-base font-extrabold text-slate-900 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
              Room {room.room_number} <span className="text-xs font-semibold text-blue-600 font-['Inter']">({category.name})</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-['Inter']">
              24-Hour Stay Rate
            </span>
            <p className="text-base font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans']">
              {formatINR(ratePerDay)}
            </p>
          </div>
        </div>

        {/* Selected Customer Banner */}
        {selectedCustomer && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between font-['Inter']">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Returning Guest Auto-Filled: {selectedCustomer.full_name}
                </p>
                <p className="text-[11px] text-emerald-700 font-mono">
                  {selectedCustomer.phone} {selectedCustomer.address ? `• ${selectedCustomer.address}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              Clear / New Guest
            </button>
          </div>
        )}

        {/* Customer Search & Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
            Guest Name / Returning Guest Search *
          </label>
          <CustomerAutosuggest
            value={customerName}
            onChange={(val) => {
              setCustomerName(val);
              if (selectedCustomer && val !== selectedCustomer.full_name) {
                setSelectedCustomer(null);
              }
            }}
            onSelectCustomer={handleSelectCustomer}
          />
        </div>

        {/* Phone & Age & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Phone Number *"
            type="tel"
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Age"
            type="number"
            placeholder="e.g. 32"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-all shadow-xs"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Address & Aadhaar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="City / Address"
            placeholder="e.g. Hyderabad, Telangana"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label="Aadhaar Number"
            placeholder="12-digit Aadhaar (masked)"
            value={aadharNumber}
            onChange={(e) => setAadharNumber(e.target.value)}
          />
        </div>

        {/* Hidden System File Inputs */}
        <input
          type="file"
          ref={aadhaarInputRef}
          onChange={handleAadhaarFileChange}
          accept="image/*,application/pdf"
          className="hidden"
        />
        <input
          type="file"
          ref={photoInputRef}
          onChange={handlePhotoFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Real Document Upload & Media Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 font-['Inter']">
          {/* Aadhaar Card Upload */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" /> Aadhaar Card / ID Upload
            </span>

            {aadhaarFile ? (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {aadhaarPreview && typeof aadhaarPreview === 'string' && aadhaarPreview.startsWith('data:image') ? (
                    <img src={aadhaarPreview} alt="Aadhaar preview" className="w-10 h-10 object-cover rounded-lg border border-emerald-300 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-emerald-700" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-emerald-950 truncate">{aadhaarFile.name}</p>
                    <p className="text-[10px] text-emerald-700 font-mono">{(aadhaarFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAadhaarFile}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-200/60 transition-colors cursor-pointer shrink-0"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => aadhaarInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-blue-50/50 hover:border-blue-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
              >
                <Upload className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>Upload Aadhaar File / Photo</span>
              </button>
            )}
          </div>

          {/* Guest Photo / Passport Upload */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-600" /> Guest Photo / Passport Upload
            </span>

            {photoFile ? (
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {photoPreview && typeof photoPreview === 'string' && photoPreview.startsWith('data:image') ? (
                    <img src={photoPreview} alt="Photo preview" className="w-10 h-10 object-cover rounded-lg border border-purple-300 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                      <Image className="w-5 h-5 text-purple-700" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-purple-950 truncate">{photoFile.name}</p>
                    <p className="text-[10px] text-purple-700 font-mono">{(photoFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePhotoFile}
                  className="p-1 rounded-lg text-purple-700 hover:bg-purple-200/60 transition-colors cursor-pointer shrink-0"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-purple-50/50 hover:border-purple-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
              >
                <Upload className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span>Upload Passport / Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Stay Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            label="No. of Days *"
            type="number"
            min="1"
            placeholder="1"
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
              No. of Persons
            </label>
            <select
              value={numberOfPersons}
              onChange={(e) => setNumberOfPersons(Number(e.target.value))}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-all shadow-xs"
            >
              {Array.from({ length: category.max_occupancy || 4 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Person{i > 0 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Advance Amount (₹)"
            type="number"
            placeholder="0"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Inter']">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-all shadow-xs"
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Card">Debit / Credit Card</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="success" isLoading={submitting}>
            Confirm & Check In
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default NewBookingModal;
