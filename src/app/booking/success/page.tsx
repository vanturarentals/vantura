import Link from "next/link";
import { getBookingBySessionId } from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { formatMoney } from "@/lib/pricing";
import type { Booking } from "@/lib/types";

type SearchParams = Promise<{ session_id?: string }>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;

  let booking: Booking | null = null;
  let vanName = "Your van";
  if (session_id) {
    try {
      booking = await getBookingBySessionId(session_id);
      if (booking?.vanId) {
        const van = await getVanById(booking.vanId);
        if (van) vanName = van.name;
      }
    } catch {
      booking = null;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-900/40">
        ✅
      </div>
      <h1 className="text-3xl font-bold">Payment received</h1>

      {booking ? (
        <div className="w-full rounded-2xl bg-white p-6 text-left shadow-md ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
          <p className="mb-4 text-sm text-zinc-500">
            Booking reference{" "}
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {booking.number ? `#${booking.number}` : booking.id}
            </span>
          </p>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Van" value={vanName} />
            <Row label="Pickup" value={`${booking.pickupLocation} · ${formatDate(booking.startAt)}`} />
            <Row label="Drop-off" value={`${booking.dropoffLocation} · ${formatDate(booking.endAt)}`} />
            <Row
              label="Total"
              value={formatMoney(booking.totalAmountMinor, booking.currency)}
            />
            <Row label="Status" value={booking.paymentStatus} />
          </dl>
          {booking.paymentStatus === "Pending" && (
            <p className="mt-4 text-xs text-zinc-500">
              We&apos;re finalising your confirmation — this page will reflect it
              shortly once payment settles.
            </p>
          )}
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          Thanks! Your payment was received. A confirmation will arrive by email
          shortly.
        </p>
      )}

      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Back to home
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("en-GB");
}
