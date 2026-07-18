"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { TIME_OPTIONS } from "@/components/SearchForm";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import type { BookingDraft } from "@/lib/booking-draft";

function split(iso: string) {
  if (!iso.includes("T")) return { date: "", time: "10:00" };
  const [date, time] = iso.split("T");
  return { date, time: (time ?? "10:00").slice(0, 5) };
}

export default function PickupPage() {
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
      <PickupForm key={`${draft.pickupAt}-${draft.dropoffAt}`} draft={draft} />
    </div>
  );
}

function PickupForm({ draft }: { draft: BookingDraft }) {
  const router = useRouter();
  const p = split(draft.pickupAt);
  const r = split(draft.dropoffAt);
  const [pickupLoc, setPickupLoc] = useState(draft.pickupLocation);
  const [dropoffLoc, setDropoffLoc] = useState(draft.dropoffLocation);
  const [different, setDifferent] = useState(draft.differentReturn);
  const [pDate, setPDate] = useState(p.date);
  const [pTime, setPTime] = useState(p.time);
  const [dDate, setDDate] = useState(r.date);
  const [dTime, setDTime] = useState(r.time);
  const [error, setError] = useState<string | null>(null);

  const field =
    "w-full rounded border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

  function onContinue() {
    setError(null);
    if (!pickupLoc.trim() || !pDate || !dDate) {
      setError("Please fill pick-up location and dates.");
      return;
    }
    const pickupAt = `${pDate}T${pTime}`;
    const dropoffAt = `${dDate}T${dTime}`;
    if (new Date(dropoffAt) <= new Date(pickupAt)) {
      setError("Return must be after pick-up.");
      return;
    }
    writeDraft({
      ...draft,
      pickupLocation: pickupLoc.trim(),
      dropoffLocation: different ? dropoffLoc.trim() : pickupLoc.trim(),
      differentReturn: different,
      pickupAt,
      dropoffAt,
    });
    router.push(`/book/${draft.vanId}/driver`);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5 rounded-md border border-border bg-white p-6">
        <h1 className="text-2xl font-bold text-brand">Pick-up &amp; return</h1>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted">Pick-up location</span>
          <input
            value={pickupLoc}
            onChange={(e) => setPickupLoc(e.target.value)}
            className={field}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={different}
            onChange={(e) => setDifferent(e.target.checked)}
            className="accent-brand"
          />
          Return to a different location
        </label>

        {different && (
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted">Return location</span>
            <input
              value={dropoffLoc}
              onChange={(e) => setDropoffLoc(e.target.value)}
              className={field}
            />
          </label>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">
              Pick-up date &amp; time
            </span>
            <div className="flex gap-2">
              <input
                type="date"
                value={pDate}
                onChange={(e) => setPDate(e.target.value)}
                className={field}
              />
              <select
                value={pTime}
                onChange={(e) => setPTime(e.target.value)}
                className={field}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">
              Return date &amp; time
            </span>
            <div className="flex gap-2">
              <input
                type="date"
                value={dDate}
                onChange={(e) => setDDate(e.target.value)}
                className={field}
              />
              <select
                value={dTime}
                onChange={(e) => setDTime(e.target.value)}
                className={field}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push(`/book/${draft.vanId}/extras`)}
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
