/**
 * Transactional email via Resend REST API.
 *
 * Requires RESEND_API_KEY + BOOKING_FROM_EMAIL (verified domain in Resend).
 * No-ops safely until configured.
 *
 * Also point Supabase Auth SMTP at Resend (smtp.resend.com) so magic-link
 * emails bypass Supabase's free-tier rate limit — see README / setup notes.
 */
import { emailConfig, getAppUrl } from "./config";
import { formatMoney } from "./pricing";
import { formatBookingReference } from "./booking-reference";
import { supportConfig } from "./support";
import type { Booking } from "./types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!emailConfig.isConfigured) {
    console.info(
      `[email] Skipping "${input.subject}" — RESEND_API_KEY / BOOKING_FROM_EMAIL not set.`,
    );
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailConfig.fromAddress,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!res.ok) {
      console.error(`[email] Resend error (${res.status}): ${await res.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string): string {
  const appUrl = getAppUrl();
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f6f5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f6f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #d9ddd9;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#1a3932;padding:20px 24px;">
              <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">vantura <span style="font-weight:500;">rentals</span></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#1a3932;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid #d9ddd9;font-size:12px;color:#6b726e;">
              Questions? <a href="mailto:${escapeHtml(supportConfig.email)}" style="color:#1a3932;">${escapeHtml(supportConfig.email)}</a>
              · <a href="${escapeHtml(appUrl)}/manage" style="color:#1a3932;">Manage bookings</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export async function sendWelcomeEmail(input: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const appUrl = getAppUrl();
  const first = input.name?.trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${escapeHtml(first)},` : "Hi,";

  await sendEmail({
    to: input.email,
    subject: "Welcome to Vantura Rentals",
    html: layout(
      "Welcome aboard",
      `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1a1a1a;">${greeting}</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#6b726e;">
        Your Vantura account is ready. You can manage bookings, cancel hires online
        (48+ hours before pick-up), and keep everything in one place.
      </p>
      <p style="margin:0 0 22px;">
        <a href="${escapeHtml(appUrl)}/manage"
           style="display:inline-block;background:#1a3932;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:4px;">
          Go to Manage bookings
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#6b726e;">
        Prefer to hire as a guest? That’s fine too — create an account anytime with the same email to claim past bookings.
      </p>
    `,
    ),
  });
}

export async function sendBookingConfirmationEmail(
  booking: Booking,
  vanName: string,
): Promise<void> {
  const reference = booking.reference
    ? formatBookingReference(booking.reference)
    : booking.id;
  const total = formatMoney(booking.totalAmountMinor, booking.currency);
  const appUrl = getAppUrl();
  const first = booking.customerName.trim().split(/\s+/)[0] || "there";

  await sendEmail({
    to: booking.email,
    subject: `Booking confirmed — ${reference}`,
    html: layout(
      "Your van is booked",
      `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
        Hi ${escapeHtml(first)}, your payment is confirmed and your hire is locked in.
      </p>
      <table role="presentation" width="100%" style="font-size:14px;border-collapse:collapse;margin:0 0 18px;">
        <tr><td style="padding:8px 0;color:#6b726e;">Reference</td><td style="padding:8px 0;text-align:right;font-weight:600;font-family:ui-monospace,monospace;">${escapeHtml(reference)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Van</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #d9ddd9;">${escapeHtml(vanName)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Pick-up</td><td style="padding:8px 0;text-align:right;border-top:1px solid #d9ddd9;">${escapeHtml(formatWhen(booking.startAt))}<br/><span style="color:#6b726e;">${escapeHtml(booking.pickupLocation || "—")}</span></td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Return</td><td style="padding:8px 0;text-align:right;border-top:1px solid #d9ddd9;">${escapeHtml(formatWhen(booking.endAt))}<br/><span style="color:#6b726e;">${escapeHtml(booking.dropoffLocation || "—")}</span></td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #d9ddd9;">${escapeHtml(total)}</td></tr>
      </table>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:#6b726e;">
        Bring your driving licence and the card used for payment to pick-up.
      </p>
      <p style="margin:0 0 18px;">
        <a href="${escapeHtml(appUrl)}/manage"
           style="display:inline-block;background:#1a3932;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:4px;">
          Manage this booking
        </a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#6b726e;">
        Sign in with <strong>${escapeHtml(booking.email)}</strong> at Manage bookings to view details,
        or cancel online if pick-up is more than 48 hours away. Guest bookings: look up with your
        reference and email on the same page.
      </p>
    `,
    ),
  });
}

/** Internal alert to the team when a hire is paid. */
export async function sendNewBookingNotifyEmail(
  booking: Booking,
  vanName: string,
): Promise<void> {
  const to = emailConfig.notifyAddress.trim();
  if (!to) return;

  const reference = booking.reference
    ? formatBookingReference(booking.reference)
    : booking.id;
  const total = formatMoney(booking.totalAmountMinor, booking.currency);
  const appUrl = getAppUrl();

  await sendEmail({
    to,
    subject: `New booking — ${reference} · ${vanName}`,
    html: layout(
      "New booking received",
      `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
        A customer has paid and confirmed a hire.
      </p>
      <table role="presentation" width="100%" style="font-size:14px;border-collapse:collapse;margin:0 0 18px;">
        <tr><td style="padding:8px 0;color:#6b726e;">Reference</td><td style="padding:8px 0;text-align:right;font-weight:600;font-family:ui-monospace,monospace;">${escapeHtml(reference)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Customer</td><td style="padding:8px 0;text-align:right;border-top:1px solid #d9ddd9;">${escapeHtml(booking.customerName)}<br/><span style="color:#6b726e;">${escapeHtml(booking.email)}</span></td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Van</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #d9ddd9;">${escapeHtml(vanName)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Pick-up</td><td style="padding:8px 0;text-align:right;border-top:1px solid #d9ddd9;">${escapeHtml(formatWhen(booking.startAt))}<br/><span style="color:#6b726e;">${escapeHtml(booking.pickupLocation || "—")}</span></td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Return</td><td style="padding:8px 0;text-align:right;border-top:1px solid #d9ddd9;">${escapeHtml(formatWhen(booking.endAt))}<br/><span style="color:#6b726e;">${escapeHtml(booking.dropoffLocation || "—")}</span></td></tr>
        <tr><td style="padding:8px 0;color:#6b726e;border-top:1px solid #d9ddd9;">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #d9ddd9;">${escapeHtml(total)}</td></tr>
      </table>
      <p style="margin:0;">
        <a href="${escapeHtml(appUrl)}/manage"
           style="display:inline-block;background:#1a3932;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:4px;">
          Open manage bookings
        </a>
      </p>
    `,
    ),
  });
}

export async function sendBookingCancelledEmail(
  booking: Booking,
  vanName: string,
): Promise<void> {
  const reference = booking.reference
    ? formatBookingReference(booking.reference)
    : booking.id;
  const first = booking.customerName.trim().split(/\s+/)[0] || "there";
  const refundNote =
    booking.refundStatus === "Pending"
      ? "If you paid online, a refund has been flagged for our team to process shortly."
      : "No payment refund is required for this booking.";

  await sendEmail({
    to: booking.email,
    subject: `Booking cancelled — ${reference}`,
    html: layout(
      "Booking cancelled",
      `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
        Hi ${escapeHtml(first)}, we’ve cancelled your hire of <strong>${escapeHtml(vanName)}</strong>
        (reference <span style="font-family:ui-monospace,monospace;font-weight:600;">${escapeHtml(reference)}</span>).
      </p>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#6b726e;">
        Original pick-up was ${escapeHtml(formatWhen(booking.startAt))}. ${escapeHtml(refundNote)}
      </p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#6b726e;">
        Need another van? Book again anytime at Vantura Rentals.
      </p>
    `,
    ),
  });
}
