/** Booking price + date-range helpers. All money is in the minor unit (pence). */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole rental days, rounded up, with a minimum of 1. */
export function rentalDays(pickupAt: string, dropoffAt: string): number {
  const start = new Date(pickupAt).getTime();
  const end = new Date(dropoffAt).getTime();
  const days = Math.ceil((end - start) / MS_PER_DAY);
  return Math.max(1, days);
}

export function computeTotalMinor(
  dailyRateMinor: number,
  pickupAt: string,
  dropoffAt: string,
): number {
  return dailyRateMinor * rentalDays(pickupAt, dropoffAt);
}

/** True when the requested range is a valid, future-facing window. */
export function isValidRange(pickupAt: string, dropoffAt: string): boolean {
  const start = new Date(pickupAt).getTime();
  const end = new Date(dropoffAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return end > start;
}

/** Two [start, end) ranges overlap when each starts before the other ends. */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(aEnd).getTime() > new Date(bStart).getTime()
  );
}

export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);
}
