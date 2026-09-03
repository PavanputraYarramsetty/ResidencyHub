/**
 * Client-side 24-hour slab billing calculator
 * This is for DISPLAY ONLY — the server computes the actual billing
 */

export function calculateBillableDays(checkIn, checkOut) {
  const inTime = new Date(checkIn);
  const outTime = new Date(checkOut);

  if (isNaN(inTime.getTime()) || isNaN(outTime.getTime())) return 0;
  if (outTime <= inTime) return 0;

  const durationMs = outTime.getTime() - inTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return Math.max(1, Math.ceil(durationHours / 24));
}

export function estimateTotal(ratePerDay, checkIn, checkOut) {
  const days = calculateBillableDays(checkIn, checkOut);
  return { days, total: days * ratePerDay };
}

export function formatDuration(checkIn, checkOut) {
  const inTime = new Date(checkIn);
  const outTime = new Date(checkOut);
  const durationMs = outTime.getTime() - inTime.getTime();

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return `${days}d ${remainHours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}
