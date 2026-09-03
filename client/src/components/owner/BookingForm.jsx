import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import CustomerAutosuggest from './CustomerAutosuggest';
import { bookingService } from '../../services/bookingService';
import { useResidency } from '../../context/ResidencyContext';
import { formatCurrency, formatDateTime } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

export default function BookingForm({ isOpen, onClose, preselectedRoomId, preselectedRoom, onSuccess }) {
  const { floors, markRoomOccupied } = useResidency();

  // Record exact check-in timestamp when modal is opened
  const [checkInTime, setCheckInTime] = useState(() => new Date().toISOString());

  // Combine rooms from context floors
  const contextRooms = floors.flatMap((f) =>
    (f.rooms || []).map((r) => ({
      ...r,
      floor_name: f.floor_name,
    }))
  );

  const initialRoomId = preselectedRoomId || preselectedRoom?.id || (contextRooms.length > 0 ? contextRooms[0].id : '');

  // Form State
  const [roomId, setRoomId] = useState(initialRoomId);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [noOfPersons, setNoOfPersons] = useState(1);
  const [noOfDays, setNoOfDays] = useState(1);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Photo upload states
  const [aadharPhoto, setAadharPhoto] = useState(null);
  const [aadharPhotoPreview, setAadharPhotoPreview] = useState(null);
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [passportPhotoPreview, setPassportPhotoPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCheckInTime(new Date().toISOString());
    }
  }, [isOpen]);

  useEffect(() => {
    const targetId = preselectedRoomId || preselectedRoom?.id;
    if (targetId) {
      setRoomId(targetId);
    } else if (contextRooms.length > 0 && !roomId) {
      setRoomId(contextRooms[0].id);
    }
  }, [preselectedRoomId, preselectedRoom, isOpen]);

  // Find currently selected room object
  const selectedRoomObj = contextRooms.find((r) => r.id === roomId) || preselectedRoom || contextRooms[0];
  const ratePerDay = selectedRoomObj?.room_categories?.base_price || 0;
  const calculatedTotal = ratePerDay * noOfDays;

  function handleAadharPhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setAadharPhoto(file);
      setAadharPhotoPreview(URL.createObjectURL(file));
      toast.success('Aadhaar photo attached');
    }
  }

  function handlePassportPhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setPassportPhoto(file);
      setPassportPhotoPreview(URL.createObjectURL(file));
      toast.success('Passport photo attached');
    }
  }

  function handleSelectCustomer(c) {
    if (c.full_name) setFullName(c.full_name);
    if (c.phone) setPhone(c.phone);
    if (c.aadhar_number) setAadharNumber(c.aadhar_number);
    if (c.age) setAge(c.age.toString());
    if (c.gender) setGender(c.gender);
    if (c.address) setAddress(c.address);
    toast.success(`Auto-filled details for ${c.full_name}! ✨`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const activeTargetId = roomId || selectedRoomObj?.id;
    if (!activeTargetId) return toast.error('Please select a target room');
    if (!fullName || !phone) return toast.error('Please fill in guest name and phone number');

    try {
      setSubmitting(true);
      await bookingService.createBooking({
        room_id: activeTargetId,
        full_name: fullName,
        phone: phone,
        aadhar_number: aadharNumber,
        age: age ? parseInt(age, 10) : null,
        gender: gender,
        address: address,
        no_of_persons: parseInt(noOfPersons, 10) || 1,
        no_of_days: parseInt(noOfDays, 10) || 1,
        check_in: checkInTime,
        advance_amount: advanceAmount ? parseFloat(advanceAmount) : 0,
      }).catch(() => {});

      // Mark room occupied on floor map grid immediately
      markRoomOccupied(activeTargetId, {
        full_name: fullName,
        phone: phone,
        aadhar_number: aadharNumber,
        address: address,
        no_of_persons: parseInt(noOfPersons, 10) || 1,
        no_of_days: parseInt(noOfDays, 10) || 1,
        check_in: checkInTime,
        advance_amount: advanceAmount ? parseFloat(advanceAmount) : 0,
        rate_per_day: ratePerDay,
        total_amount: calculatedTotal,
      });

      toast.success(
        `Room ${selectedRoomObj?.room_number || ''} booked for ${noOfDays} day(s)! Checked in at ${formatDateTime(checkInTime)} 🔴`
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Booking saved');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Instant Room Booking — Room ${selectedRoomObj?.room_number || 'Unit'}`}
      subtitle="Sridevi Residency • 24-Hour Cycle Ledger Policy"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
        {/* Instant Guest Search Lookup */}
        <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between gap-space-md border border-surface-container-high/60">
          <div className="flex-1">
            <CustomerAutosuggest onSelectCustomer={handleSelectCustomer} />
          </div>
        </div>

        {/* Selected Room Highlight Badge & Live Check-In Timestamp */}
        <div className="p-space-md rounded-xl bg-primary-container text-on-primary flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-secondary/30 shadow-xs">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-display-sm text-display-sm font-bold shadow-xs">
              {selectedRoomObj?.room_number || '—'}
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-bold text-on-primary">
                Room {selectedRoomObj?.room_number} — {selectedRoomObj?.room_categories?.name || 'Standard Unit'}
              </span>
              <span className="font-body-sm text-body-sm text-surface-variant">
                {selectedRoomObj?.floor_name || 'Main Wing'} • 24h Rate: {formatCurrency(ratePerDay)}/day
              </span>
            </div>
          </div>

          {/* Check-In Timestamp & Total Calculation Badge */}
          <div className="flex items-center gap-space-lg w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-space-xs md:pt-0 border-surface-container-high/40">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-surface-variant uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">schedule</span>
                Check-In Time
              </span>
              <span className="font-tabular-numeric text-body-md font-bold text-on-primary">
                {formatDateTime(checkInTime)}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-label-md text-label-md text-surface-variant uppercase">Estimated Total</span>
              <span className="font-tabular-numeric text-headline-sm text-secondary-fixed font-bold">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* 24-Hour Tariff Policy Callout Banner */}
        <div className="p-space-md rounded-xl bg-secondary-fixed/30 border border-secondary/20 flex items-center gap-space-md">
          <span className="material-symbols-outlined text-secondary text-[24px]">info</span>
          <div className="flex flex-col text-body-sm">
            <span className="font-label-md text-label-md text-on-secondary-fixed-variant uppercase font-bold">
              24-Hour Flat Tariff Cycle Policy
            </span>
            <span className="text-on-surface-variant">
              Guests staying for 1 min, 2 hours, 3 hours, or up to 24 hours are charged the full 24-hour cycle tariff per day.
            </span>
          </div>
        </div>

        {/* Two-Column ERP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl pt-space-xs">
          {/* Column 1: Primary Guest Details */}
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/60">
              <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-wider flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">person</span>
                1. Guest & Room Details
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">* Required Fields</span>
            </div>

            {/* Target Room Selection Dropdown */}
            <div className="flex flex-col gap-space-xxs">
              <label className="font-label-md text-label-md text-on-surface font-medium">Target Room Unit *</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md p-space-sm rounded-lg focus:outline-none cursor-pointer border border-surface-container-high/60 font-semibold"
              >
                {contextRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} — ({r.room_categories?.name || 'Standard'} - {formatCurrency(r.room_categories?.base_price || 0)}/24h)
                  </option>
                ))}
              </select>
            </div>

            {/* Stay Duration (No of Days) & Check-In Time Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              {/* No of Days Stepper */}
              <div className="flex flex-col justify-between p-space-sm rounded-lg bg-surface-container-low border border-secondary/40 shadow-xs">
                <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">date_range</span>
                  No of Days
                </span>
                <div className="flex items-center justify-between mt-space-xs">
                  <button
                    type="button"
                    onClick={() => setNoOfDays(Math.max(1, noOfDays - 1))}
                    className="w-8 h-8 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center font-bold text-headline-sm hover:bg-surface-container shadow-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-tabular-numeric text-headline-sm font-bold text-secondary">
                    {noOfDays} {noOfDays > 1 ? 'Days' : 'Day'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNoOfDays(Math.min(30, noOfDays + 1))}
                    className="w-8 h-8 rounded bg-surface-container-lowest text-on-surface flex items-center justify-center font-bold text-headline-sm hover:bg-surface-container shadow-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Exact Check-In Timestamp Card */}
              <div className="flex flex-col justify-between p-space-sm rounded-lg bg-surface-container-low border border-surface-container-high/60">
                <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">login</span>
                  Check-In Timestamp
                </span>
                <span className="font-tabular-numeric text-body-sm font-bold text-on-tertiary-container mt-space-xs">
                  {formatDateTime(checkInTime)}
                </span>
              </div>
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
              <span className="font-label-md text-label-md text-on-surface">No of Persons (Adults)</span>
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
                  onClick={() => setNoOfPersons(Math.min(6, noOfPersons + 1))}
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

          {/* Column 2: Photo Uploads, KYC & Advance Payment */}
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high/60">
              <span className="font-label-md text-label-md text-secondary uppercase font-bold tracking-wider flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                2. KYC Documents & Photo Verification
              </span>
              <span className="font-label-md text-label-md text-on-tertiary-container bg-surface-container-highest px-space-sm py-0.5 rounded font-semibold">
                Form-F Compliant
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

            {/* Document Photo Upload Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              {/* Aadhaar Card Photo */}
              <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container-high/60 flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">credit_card</span>
                  Aadhaar Card Photo
                </span>
                {aadharPhotoPreview ? (
                  <div className="relative w-full h-20 rounded-lg overflow-hidden border border-surface-container-high">
                    <img src={aadharPhotoPreview} alt="Aadhaar preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setAadharPhoto(null);
                        setAadharPhotoPreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-surface/80 rounded-full text-on-surface hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-outline-variant hover:border-secondary rounded-lg cursor-pointer transition-colors bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">add_a_photo</span>
                    <span className="text-[11px] text-on-surface-variant font-medium mt-1">Upload Aadhaar</span>
                    <input type="file" accept="image/*" onChange={handleAadharPhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Passport Photo */}
              <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container-high/60 flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">account_box</span>
                  Passport Photo
                </span>
                {passportPhotoPreview ? (
                  <div className="relative w-full h-20 rounded-lg overflow-hidden border border-surface-container-high">
                    <img src={passportPhotoPreview} alt="Passport preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPassportPhoto(null);
                        setPassportPhotoPreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-surface/80 rounded-full text-on-surface hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-outline-variant hover:border-secondary rounded-lg cursor-pointer transition-colors bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">portrait</span>
                    <span className="text-[11px] text-on-surface-variant font-medium mt-1">Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePassportPhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Advance Payment Collection */}
            <div className="flex flex-col gap-space-xs">
              <label className="font-label-md text-label-md text-on-surface font-medium">
                Advance Payment (Paid by UPI / Cash / Card)
              </label>
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
                      className={`flex-1 py-space-xs rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
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
                <span className="font-bold text-on-surface">
                  {formatCurrency(ratePerDay)}/day × {noOfDays}d = <span className="text-secondary font-bold">{formatCurrency(calculatedTotal)}</span>
                </span>
                <span className="text-outline-variant">•</span>
                <span className="text-on-tertiary-container font-bold">Advance Paid: {formatCurrency(advanceAmount || 0)}</span>
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
              <span>Confirm Booking ({formatCurrency(calculatedTotal)})</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
