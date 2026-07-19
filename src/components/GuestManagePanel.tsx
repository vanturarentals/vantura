"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import { formatBookingReference } from "@/lib/booking-reference";
import { formatMoney } from "@/lib/pricing";
import { supportConfig } from "@/lib/support";

interface LookupResult {
  reference: string | null;
  vanName: string;
  startAt: string;
  endAt: string;
  paymentStatus: string;
  totalAmountMinor: number;
  currency: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
}

export default function GuestManagePanel() {
  const [authOpen, setAuthOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not find that booking.");
        return;
      }
      setResult(data.booking as LookupResult);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const phone = supportConfig.phone;
  const phoneLabel = supportConfig.phoneDisplay || phone;

  return (
    <>
      <div className="rounded-lg bg-brand-muted/70 p-5">
        <h2 className="text-lg font-bold text-brand">
          Create a free account — manage bookings online
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm text-foreground">
          <li>Cancel hires online (48+ hours before pick-up)</li>
          <li>See your full booking history in one place</li>
          <li>Faster checkout next time with saved details</li>
          <li>Track refund status after a cancellation</li>
        </ul>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="btn-primary mt-4"
        >
          Log in
        </button>
      </div>

      <h1 className="mt-10 text-3xl font-bold text-brand">Manage bookings</h1>
      <p className="mt-2 text-muted">
        Look up a booking with your reference and the email used at checkout.
        Guest cancellations need a phone call — accounts can cancel online.
      </p>

      <form onSubmit={onLookup} className="panel mt-8 space-y-4 bg-surface p-6">
        <label className="block space-y-1.5">
          <span className="field-label">Booking reference</span>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="K7M-2X9-QP4"
            className="field font-mono"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="field-label">Email used at checkout</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@mail.com"
            className="field"
            required
          />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? "Searching…" : "Find booking"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {result && (
        <div className="panel mt-6 space-y-4 p-5">
          <div>
            <p className="font-mono text-sm font-semibold text-brand">
              {result.reference
                ? formatBookingReference(result.reference)
                : "—"}
            </p>
            <p className="mt-1 text-lg font-bold">{result.vanName}</p>
          </div>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={result.customerName} />
            <Row label="Pick-up" value={formatDate(result.startAt)} />
            <Row label="Return" value={formatDate(result.endAt)} />
            <Row
              label="Location"
              value={
                result.pickupLocation || result.dropoffLocation
                  ? `${result.pickupLocation || "—"} → ${result.dropoffLocation || "—"}`
                  : "—"
              }
            />
            <Row
              label="Total"
              value={formatMoney(result.totalAmountMinor, result.currency)}
            />
            <Row label="Status" value={result.paymentStatus} />
          </dl>

          {result.paymentStatus !== "Cancelled" ? (
            <div className="rounded-lg bg-surface p-4 text-sm">
              <p className="font-semibold text-foreground">Need to cancel?</p>
              <p className="mt-1 text-muted">
                Guest bookings can&apos;t be cancelled online. Please call us
                {phone ? (
                  <>
                    {" "}
                    on{" "}
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="font-semibold text-brand underline"
                    >
                      {phoneLabel}
                    </a>
                  </>
                ) : (
                  <>
                    {" "}
                    or email{" "}
                    <a
                      href={`mailto:${supportConfig.email}?subject=Cancel%20booking%20${encodeURIComponent(result.reference ?? "")}`}
                      className="font-semibold text-brand underline"
                    >
                      {supportConfig.email}
                    </a>
                  </>
                )}
                . Have your booking reference ready.
              </p>
              <p className="mt-3 text-muted">
                Or{" "}
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="font-semibold text-brand underline"
                >
                  create an account
                </button>{" "}
                (same email) to cancel online when pick-up is 48+ hours away.
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-muted">
              This booking is already cancelled.
            </p>
          )}
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} nextPath="/manage" />
    </>
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
