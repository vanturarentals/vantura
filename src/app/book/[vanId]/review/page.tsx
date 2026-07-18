"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { getExtra } from "@/lib/extras";
import { useBookingDraft } from "@/lib/use-booking-draft";

export default function ReviewPage() {
  const { vanId } = useParams<{ vanId: string }>();
  const router = useRouter();
  const draft = useBookingDraft(vanId);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!draft) {
    return (
      <p className="text-muted">
        Missing booking details.{" "}
        <Link href="/" className="text-brand underline">
          Start again
        </Link>
      </p>
    );
  }

  const current = draft;

  async function pay() {
    setError(null);
    if (!accepted) {
      setError("Please accept the terms to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const customerName =
        `${current.driver.firstName} ${current.driver.lastName}`.trim();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vanId: current.vanId,
          pickupLocation: current.pickupLocation,
          dropoffLocation: current.dropoffLocation,
          startAt: current.pickupAt,
          endAt: current.dropoffAt,
          customerName,
          email: current.driver.email,
          phone: current.driver.phone,
          extras: current.extras,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const extrasLabel = current.extras
    .filter((e) => e.quantity > 0)
    .map((e) => {
      const item = getExtra(e.id);
      return item
        ? `${item.name}${e.quantity > 1 ? ` ×${e.quantity}` : ""}`
        : null;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <BookingSteps vanId={vanId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-brand">Review &amp; confirm</h1>

          <Section
            title="Pick-up & return"
            href={`/book/${vanId}/pickup`}
            lines={[
              `${current.pickupLocation} · ${formatLong(current.pickupAt)}`,
              `${current.dropoffLocation} · ${formatLong(current.dropoffAt)}`,
            ]}
          />
          <Section
            title="Vehicle"
            href={`/book/${vanId}`}
            lines={[current.vanName]}
          />
          <Section
            title="Extras"
            href={`/book/${vanId}/extras`}
            lines={[extrasLabel || "None"]}
          />
          <Section
            title="Driver"
            href={`/book/${vanId}/driver`}
            lines={[
              `${current.driver.title} ${current.driver.firstName} ${current.driver.lastName}`,
              current.driver.email,
              current.driver.phone,
            ]}
          />
          <Section
            title="Payment"
            href="#"
            lines={["Secure card payment via Stripe Checkout"]}
            hideEdit
          />

          <label className="flex items-start gap-3 rounded-md border border-border bg-white p-4 text-sm">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="accent-brand"
            />
            <span>
              I agree to the hire terms and confirm the driver details are
              correct.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push(`/book/${vanId}/driver`)}
              className="text-sm font-medium text-muted hover:text-brand"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={pay}
              className="rounded bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {submitting ? "Redirecting…" : "Confirm and pay"}
            </button>
          </div>
        </div>

        <BookingSummary draft={current} />
      </div>
    </div>
  );
}

function Section({
  title,
  href,
  lines,
  hideEdit,
}: {
  title: string;
  href: string;
  lines: string[];
  hideEdit?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {!hideEdit && (
          <Link
            href={href}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Edit
          </Link>
        )}
      </div>
      <ul className="mt-2 space-y-0.5 text-sm text-muted">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function formatLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
