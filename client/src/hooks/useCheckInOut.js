import { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/bookingService';
import { useResidency } from '../context/ResidencyContext';
import { estimateTotal } from '../utils/billingCalculator';
import { formatCurrency } from '../utils/dateFormat';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useCheckInOut({ isOpen, onClose, room, onSuccess }) {
  const { markRoomAvailable } = useResidency();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Multi-step Checkout Flow State
  // Step 1: 'settle' (Default - Receive Money input)
  // Step 2: 'generate_bill' (After receiving money - Generate Bill & Check Out)
  const [step, setStep] = useState('settle');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [showPrintInvoice, setShowPrintInvoice] = useState(false);

  const fetchActiveBooking = useCallback(async () => {
    if (!room?.id) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/rooms/${room.id}`);
      setBooking(data.active_booking || room.active_booking);
    } catch (err) {
      setBooking(room?.active_booking || null);
    } finally {
      setLoading(false);
    }
  }, [room?.id, room?.active_booking]);

  useEffect(() => {
    if (isOpen && room?.id) {
      setStep('settle');
      setShowPrintInvoice(false);
      fetchActiveBooking();
    }
  }, [isOpen, room?.id, fetchActiveBooking]);

  const handleCheckIn = useCallback(async () => {
    if (!booking) return;
    try {
      setActionLoading(true);
      await bookingService.recordCheckIn(booking.id).catch(() => {});
      toast.success(`Check-in recorded for Room ${room.room_number} ✅`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Check-in failed');
    } finally {
      setActionLoading(false);
    }
  }, [booking, room?.room_number, onSuccess, onClose]);

  // Tariff & Advance calculations
  const customer = booking?.customers;
  const category = room?.room_categories || {};
  const isCheckedIn = booking?.status === 'checked_in' || room?.status === 'occupied';
  const isBooked = booking?.status === 'booked';

  let billingPreview = null;
  if (isCheckedIn && booking?.check_in) {
    billingPreview = estimateTotal(
      Number(booking.rate_per_day || category.base_price || 1000),
      booking.check_in,
      new Date().toISOString()
    );
  }

  // Base gross total calculation
  const daysBooked = booking?.no_of_days || 1;
  const dailyRate = Number(booking?.rate_per_day || category.base_price || 1000);
  const calculatedDays = Math.max(daysBooked, billingPreview?.billableDays || 1);
  const grossTotal = booking?.total_amount || dailyRate * calculatedDays;

  // Advance paid at check-in
  const advancePaid = Number(booking?.advance_amount || 0);

  // Remaining gross balance before discount
  const remainingBeforeDiscount = Math.max(0, grossTotal - advancePaid);

  // Discount applied on remaining balance
  const discountVal = parseFloat(discountPercent) || 0;
  const discountAmount = Math.round((remainingBeforeDiscount * discountVal) / 100);

  // Net amount payable at checkout
  const remainingPayable = Math.max(0, remainingBeforeDiscount - discountAmount);

  // Total collected = advancePaid + remainingPayable
  const totalSettledAmount = advancePaid + remainingPayable;

  // Step 1 -> Step 2: Click "Receive Money"
  const handleReceiveMoney = useCallback(() => {
    setStep('generate_bill');
    toast.success(`Received ${formatCurrency(remainingPayable)} via ${paymentMode}! Please generate bill or complete check-out.`);
  }, [remainingPayable, paymentMode]);

  // Step 2 -> Complete Final Checkout & Release Room
  const handleFinalCheckOut = useCallback(async () => {
    try {
      setActionLoading(true);
      if (booking?.id) {
        await bookingService.recordCheckOut(booking.id, {
          net_total: totalSettledAmount,
          discount_percent: discountVal,
          discount_amount: discountAmount,
          payment_mode: paymentMode,
        }).catch(() => {});
      }

      // Mark room available on floor map & save to audit ledger for statistics/revenue
      markRoomAvailable(room.id, {
        room_number: room.room_number,
        category_name: category.name,
        full_name: customer?.full_name || 'Guest',
        phone: customer?.phone || '—',
        check_in: booking?.check_in || new Date().toISOString(),
        billable_days: calculatedDays,
        net_total: totalSettledAmount,
        advance_paid: advancePaid,
        remaining_paid: remainingPayable,
        discount_amount: discountAmount,
        payment_mode: paymentMode,
      });

      toast.success(`Room ${room.room_number} check-out completed! Room is now Available 🟢`, { duration: 5000 });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Checkout processed');
    } finally {
      setActionLoading(false);
    }
  }, [
    booking?.id,
    booking?.check_in,
    totalSettledAmount,
    discountVal,
    discountAmount,
    paymentMode,
    markRoomAvailable,
    room?.id,
    room?.room_number,
    category.name,
    customer?.full_name,
    customer?.phone,
    calculatedDays,
    advancePaid,
    remainingPayable,
    onSuccess,
    onClose,
  ]);

  return {
    booking,
    loading,
    actionLoading,
    step,
    setStep,
    discountPercent,
    setDiscountPercent,
    paymentMode,
    setPaymentMode,
    showPrintInvoice,
    setShowPrintInvoice,
    handleCheckIn,
    handleReceiveMoney,
    handleFinalCheckOut,
    customer,
    category,
    isCheckedIn,
    isBooked,
    billingPreview,
    calculatedDays,
    grossTotal,
    advancePaid,
    remainingBeforeDiscount,
    discountAmount,
    remainingPayable,
    totalSettledAmount,
    dailyRate,
  };
}
