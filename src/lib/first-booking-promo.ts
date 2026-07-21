/** 20% off base van rental — first paid booking for registered accounts. */

import { firstBookingPromo } from "@/lib/company";
import { listBookingsForUser } from "@/lib/bookings";

export type PromoIneligibleReason =
  | "expired"
  | "not_signed_in"
  | "not_first_booking";

export interface FirstBookingPromoStatus {
  eligible: boolean;
  discountPercent: number;
  reason?: PromoIneligibleReason;
}

export function isFirstBookingPromoActive(): boolean {
  const end = new Date(firstBookingPromo.endDate);
  end.setHours(23, 59, 59, 999);
  return Date.now() <= end.getTime();
}

/** Discount in pence off the base van rental subtotal only. */
export function vanPromoDiscountMinor(
  vanTotalMinor: number,
  eligible: boolean,
): number {
  if (!eligible || vanTotalMinor <= 0) return 0;
  return Math.round(
    vanTotalMinor * (firstBookingPromo.discountPercent / 100),
  );
}

export async function evaluateFirstBookingPromo(input: {
  userId: string | null;
  email: string | null;
}): Promise<FirstBookingPromoStatus> {
  const discountPercent = firstBookingPromo.discountPercent;

  if (!isFirstBookingPromoActive()) {
    return { eligible: false, discountPercent, reason: "expired" };
  }
  if (!input.userId || !input.email?.trim()) {
    return { eligible: false, discountPercent, reason: "not_signed_in" };
  }

  const bookings = await listBookingsForUser({
    userId: input.userId,
    email: input.email,
  });
  const hasCompletedHire = bookings.some((b) => b.paymentStatus === "Paid");
  if (hasCompletedHire) {
    return { eligible: false, discountPercent, reason: "not_first_booking" };
  }

  return { eligible: true, discountPercent };
}
