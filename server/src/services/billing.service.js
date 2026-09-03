/**
 * 24-Hour Slab Billing Service
 * 
 * Source of truth for billing calculation — never trust client-side math.
 * Rule: Any stay is billed in full 24-hour blocks from check-in.
 * Even 1 minute past a 24-hour mark rolls into the next full day.
 */

/**
 * Calculate billable days based on 24-hour slab rule
 * @param {Date|string} checkIn - Check-in timestamp
 * @param {Date|string} checkOut - Check-out timestamp
 * @returns {number} Number of billable days (minimum 1)
 */
function calculateBillableDays(checkIn, checkOut) {
  const inTime = new Date(checkIn);
  const outTime = new Date(checkOut);

  if (isNaN(inTime.getTime()) || isNaN(outTime.getTime())) {
    throw new Error('Invalid check-in or check-out timestamp');
  }

  if (outTime <= inTime) {
    throw new Error('Check-out time must be after check-in time');
  }

  const durationMs = outTime.getTime() - inTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const billableDays = Math.ceil(durationHours / 24);

  return Math.max(1, billableDays);
}

/**
 * Calculate total amount for a booking
 * @param {number} ratePerDay - Rate per day
 * @param {number} billableDays - Number of billable days
 * @returns {number} Total amount
 */
function calculateTotalAmount(ratePerDay, billableDays) {
  return parseFloat((ratePerDay * billableDays).toFixed(2));
}

/**
 * Full billing calculation for checkout
 * @param {Date|string} checkIn - Check-in timestamp
 * @param {Date|string} checkOut - Check-out timestamp
 * @param {number} ratePerDay - Rate per day
 * @returns {{ billableDays: number, totalAmount: number, durationHours: number }}
 */
function computeCheckoutBilling(checkIn, checkOut, ratePerDay) {
  const billableDays = calculateBillableDays(checkIn, checkOut);
  const totalAmount = calculateTotalAmount(ratePerDay, billableDays);

  const durationMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const durationHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));

  return { billableDays, totalAmount, durationHours };
}

module.exports = { calculateBillableDays, calculateTotalAmount, computeCheckoutBilling };
