import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getBookingBySessionId } from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { formatMoney } from "@/lib/pricing";
import type { Booking } from "@/lib/types";

type SearchParams = Promise<{
  session_id?: string;
  payment_intent?: string;
}>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id, payment_intent } = await searchParams;
  // PaymentIntent id is stored in the Airtable "Stripe Session ID" field.
  const lookupId = payment_intent || session_id;

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

  const reference = booking?.number
    ? `#${booking.number}`
    : booking?.id.slice(0, 8).toUpperCase() ?? "—";

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-muted text-2xl text-brand">
              ✓
            </div>
            <h1 className="mt-5 text-3xl font-bold text-brand">
              Your booking is confirmed!
            </h1>
            <p className="mt-2 text-muted">
              Booking reference{" "}
              <span className="font-semibold text-foreground">{reference}</span>
            </p>

            {booking && (
              <dl className="mt-6 space-y-2 rounded-md border border-border bg-white p-5 text-sm">
                <Row label="Van" value={vanName} />
                <Row
                  label="Pick-up"
                  value={formatDate(booking.startAt)}
                />
                <Row
                  label="Return"
                  value={formatDate(booking.endAt)}
                />
                <Row
                  label="Total paid"
                  value={formatMoney(booking.totalAmountMinor, booking.currency)}
                />
                <Row label="Status" value={booking.paymentStatus} />
              </dl>
            )}

            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                What&apos;s next?
              </h2>
              <ul className="mt-3 space-y-3 text-sm text-foreground">
                <li className="flex gap-3">
                  <span className="font-bold text-brand">1.</span>
                  Bring your driving licence and the card used for payment.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand">2.</span>
                  Arrive on time for pick-up — we&apos;re open 24/7.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-brand">3.</span>
                  A confirmation email is on its way (once email is connected).
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Back to home
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-white">
            <div className="aspect-[4/3] bg-surface">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={vanName}
                  className="h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/hero-coastal.jpg"
                  alt="Thanks for choosing Vantura"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <p className="p-5 text-center text-sm font-medium text-muted">
              Thanks for choosing Vantura Rentals.
            </p>
          </div>
        </div>
      </main>
      <Footer />
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
