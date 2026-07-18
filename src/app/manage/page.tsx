"use client";

import { useState, type FormEvent } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import { formatBookingReference } from "@/lib/booking-reference";
import { formatMoney } from "@/lib/pricing";

interface LookupResult {
  reference: string | null;
  vanName: string;
  startAt: string;
  endAt: string;
  paymentStatus: string;
  totalAmountMinor: number;
  currency: string;
  customerName: string;
}

export default function ManagePage() {
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-12">
        <h1 className="text-3xl font-bold text-brand">Manage bookings</h1>
        <p className="mt-2 text-muted">
          Look up a booking with your reference and email, or{" "}
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="font-semibold text-brand underline"
          >
            log in
          </button>{" "}
          to see your full history.
        </p>

        <form onSubmit={onLookup} className="mt-8 space-y-4 rounded-md border border-border bg-surface p-6">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted">
              Booking reference
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="K7M-2X9-QP4"
              className="w-full rounded border border-border bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-brand"
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted">
              Email used at checkout
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@mail.com"
              className="w-full rounded border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {busy ? "Searching…" : "Find booking"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        {result && (
          <div className="mt-6 rounded-md border border-border bg-white p-5">
            <p className="font-mono text-sm font-semibold text-brand">
              {result.reference
                ? formatBookingReference(result.reference)
                : "—"}
            </p>
            <p className="mt-1 text-lg font-bold">{result.vanName}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Name" value={result.customerName} />
              <Row label="Pick-up" value={formatDate(result.startAt)} />
              <Row label="Return" value={formatDate(result.endAt)} />
              <Row
                label="Total"
                value={formatMoney(result.totalAmountMinor, result.currency)}
              />
              <Row label="Status" value={result.paymentStatus} />
            </dl>
          </div>
        )}

        <p className="mt-8 text-center text-sm">
          <Link href="/account/bookings" className="font-semibold text-brand hover:underline">
            Go to My bookings →
          </Link>
        </p>
      </main>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
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
