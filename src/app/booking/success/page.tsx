import Link from "next/link";
import { getBookingBySessionId } from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { formatMoney } from "@/lib/pricing";
import { formatBookingReference } from "@/lib/booking-reference";
import { getStripe } from "@/lib/stripe";
import { confirmPaidBooking } from "@/lib/confirm-booking";
import type { Booking } from "@/lib/types";

type SearchParams = Promise<{
  session_id?: string;
  payment_intent?: string;
}>;

/**
 * If Stripe webhooks are slow/missing, still confirm + email when the customer
 * lands here after a succeeded PaymentIntent.
 */
async function confirmFromPaymentIntent(
  paymentIntentId: string,
): Promise<void> {
  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") return;
    const bookingId = pi.metadata?.bookingId;
    if (!bookingId) return;
    await confirmPaidBooking(bookingId, stripe, pi.id);
  } catch (error) {
    console.error("[success] confirm from payment_intent failed:", error);
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id, payment_intent } = await searchParams;
  // PaymentIntent id is stored in the Airtable "Stripe Session ID" field.
  const lookupId = payment_intent || session_id;

  if (payment_intent) {
    await confirmFromPaymentIntent(payment_intent);
  }

  let booking: Booking | null = null;
  let vanName = "Your van";
  let imageUrl: string | null = null;
  if (lookupId) {
    try {
      booking = await getBookingBySessionId(lookupId);
      if (booking?.vanId) {
        const van = await getVanById(booking.vanId);
        if (van) {
          vanName = van.name;
          imageUrl = van.imageUrl;
        }
      }
    } catch {
      booking = null;
    }
  }

  const reference = booking?.reference
    ? formatBookingReference(booking.reference)
    : booking?.id.slice(0, 8).toUpperCase() ?? "—";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center bg-brand px-6 py-14 text-white sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md animate-fade-rise">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your booking is confirmed!
            </h1>
            <p className="mt-3 text-white/80">
              Thanks for choosing vantura rentals. Keep this reference handy.
            </p>

            <div className="mt-8 rounded-lg bg-white p-5 text-foreground shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Booking reference
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-brand">
                {reference}
              </p>
              {booking && (
                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <Row label="Van" value={vanName} />
                  <Row label="Pick-up" value={formatDate(booking.startAt)} />
                  <Row label="Return" value={formatDate(booking.endAt)} />
                  <Row
                    label="Total paid"
                    value={formatMoney(booking.totalAmountMinor, booking.currency)}
                  />
                </dl>
              )}
            </div>

            <ul className="mt-8 space-y-2 text-sm text-white/85">
              <li>Bring your driving licence and the card used for payment.</li>
              <li>Arrive on time for pick-up — we&apos;re open 24/7.</li>
              <li>Check your email for the confirmation details.</li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/manage"
                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand-muted"
              >
                Manage booking
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[40vh] flex-1 lg:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || "/hero-van-poster.jpg"}
            alt={vanName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("en-GB");
}
