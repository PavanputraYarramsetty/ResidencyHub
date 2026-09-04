import Modal from '../common/Modal';
import { useBookingForm } from '../../hooks/useBookingForm';
import { formatCurrency, formatDateTime } from '../../utils/dateFormat';

export default function BookingForm({ isOpen, onClose, preselectedRoomId, preselectedRoom, onSuccess }) {
  const {
    contextRooms,
    roomId,
    setRoomId,
    fullName,
    setFullName,
    phone,
    setPhone,
    aadharNumber,
    setAadharNumber,
    age,
    setAge,
    gender,
    setGender,
    address,
    setAddress,
    noOfPersons,
    setNoOfPersons,
    noOfDays,
    setNoOfDays,
    advanceAmount,
    setAdvanceAmount,
    paymentMode,
    setPaymentMode,
    setNameQuery,
    setPhoneQuery,
    isNameFocused,
    setIsNameFocused,
    isPhoneFocused,
    setIsPhoneFocused,
    fullNameSuggestions,
    phoneSuggestions,
    nameLoading,
    aadharPhotoPreview,
    passportPhotoPreview,
    handleAadharPhotoChange,
    handlePassportPhotoChange,
    handleSelectCustomer,
    submitting,
    handleSubmit,
    selectedRoomObj,
    ratePerDay,
    calculatedTotal,
    checkInTime,
  } = useBookingForm({ isOpen, onClose, preselectedRoomId, preselectedRoom, onSuccess });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Instant Room Booking — Room ${selectedRoomObj?.room_number || 'Unit'}`}
      subtitle="Sridevi Residency • 24-Hour Cycle Ledger Policy"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
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

            {/* Full Name with Existing Guest Autosuggest Dropdown */}
            <div className="flex flex-col gap-space-xxs relative">
              <label className="font-label-md text-label-md text-on-surface font-medium flex items-center justify-between">
                <span>Full Name (as per Govt ID) <span className="text-error">*</span></span>
                {fullNameSuggestions.length > 0 && isNameFocused && (
                  <span className="text-[11px] text-secondary font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[13px]">person_search</span>
                    {fullNameSuggestions.length} Existing Guest(s) Found
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setTimeout(() => setIsNameFocused(false), 200)}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setNameQuery(e.target.value);
                  }}
                  placeholder="e.g. Satyanarayana Murthy"
                  className="w-full px-space-md py-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary border border-surface-container-high/60"
                />
                {nameLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Suggestions Dropdown for Full Name */}
              {isNameFocused && fullNameSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-surface-container-high/80 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-surface-container-high/40">
                  <div className="px-3 py-1.5 bg-surface-container-low text-[11px] font-bold text-secondary uppercase tracking-wider">
                    Existing Guests (Click to Autofill)
                  </div>
                  {fullNameSuggestions.map((cust, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectCustomer(cust)}
                      className="w-full text-left px-3 py-2 hover:bg-surface-container flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                          {cust.full_name?.charAt(0) || 'G'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-on-surface">{cust.full_name}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">{cust.phone || '—'}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col text-[11px] text-on-surface-variant">
                        <span>{cust.gender || 'Male'} • {cust.age ? `${cust.age} yrs` : '—'}</span>
                        <span className="text-secondary font-semibold">Autofill ➔</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Number with Autosuggest Dropdown */}
            <div className="flex flex-col gap-space-xxs relative">
              <label className="font-label-md text-label-md text-on-surface font-medium flex items-center justify-between">
                <span>Mobile Number <span className="text-error">*</span></span>
                {phoneSuggestions.length > 0 && isPhoneFocused && (
                  <span className="text-[11px] text-secondary font-bold">
                    Found {phoneSuggestions.length} match(es)
                  </span>
                )}
              </label>
              <div className="flex rounded-lg overflow-hidden border border-surface-container-high/60 bg-surface-container-low relative">
                <span className="px-space-sm py-space-sm bg-surface-container font-tabular-numeric text-tabular-numeric text-on-surface-variant flex items-center justify-center text-xs">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setTimeout(() => setIsPhoneFocused(false), 200)}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneQuery(e.target.value);
                  }}
                  placeholder="98480 22338"
                  className="w-full px-space-sm py-space-sm bg-surface-container-low text-on-surface font-tabular-numeric text-tabular-numeric focus:outline-none"
                />
              </div>

              {/* Suggestions Dropdown for Phone */}
              {isPhoneFocused && phoneSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-surface-container-high/80 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-surface-container-high/40">
                  <div className="px-3 py-1.5 bg-surface-container-low text-[11px] font-bold text-secondary uppercase tracking-wider">
                    Matching Customer (Click to Autofill)
                  </div>
                  {phoneSuggestions.map((cust, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => handleSelectCustomer(cust)}
                      className="w-full text-left px-3 py-2 hover:bg-surface-container flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                          {cust.full_name?.charAt(0) || 'G'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-on-surface">{cust.full_name}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">{cust.phone}</span>
                        </div>
                      </div>
                      <span className="text-secondary font-semibold text-xs">Select ➔</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender & Age Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              {/* Gender Selector */}
              <div className="sm:col-span-2 flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">
                  Gender <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-lg border border-surface-container-high/60">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-1 rounded text-center text-xs font-semibold transition-colors cursor-pointer ${
                        gender === g
                          ? 'bg-secondary text-on-secondary shadow-xs'
                          : 'text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {g === 'Male' ? '👨 Male' : g === 'Female' ? '👩 Female' : '⚧ Other'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div className="sm:col-span-1 flex flex-col gap-space-xxs">
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
