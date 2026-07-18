/**
 * Transactional email — prepared for Resend.
 *
 * This uses Resend's REST API directly, so there is no package to install to
 * get started: just set `RESEND_API_KEY` and `BOOKING_FROM_EMAIL`. Until those
 * are configured, `sendBookingConfirmationEmail` is a safe no-op that logs.
 *
 * When you later add the `resend` SDK (`npm i resend`), you can swap the fetch
 * call below for `new Resend(apiKey).emails.send(...)` without touching callers.
 */
import { emailConfig } from "./config";
import { formatMoney } from "./pricing";
import { formatBookingReference } from "./booking-reference";
import type { Booking } from "./types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendBookingConfirmationEmail(
  booking: Booking,
  vanName: string,
): Promise<void> {
  const reference = booking.reference
    ? formatBookingReference(booking.reference)
    : booking.id;

  if (!emailConfig.isConfigured) {
    console.info(
      `[email] Skipping confirmation for booking ${reference} — RESEND_API_KEY / BOOKING_FROM_EMAIL not set.`,
    );
    return;
  }

  const total = formatMoney(booking.totalAmountMinor, booking.currency);

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailConfig.fromAddress,
        to: [booking.email],
        subject: `Booking confirmed — ${reference}`,
        html: renderConfirmationHtml(booking, vanName, reference, total),
      }),
    });

    if (!res.ok) {
      console.error(`[email] Resend error (${res.status}): ${await res.text()}`);
    }
  } catch (error) {
    // Never let email failures break the booking flow.
    console.error("[email] Failed to send confirmation:", error);
  }
}

function renderConfirmationHtml(
  booking: Booking,
  vanName: string,
  reference: string,
  total: string,
): string {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
      <h2>Your van is booked 🚐</h2>
      <p>Hi ${booking.customerName}, your booking is confirmed.</p>
      <table style="width:100%; border-collapse: collapse;">
        <tr><td><strong>Reference</strong></td><td>${reference}</td></tr>
        <tr><td><strong>Van</strong></td><td>${vanName}</td></tr>
        <tr><td><strong>Pickup</strong></td><td>${booking.pickupLocation} — ${new Date(booking.startAt).toLocaleString("en-GB")}</td></tr>
        <tr><td><strong>Drop-off</strong></td><td>${booking.dropoffLocation} — ${new Date(booking.endAt).toLocaleString("en-GB")}</td></tr>
        <tr><td><strong>Total paid</strong></td><td>${total}</td></tr>
      </table>
    </div>
  `;
}
