import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import CustomerAutosuggest from './CustomerAutosuggest';
import { bookingService } from '../../services/bookingService';
import { roomService } from '../../services/roomService';
import { formatCurrency } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

export default function BookingForm({ isOpen, onClose, preselectedRoomId, onSuccess }) {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Form State
  const [roomId, setRoomId] = useState(preselectedRoomId || '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [noOfPersons, setNoOfPersons] = useState(1);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) fetchAvailableRooms();
  }, [isOpen]);

  useEffect(() => {
    if (preselectedRoomId) setRoomId(preselectedRoomId);
  }, [preselectedRoomId]);

  async function fetchAvailableRooms() {
    try {
      setLoadingRooms(true);
      const data = await roomService.getAvailableRooms();
      setRooms(data || []);
      if (!roomId && data?.length > 0) {
        setRoomId(data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load available rooms');
    } finally {
      setLoadingRooms(false);
    }
  }

  // Auto-fill from customer autosuggest
  function handleSelectCustomer(c) {
    if (c.full_name) setFullName(c.full_name);
    if (c.phone) setPhone(c.phone);
    if (c.aadhar_number) setAadharNumber(c.aadhar_number);
    if (c.age) setAge(c.age.toString());
    if (c.gender) setGender(c.gender);
    if (c.address) setAddress(c.address);
    toast.success(`Auto-filled details for ${c.full_name}! ✨`);
  }

  const selectedRoomObj = rooms.find((r) => r.id === roomId);
  const roomPrice = selectedRoomObj?.room_categories?.base_price || 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roomId) return toast.error('Please select a room');
    if (!fullName || !phone) return toast.error('Please fill in guest name and phone number');

    try {
      setSubmitting(true);
      await bookingService.createBooking({
        room_id: roomId,
        full_name: fullName,
        phone: phone,
        aadhar_number: aadharNumber,
        age: age ? parseInt(age, 10) : null,
        gender: gender,
        address: address,
        no_of_persons: parseInt(noOfPersons, 10) || 1,
        advance_amount: advanceAmount ? parseFloat(advanceAmount) : 0,
      });

      toast.success('Instant Check-In completed! Key slip generated ✅');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-In failed');
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const dueTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instant Check-In & Folio Creator"
      subtitle="Sridevi Residency • 24-Hour Cycle Ledger"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
        {/* Instant Lookup Banner */}
        <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between gap-space-md border border-surface-container-high/60">
          <div className="flex-1">
            <CustomerAutosuggest onSelectCustomer={handleSelectCustomer} />
          </div>
        </div>

        {/* Two-Column ERP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl pt-space-xs">
          {/* Column 1: Guest Personal & Residence Details */}
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/60">
              <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-wider flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">person</span>
                1. Primary Guest Details
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">* Mandatory Govt Fields</span>
            </div>

            {/* Room Selection */}
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">Select Target Room *</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md p-space-sm rounded-lg focus:outline-none cursor-pointer border border-surface-container-high/60"
              >
                {loadingRooms ? (
                  <option>Loading available units...</option>
                ) : rooms.length === 0 ? (
                  <option value="">No vacant rooms available</option>
                ) : (
                  rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} — ({r.room_categories?.name || 'Standard'} - {formatCurrency(r.room_categories?.base_price || 0)}/24h)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">
                Full Name (as per Govt ID) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Satyanarayana Murthy"
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high/60"
              />
            </div>

            {/* Phone & Age */}
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="col-span-2 flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">
                  Mobile Number <span className="text-error">*</span>
                </label>
                <div className="flex rounded-lg overflow-hidden border border-surface-container-high/60 bg-surface-container-low">
                  <span className="px-space-sm py-space-sm bg-surface-container font-tabular-numeric text-tabular-numeric text-on-surface-variant flex items-center justify-center text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98480 22338"
                    className="w-full px-space-sm py-space-sm bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric focus:outline-none"
                  />
                </div>
              </div>

              <div className="col-span-1 flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="34"
                  className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric focus:outline-none border border-surface-container-high/60"
                />
              </div>
            </div>

            {/* Occupancy Stepper */}
            <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high/60">
              <span className="font-label-md text-label-md text-on-surface">Adult Guest Count</span>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  onClick={() => setNoOfPersons(Math.max(1, noOfPersons - 1))}
                  className="w-7 h-7 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center font-bold text-headline-sm hover:bg-surface-container shadow-xs cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center font-tabular-numeric text-tabular-numeric text-on-surface">
                  {noOfPersons}
                </span>
                <button
                  type="button"
                  onClick={() => setNoOfPersons(Math.min(4, noOfPersons + 1))}
                  className="w-7 h-7 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center font-bold text-headline-sm hover:bg-surface-container shadow-xs cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">
                Permanent Address / Native City
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="D.No 4-12, Main Road, Rajahmundry, AP"
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high/60 resize-none"
              />
            </div>
          </div>

          {/* Column 2: Identity Proof, Live 24-Hour Cycle & Settlement */}
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/60">
              <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-wider flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                2. KYC & Billing Parameters
              </span>
              <span className="font-label-md text-label-md text-on-tertiary-container bg-surface-container-highest px-space-sm py-0.5 rounded font-semibold">
                Form-F Ready
              </span>
            </div>

            {/* Aadhaar Number */}
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">
                Aadhaar / Passport / Govt ID Number
              </label>
              <input
                type="text"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                placeholder="4523 8891 0042"
                className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric focus:outline-none border border-surface-container-high/60"
              />
            </div>

            {/* 24-Hour Cycle Live Clock Box */}
            <div className="p-space-md rounded-xl bg-primary-container text-on-primary flex flex-col gap-space-xs shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-space-xs">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                  <span className="font-label-md text-label-md text-surface-variant uppercase tracking-wider font-semibold">
                    24-Hour Tariff Rule
                  </span>
                </div>
                <span className="font-tabular-numeric text-tabular-numeric text-secondary-fixed">Cycle #01</span>
              </div>
              <div className="grid grid-cols-2 gap-space-md pt-space-xs">
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm text-surface-variant">Check-In Timestamp</span>
                  <span className="font-tabular-numeric text-tabular-numeric text-on-primary font-bold">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Now)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-body-sm text-body-sm text-surface-variant">Cycle Auto-Renewal / Due</span>
                  <span className="font-tabular-numeric text-tabular-numeric text-secondary-container font-bold">
                    Tomorrow, {dueTomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Advance Payment Collection */}
            <div className="flex flex-col gap-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-medium">Advance Deposit Collection (₹)</label>
              <div className="grid grid-cols-3 gap-space-sm">
                <div className="col-span-1">
                  <div className="flex rounded-lg overflow-hidden border border-surface-container-high/60 bg-surface-container-low">
                    <span className="px-space-sm py-space-sm bg-surface-container font-tabular-numeric text-tabular-numeric text-on-surface-variant flex items-center justify-center">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full px-space-sm py-space-sm bg-surface-container-low font-tabular-numeric text-tabular-numeric text-on-surface font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-2 flex items-center rounded-lg bg-surface-container-low p-space-xxs border border-surface-container-high/60">
                  {['UPI', 'Cash', 'Card'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`flex-1 py-space-xs rounded-md font-label-md text-label-md transition-colors ${
                        paymentMode === mode
                          ? 'bg-secondary text-on-secondary font-bold shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {mode === 'UPI' ? 'UPI / QR' : mode === 'Cash' ? 'Cash Desk' : 'POS Card'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-space-xl py-space-md -mx-space-xl -mb-space-xl bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-space-md border-t border-surface-container-high/60 mt-space-md">
          <div className="flex items-center gap-space-md">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Allocated Tariff Summary</span>
              <div className="flex items-center gap-space-xs font-tabular-numeric text-tabular-numeric">
                <span className="font-bold text-on-surface">24h Tariff: {formatCurrency(roomPrice)}</span>
                <span className="text-outline-variant">•</span>
                <span className="text-on-tertiary-container font-bold">Advance: {formatCurrency(advanceAmount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-sm w-full md:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-colors border border-surface-container-high/60 cursor-pointer"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-space-xl py-space-sm rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-lg text-label-lg flex items-center gap-space-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              )}
              <span>Confirm Check-In & Key Slip</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
