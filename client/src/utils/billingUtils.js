/**
 * Sridevi Residency — Client-side 24-Hour Stay Calculator
 * Ensures transparency when displaying stay breakdowns and receipts.
 */
export function calculateStayDuration(checkInAt, checkOutAt = new Date()) {
  const checkIn = new Date(checkInAt);
  const checkOut = new Date(checkOutAt);
  const diffMs = Math.max(0, checkOut.getTime() - checkIn.getTime());

  const totalHours = diffMs / (1000 * 60 * 60);
  const hours = Math.floor(totalHours);
  const minutes = Math.floor((totalHours - hours) * 60);

  // Minimum 1 unit of 24 hours
  const billingUnits = totalHours > 24 ? Math.ceil(totalHours / 24) : 1;

  return {
    hours,
    minutes,
    totalHours: parseFloat(totalHours.toFixed(1)),
    billingUnits,
    durationText: `${hours}h ${minutes}m`,
  };
}

export function computeStayTotal(ratePer24Hours, billingUnits = 1, advancePaid = 0) {
  const rate = Number(ratePer24Hours) || 0;
  const units = Math.max(1, Number(billingUnits) || 1);
  const advance = Number(advancePaid) || 0;

  const grossTotal = rate * units;
  const balanceDue = Math.max(0, grossTotal - advance);

  return {
    grossTotal,
    advancePaid: advance,
    balanceDue,
  };
}
