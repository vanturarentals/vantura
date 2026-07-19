"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/** 30-minute time slots, 24/7 (00:00 … 23:30). */
export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function splitDateTime(value?: string): { date: string; time: string } {
  if (value && value.includes("T")) {
    const [date, time] = value.split("T");
    return { date, time: (time ?? "").slice(0, 5) };
  }
  return { date: "", time: "" };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toTimeInput(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Round up to the next 30-minute slot (keep if already on :00 / :30). */
function nearestHalfHour(from = new Date()): Date {
  const d = new Date(from);
  d.setSeconds(0, 0);
  const minutes = d.getMinutes();
  if (minutes === 0 || minutes === 30) return d;
  if (minutes < 30) {
    d.setMinutes(30);
  } else {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  }
  return d;
}

/** Default hire window: nearest half-hour now → +6 hours. */
function defaultHireWindow(): {
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
} {
  const pickup = nearestHalfHour();
  const dropoff = new Date(pickup.getTime() + 6 * 60 * 60 * 1000);
  return {
    pickupDate: toDateInput(pickup),
    pickupTime: toTimeInput(pickup),
    dropoffDate: toDateInput(dropoff),
    dropoffTime: toTimeInput(dropoff),
  };
}

interface Props {
  defaults?: {
    pickupAt?: string;
    dropoffAt?: string;
  };
  variant?: "hero" | "inline";
}

export default function SearchForm({ defaults, variant = "hero" }: Props) {
  const router = useRouter();
  const fromUrl = useMemo(() => {
    const p = splitDateTime(defaults?.pickupAt);
    const d = splitDateTime(defaults?.dropoffAt);
    if (p.date && d.date) {
      return {
        pickupDate: p.date,
        pickupTime: p.time || "10:00",
        dropoffDate: d.date,
        dropoffTime: d.time || "10:00",
      };
    }
    return null;
  }, [defaults?.pickupAt, defaults?.dropoffAt]);

  const [pickupDate, setPickupDate] = useState(fromUrl?.pickupDate ?? "");
  const [pickupTime, setPickupTime] = useState(fromUrl?.pickupTime ?? "10:00");
  const [dropoffDate, setDropoffDate] = useState(fromUrl?.dropoffDate ?? "");
  const [dropoffTime, setDropoffTime] = useState(fromUrl?.dropoffTime ?? "10:00");
  const [error, setError] = useState<string | null>(null);

  // Fill "now → +6h" on the client so SSR/hydration stay in sync.
  useEffect(() => {
    if (fromUrl) return;
    const w = defaultHireWindow();
    setPickupDate(w.pickupDate);
    setPickupTime(w.pickupTime);
    setDropoffDate(w.dropoffDate);
    setDropoffTime(w.dropoffTime);
  }, [fromUrl]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pickupDate || !dropoffDate) {
      setError("Please choose pick-up and return dates.");
      return;
    }
    const pickupAt = `${pickupDate}T${pickupTime}`;
    const dropoffAt = `${dropoffDate}T${dropoffTime}`;
    if (new Date(dropoffAt) <= new Date(pickupAt)) {
      setError("Return must be after pick-up.");
      return;
    }
    router.push(
      `/vans?${new URLSearchParams({ pickupAt, dropoffAt }).toString()}`,
    );
  }

  const isHero = variant === "hero";
  const dateField = "field min-w-0 flex-[2]";
  const timeField = "field w-[6.5rem] shrink-0 sm:w-[7rem]";

  return (
    <form
      onSubmit={onSubmit}
      className={
        isHero
          ? "w-full rounded-xl border border-border bg-white p-4 sm:p-5"
          : "panel w-full p-4"
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="field-label">Pick-up</span>
          <div className="flex gap-2">
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className={dateField}
            />
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className={timeField}
              aria-label="Pick-up time"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="field-label">Return</span>
          <div className="flex gap-2">
            <input
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className={dateField}
            />
            <select
              value={dropoffTime}
              onChange={(e) => setDropoffTime(e.target.value)}
              className={timeField}
              aria-label="Return time"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </label>

        <button type="submit" className="btn-primary gap-2 lg:self-end">
          Search
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}
