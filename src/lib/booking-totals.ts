/** Hire pricing breakdown — deposit vs balance due in person. */

import type { BookingDraft } from "@/lib/booking-draft";
import { extrasTotalMinor } from "@/lib/extras";
import { mileageTotalMinor } from "@/lib/mileage";
import { protectionTotalMinor } from "@/lib/protections";
import { rentalDays } from "./pricing";
import { splitVatFromGross } from "./vat";
import { vanPromoDiscountMinor } from "./first-booking-promo";

/** £50 reservation deposit charged online today. */
export const DEPOSIT_MINOR = 5000;

export interface BookingTotalsOptions {
  /** Registered user's first booking — 20% off base van rental. */
  promoEligible?: boolean;
}

export interface BookingTotals {
  days: number;
  vanTotalMinor: number;
  promoDiscountMinor: number;
  vanTotalAfterPromoMinor: number;
  extrasTotalMinor: number;
  protectionTotalMinor: number;
  mileageTotalMinor: number;
  hireTotalMinor: number;
  hireTotalAfterPromoMinor: number;
  netTotalMinor: number;
  vatTotalMinor: number;
  depositMinor: number;
  balanceDueMinor: number;
}

export function computeBookingTotals(
  draft: BookingDraft,
  options: BookingTotalsOptions = {},
): BookingTotals {
  const days = rentalDays(draft.pickupAt, draft.dropoffAt);
  const vanTotalMinor = draft.dailyRateMinor * days;
  const promoDiscountMinor = vanPromoDiscountMinor(
    vanTotalMinor,
    options.promoEligible ?? false,
  );
  const vanTotalAfterPromoMinor = vanTotalMinor - promoDiscountMinor;
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
  const hireTotalAfterPromoMinor = hireTotalMinor - promoDiscountMinor;
  const { netMinor, vatMinor } = splitVatFromGross(hireTotalAfterPromoMinor);
  const depositMinor = DEPOSIT_MINOR;
  const balanceDueMinor = Math.max(0, hireTotalAfterPromoMinor - depositMinor);

  return {
    days,
    vanTotalMinor,
    promoDiscountMinor,
    vanTotalAfterPromoMinor,
    extrasTotalMinor: extrasTotal,
    protectionTotalMinor: protectionTotal,
    mileageTotalMinor: mileageTotal,
    hireTotalMinor,
    hireTotalAfterPromoMinor,
    netTotalMinor: netMinor,
    vatTotalMinor: vatMinor,
    depositMinor,
    balanceDueMinor,
  };
}
