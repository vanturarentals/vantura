"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import { formatBookingReference } from "@/lib/booking-reference";
import { formatMoney } from "@/lib/pricing";
import { supportConfig } from "@/lib/support";

interface LookupResult {
  id: string;
  reference: string | null;
  vanName: string;
  startAt: string;
  endAt: string;
  paymentStatus: string;
  totalAmountMinor: number;
  depositAmountMinor: number;
  currency: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  canCancelOnline: boolean;
}

export default function GuestManagePanel() {
  const [authOpen, setAuthOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [cancelCode, setCancelCode] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCodeSent(false);
    setCancelCode("");
    setCancelError(null);
    setCancelled(false);
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

  async function sendCancelCode() {
    if (!result) return;
    setCancelError(null);
    setCancelBusy(true);
    try {
      const res = await fetch("/api/bookings/guest-cancel/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Could not send code.");
        return;
      }
      setCodeSent(true);
    } catch {
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function confirmCancel(e: FormEvent) {
    e.preventDefault();
    if (!result) return;
    setCancelError(null);
    setCancelBusy(true);
    try {
      const res = await fetch("/api/bookings/guest-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email, code: cancelCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Could not cancel booking.");
        return;
      }
      setCancelled(true);
      setResult({ ...result, paymentStatus: "Cancelled", canCancelOnline: false });
    } catch {
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setCancelBusy(false);
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
        Guests can cancel online with email verification when pick-up is 48+
        hours away.
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
              label="Hire total"
              value={formatMoney(result.totalAmountMinor, result.currency)}
            />
            <Row
              label="Deposit paid"
              value={formatMoney(result.depositAmountMinor, result.currency)}
            />
            {result.totalAmountMinor > result.depositAmountMinor && (
              <Row
                label="Balance due in person"
                value={formatMoney(
                  result.totalAmountMinor - result.depositAmountMinor,
                  result.currency,
                )}
              />
            )}
            <Row label="Status" value={result.paymentStatus} />
          </dl>

          {cancelled && (
            <p className="rounded-lg bg-brand/10 p-4 text-sm font-medium text-brand">
              Your booking has been cancelled. Refund handling depends on our
              cancellation policy — see your confirmation email.
            </p>
          )}

          {!cancelled && result.paymentStatus !== "Cancelled" && (
            <div className="rounded-lg bg-surface p-4 text-sm">
              <p className="font-semibold text-foreground">Need to cancel?</p>
              {result.canCancelOnline ? (
                <div className="mt-3 space-y-3">
                  {!codeSent ? (
                    <>
                      <p className="text-muted">
                        We&apos;ll email a 6-digit code to verify it&apos;s you.
                      </p>
                      <button
                        type="button"
                        onClick={sendCancelCode}
                        disabled={cancelBusy}
                        className="btn-primary w-full py-2.5"
                      >
                        {cancelBusy ? "Sending…" : "Email verification code"}
                      </button>
                    </>
                  ) : (
                    <form onSubmit={confirmCancel} className="space-y-3">
                      <p className="text-muted">
                        Enter the 6-digit code sent to {email}.
                      </p>
                      <input
                        value={cancelCode}
                        onChange={(e) => setCancelCode(e.target.value)}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="123456"
                        className="field font-mono text-center text-lg tracking-widest"
                        required
                      />
                      <button
                        type="submit"
                        disabled={cancelBusy}
                        className="btn-danger-outline w-full py-2.5"
                      >
                        {cancelBusy ? "Cancelling…" : "Confirm cancellation"}
                      </button>
                    </form>
                  )}
                  {cancelError && (
                    <p className="text-sm text-red-600">{cancelError}</p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-muted">
                  Online cancellation is only available when pick-up is at least
                  48 hours away. Please call{" "}
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="font-semibold text-brand underline"
                  >
                    {phoneLabel}
                  </a>{" "}
                  or email{" "}
                  <a
                    href={`mailto:${supportConfig.email}?subject=Cancel%20booking%20${encodeURIComponent(result.reference ?? "")}`}
                    className="font-semibold text-brand underline"
                  >
                    {supportConfig.email}
                  </a>
                  .
                </p>
              )}
              <p className="mt-3 text-muted">
                Or{" "}
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="font-semibold text-brand underline"
                >
                  sign in
                </button>{" "}
                with the same email for faster management.
              </p>
            </div>
          )}

          {result.paymentStatus === "Cancelled" && !cancelled && (
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
