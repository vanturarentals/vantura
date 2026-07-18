import type Stripe from "stripe";
import { getBookingById, setPaymentStatus } from "@/lib/bookings";
import { getVanById, isVanAvailable } from "@/lib/inventory";
import {
  sendBookingConfirmationEmail,
  sendNewBookingNotifyEmail,
} from "@/lib/email";

/**
 * Mark a booking Paid after a successful Stripe payment, then email customer + team.
 * Safe to call from the webhook and from the success page (idempotent).
 */
export async function confirmPaidBooking(
  bookingId: string,
  stripe: Stripe,
  paymentIntentId: string | null,
): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    console.warn(`[confirm] booking ${bookingId} not found`);
    return { ok: false, alreadyPaid: false };
  }

  if (booking.paymentStatus === "Paid") {
    return { ok: true, alreadyPaid: true };
  }

  const stillFree = booking.vanId
    ? await isVanAvailable(
        booking.vanId,
        booking.startAt,
        booking.endAt,
        booking.id,
      )
    : true;

  if (!stillFree) {
    console.warn(
      `[confirm] double-booking detected for booking ${booking.id}; refunding`,
    );
    if (paymentIntentId) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    }
    await setPaymentStatus(booking.id, "Cancelled");
    return { ok: false, alreadyPaid: false };
  }

  const confirmed = await setPaymentStatus(booking.id, "Paid");
  const van = confirmed.vanId ? await getVanById(confirmed.vanId) : null;
  const vanName = van?.name ?? "Your van";

  await sendBookingConfirmationEmail(confirmed, vanName);
  await sendNewBookingNotifyEmail(confirmed, vanName);

  return { ok: true, alreadyPaid: false };
}
