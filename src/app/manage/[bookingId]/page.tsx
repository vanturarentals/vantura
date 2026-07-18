import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CancelBookingButton from "@/components/CancelBookingButton";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getBookingById,
  userOwnsBooking,
} from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { formatMoney } from "@/lib/pricing";
import { formatBookingReference } from "@/lib/booking-reference";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { supportConfig } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function ManageBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  if (!isSupabaseConfigured()) {
    redirect("/manage");
  }

  const user = await getCurrentUser();
  if (!user?.email) {
    redirect(`/login?next=/manage/${bookingId}`);
  }

  const booking = await getBookingById(bookingId);
  if (!booking || !userOwnsBooking(booking, user)) {
    notFound();
  }

  const van = booking.vanId ? await getVanById(booking.vanId) : null;
  const ref = booking.reference
    ? formatBookingReference(booking.reference)
    : booking.id.slice(0, 8).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <Link
          href="/manage"
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← All bookings
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-brand">Booking details</h1>
        <p className="mt-1 font-mono text-sm font-semibold text-muted">{ref}</p>

        <dl className="mt-8 space-y-3 rounded-md border border-border bg-white p-5 text-sm">
          <Row label="Van" value={van?.name ?? "Van"} />
          <Row label="Status" value={booking.paymentStatus} />
          <Row label="Customer" value={booking.customerName} />
          <Row label="Email" value={booking.email} />
          <Row label="Pick-up" value={formatDate(booking.startAt)} />
          <Row label="Return" value={formatDate(booking.endAt)} />
          <Row
            label="Pick-up location"
            value={booking.pickupLocation || "—"}
          />
          <Row
            label="Drop-off location"
            value={booking.dropoffLocation || "—"}
          />
          <Row
            label="Total"
            value={formatMoney(booking.totalAmountMinor, booking.currency)}
          />
          {booking.refundStatus && (
            <Row label="Refund" value={booking.refundStatus} />
          )}
        </dl>

        <div className="mt-6 space-y-4">
          <CancelBookingButton
            bookingId={booking.id}
            paymentStatus={booking.paymentStatus}
            startAt={booking.startAt}
            refundStatus={booking.refundStatus}
          />

          <div className="rounded-md border border-border bg-surface p-4 text-sm">
            <p className="font-semibold text-foreground">Need a change?</p>
            <p className="mt-1 text-muted">
              Date or location changes aren&apos;t available online yet. Email{" "}
              <a
                href={`mailto:${supportConfig.email}?subject=Change%20booking%20${encodeURIComponent(ref)}`}
                className="font-semibold text-brand underline"
              >
                {supportConfig.email}
              </a>{" "}
              with your reference.
            </p>
          </div>

          <CopyReference reference={ref} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("en-GB");
}

function CopyReference({ reference }: { reference: string }) {
  return (
    <p className="text-sm text-muted">
      Reference:{" "}
      <span className="font-mono font-semibold text-foreground">{reference}</span>
      {" · "}
      Keep this for support calls.
    </p>
  );
}
