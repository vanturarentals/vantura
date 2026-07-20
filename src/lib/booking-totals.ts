/** Hire pricing breakdown — deposit vs balance due in person. */

import type { BookingDraft } from "@/lib/booking-draft";
import { extrasTotalMinor } from "@/lib/extras";
import { mileageTotalMinor } from "@/lib/mileage";
import { protectionTotalMinor } from "@/lib/protections";
import { rentalDays } from "./pricing";

/** £50 reservation deposit charged online today. */
export const DEPOSIT_MINOR = 5000;

export interface BookingTotals {
  days: number;
  vanTotalMinor: number;
  extrasTotalMinor: number;
  protectionTotalMinor: number;
  mileageTotalMinor: number;
  hireTotalMinor: number;
  depositMinor: number;
  balanceDueMinor: number;
}

export function computeBookingTotals(draft: BookingDraft): BookingTotals {
  const days = rentalDays(draft.pickupAt, draft.dropoffAt);
  const vanTotalMinor = draft.dailyRateMinor * days;
  const extrasTotal = extrasTotalMinor(draft.extras, days);
  const protectionTotal = protectionTotalMinor(
    draft.protectionId ?? "basic",
    days,
  );
  const mileageTotal = mileageTotalMinor(
    draft.mileageId ?? "included_200",
    days,
  );
  const hireTotalMinor =
    vanTotalMinor + extrasTotal + protectionTotal + mileageTotal;
  const depositMinor = DEPOSIT_MINOR;
  const balanceDueMinor = Math.max(0, hireTotalMinor - depositMinor);

  return {
    days,
    vanTotalMinor,
    extrasTotalMinor: extrasTotal,
    protectionTotalMinor: protectionTotal,
    mileageTotalMinor: mileageTotal,
    hireTotalMinor,
    depositMinor,
    balanceDueMinor,
  };
}
