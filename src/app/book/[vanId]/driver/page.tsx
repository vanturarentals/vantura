"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import type { BookingDraft } from "@/lib/booking-draft";

const TITLES = ["Mr", "Mrs", "Ms", "Mx", "Dr"];

function maxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 21);
  return d.toISOString().slice(0, 10);
}

export default function DriverPage() {
  const { vanId } = useParams<{ vanId: string }>();
  const draft = useBookingDraft(vanId);

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

  return (
    <div>
      <BookingSteps vanId={vanId} />
      <DriverForm key={draft.driver.email || "new"} draft={draft} />
    </div>
  );
}

function DriverForm({ draft }: { draft: BookingDraft }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const field =
    "w-full rounded border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

  function updateDriver(patch: Partial<BookingDraft["driver"]>) {
    writeDraft({
      ...draft,
      driver: { ...draft.driver, ...patch },
    });
  }

  function onContinue() {
    setError(null);
    const { firstName, lastName, email, phone, dateOfBirth } = draft.driver;
    if (!firstName || !lastName || !email || !phone || !dateOfBirth) {
      setError("Please complete all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (dateOfBirth > maxDob()) {
      setError("Drivers must be 21 or over.");
      return;
    }
    router.push(`/book/${draft.vanId}/review`);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4 rounded-md border border-border bg-white p-6">
        <h1 className="text-2xl font-bold text-brand">Driver details</h1>
        <p className="text-sm text-muted">
          Drivers must be 21 or over. We&apos;ll send your confirmation to this
          email.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Title</span>
            <select
              value={draft.driver.title}
              onChange={(e) => updateDriver({ title: e.target.value })}
              className={field}
            >
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">First name</span>
            <input
              value={draft.driver.firstName}
              onChange={(e) => updateDriver({ firstName: e.target.value })}
              className={field}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Last name</span>
            <input
              value={draft.driver.lastName}
              onChange={(e) => updateDriver({ lastName: e.target.value })}
              className={field}
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Email</span>
            <input
              type="email"
              value={draft.driver.email}
              onChange={(e) => updateDriver({ email: e.target.value })}
              className={field}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Phone</span>
            <input
              type="tel"
              value={draft.driver.phone}
              onChange={(e) => updateDriver({ phone: e.target.value })}
              className={field}
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Date of birth</span>
            <input
              type="date"
              max={maxDob()}
              value={draft.driver.dateOfBirth}
              onChange={(e) => updateDriver({ dateOfBirth: e.target.value })}
              className={field}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">
              Country of residence
            </span>
            <input
              value={draft.driver.country}
              onChange={(e) => updateDriver({ country: e.target.value })}
              className={field}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push(`/book/${draft.vanId}/pickup`)}
            className="text-sm font-medium text-muted hover:text-brand"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Continue
          </button>
        </div>
      </div>

      <BookingSummary draft={draft} />
    </div>
  );
}
