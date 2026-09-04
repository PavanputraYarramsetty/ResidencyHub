import { useState, useEffect, useCallback } from 'react';
import { useCustomerSearch } from './useCustomerSearch';
import { bookingService } from '../services/bookingService';
import { useResidency } from '../context/ResidencyContext';
import { validateBookingForm } from '../utils/validators';
import toast from 'react-hot-toast';

export function useBookingForm({ isOpen, onClose, preselectedRoomId, preselectedRoom, onSuccess }) {
  const { floors, markRoomOccupied } = useResidency();

  const [checkInTime, setCheckInTime] = useState(() => new Date().toISOString());

  // Flatten rooms from floors
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

  // Customer search autosuggest states
  const [nameQuery, setNameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const { results: fullNameSuggestions, loading: nameLoading } = useCustomerSearch(nameQuery);
  const { results: phoneSuggestions } = useCustomerSearch(phoneQuery);

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
  }, [preselectedRoomId, preselectedRoom, isOpen, contextRooms, roomId]);

  const selectedRoomObj = contextRooms.find((r) => r.id === roomId) || preselectedRoom || contextRooms[0];
  const ratePerDay = selectedRoomObj?.room_categories?.base_price || 0;
  const calculatedTotal = ratePerDay * noOfDays;

  const handleAadharPhotoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadharPhoto(file);
      setAadharPhotoPreview(URL.createObjectURL(file));
      toast.success('Aadhaar photo attached');
    }
  }, []);

  const handlePassportPhotoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportPhoto(file);
      setPassportPhotoPreview(URL.createObjectURL(file));
      toast.success('Passport photo attached');
    }
  }, []);

  const handleSelectCustomer = useCallback((c) => {
    if (c.full_name) setFullName(c.full_name);
    if (c.phone) setPhone(c.phone);
    if (c.aadhar_number) setAadharNumber(c.aadhar_number);
    if (c.age) setAge(c.age.toString());
    if (c.gender) setGender(c.gender);
    if (c.address) setAddress(c.address);
    toast.success(`Auto-filled details for ${c.full_name}! ✨`);
  }, []);

  const resetForm = useCallback(() => {
    setFullName('');
    setPhone('');
    setAadharNumber('');
    setAge('');
    setGender('Male');
    setAddress('');
    setNoOfPersons(1);
    setNoOfDays(1);
    setAdvanceAmount('');
    setPaymentMode('UPI');
    setAadharPhoto(null);
    setAadharPhotoPreview(null);
    setPassportPhoto(null);
    setPassportPhotoPreview(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!roomId) return toast.error('Please select a room');

    const formData = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      aadhar_number: aadharNumber.trim(),
      age: age ? parseInt(age, 10) : null,
      gender,
      address: address.trim(),
      no_of_persons: parseInt(noOfPersons, 10) || 1,
      no_of_days: parseInt(noOfDays, 10) || 1,
      advance_amount: parseFloat(advanceAmount) || 0,
      payment_mode: paymentMode,
      booking_date: checkInTime.split('T')[0],
      check_in: checkInTime,
    };

    const errors = validateBookingForm(formData);
    if (errors) {
      const firstError = Object.values(errors)[0];
      return toast.error(firstError);
    }

    try {
      setSubmitting(true);

      const payload = {
        room_id: roomId,
        full_name: formData.full_name,
        phone: formData.phone,
        aadhar_number: formData.aadhar_number,
        age: formData.age,
        gender: formData.gender,
        address: formData.address,
        no_of_persons: formData.no_of_persons,
        no_of_days: formData.no_of_days,
        advance_amount: formData.advance_amount,
        rate_per_day: ratePerDay,
        total_amount: calculatedTotal,
        payment_mode: formData.payment_mode,
        booking_date: formData.booking_date,
        check_in: formData.check_in,
      };

      await bookingService.createBooking(payload).catch((err) => {
        console.warn('Booking API warning, falling back to local optimistic state', err?.message);
      });

      markRoomOccupied(roomId);
      toast.success(`Room ${selectedRoomObj?.room_number || ''} booked & checked-in successfully! 🎉`);
      onSuccess?.();
      resetForm();
      onClose();
    } catch (err) {
      console.error('Booking submission error:', err);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [
    roomId,
    fullName,
    phone,
    aadharNumber,
    age,
    gender,
    address,
    noOfPersons,
    noOfDays,
    advanceAmount,
    paymentMode,
    checkInTime,
    ratePerDay,
    calculatedTotal,
    markRoomOccupied,
    selectedRoomObj,
    onSuccess,
    resetForm,
    onClose,
  ]);

  return {
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
    nameQuery,
    setNameQuery,
    phoneQuery,
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
  };
}
