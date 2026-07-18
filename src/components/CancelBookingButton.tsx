"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { canSelfCancelOnline, hoursUntilStart, supportConfig } from "@/lib/support";

interface Props {
  bookingId: string;
  paymentStatus: string;
  startAt: string;
  refundStatus: string | null;
}

export default function CancelBookingButton({
  bookingId,
  paymentStatus,
  startAt,
  refundStatus,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (paymentStatus === "Cancelled") {
    return (
      <div className="rounded-md border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-foreground">Cancelled</p>
        <p className="mt-1 text-muted">
          {refundStatus === "Pending"
            ? "A refund has been flagged for our team to process."
            : refundStatus === "Completed"
              ? "Refund marked as completed."
              : "This hire is cancelled."}
        </p>
      </div>
    );
  }

  const allowed = canSelfCancelOnline(startAt);
  const hours = Math.max(0, Math.floor(hoursUntilStart(startAt)));

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not cancel.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  if (!allowed) {
    const phone = supportConfig.phone;
    return (
      <div className="rounded-md border border-border bg-surface p-4 text-sm">
        <p className="font-semibold text-foreground">
          Online cancel unavailable
        </p>
        <p className="mt-1 text-muted">
          Pick-up is in about {hours} hour{hours === 1 ? "" : "s"}. Online
          cancellation needs at least 48 hours&apos; notice. Please{" "}
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="font-semibold text-brand underline"
            >
              call us
            </a>
          ) : (
            <Link href="/contact" className="font-semibold text-brand underline">
              contact us
            </Link>
          )}{" "}
          for help.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-white p-4">
      <p className="text-sm font-semibold text-foreground">Cancel this hire</p>
      <p className="mt-1 text-sm text-muted">
        Free online cancel when pick-up is 48+ hours away. Paid bookings are
        flagged in Airtable for a refund.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Cancel booking
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Are you sure? This can&apos;t be undone here.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={cancel}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {busy ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
              className="text-sm font-medium text-muted hover:text-brand"
            >
              Keep booking
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
