/**
 * Sridevi Residency — 24-Hour Stay Billing Engine
 * Rule: A booking cycle represents a minimum 24-hour unit (billing_units >= 1).
 * Duration less than 24 hours counts as 1 full 24-hour unit.
 * Each additional started 24-hour cycle adds another billing unit.
 */

function computeCheckoutBilling(checkInAt, checkOutAt, pricePer24Hours) {
  const checkIn = new Date(checkInAt || Date.now());
  const checkOut = new Date(checkOutAt || Date.now());
  const rate = Number(pricePer24Hours) || 1500;

  const diffMs = Math.max(0, checkOut.getTime() - checkIn.getTime());
  const durationHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

  // 24-hour slab calculation:
  // 0 to 24 hours = 1 unit
  // 24.01 to 48 hours = 2 units
  // etc.
  let billingUnits = 1;
  if (durationHours > 24) {
    billingUnits = Math.ceil(durationHours / 24);
  }

  const totalAmount = billingUnits * rate;

  return {
    billingUnits,
    durationHours,
    ratePer24Hours: rate,
    totalAmount,
    checkInFormatted: checkIn.toISOString(),
    checkOutFormatted: checkOut.toISOString(),
  };
}

module.exports = { computeCheckoutBilling };
