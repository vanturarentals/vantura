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

interface Props {
  defaults?: {
    location?: string;
    pickupAt?: string;
    dropoffAt?: string;
  };
  variant?: "hero" | "inline";
}

export default function SearchForm({ defaults, variant = "hero" }: Props) {
  const router = useRouter();
  const p = useMemo(() => splitDateTime(defaults?.pickupAt), [defaults?.pickupAt]);
  const d = useMemo(() => splitDateTime(defaults?.dropoffAt), [defaults?.dropoffAt]);

  const [locations, setLocations] = useState<string[]>([]);
  const [location, setLocation] = useState(defaults?.location ?? "London, UK");
  const [pickupDate, setPickupDate] = useState(p.date);
  const [pickupTime, setPickupTime] = useState(p.time || "10:00");
  const [dropoffDate, setDropoffDate] = useState(d.date);
  const [dropoffTime, setDropoffTime] = useState(d.time || "10:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data) => setLocations(data.locations ?? []))
      .catch(() => setLocations([]));
  }, []);

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
    const params = new URLSearchParams({
      pickupAt,
      dropoffAt,
      location: location.trim(),
    });
    router.push(`/vans?${params.toString()}`);
  }

  const field =
    "w-full rounded border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand";

  return (
    <form
      onSubmit={onSubmit}
      className={
        variant === "hero"
          ? "w-full rounded-md bg-white p-4 shadow-xl ring-1 ring-black/5 sm:p-5"
          : "w-full rounded-md border border-border bg-white p-4"
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Pick-up location</span>
          <input
            list="locations"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Airport, city or address"
            className={field}
          />
          <datalist id="locations">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
            <option value="London, UK" />
          </datalist>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Pick-up date &amp; time</span>
          <div className="flex gap-2">
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className={`${field} flex-1`}
            />
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className={field}
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

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Return date &amp; time</span>
          <div className="flex gap-2">
            <input
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className={`${field} flex-1`}
            />
            <select
              value={dropoffTime}
              onChange={(e) => setDropoffTime(e.target.value)}
              className={field}
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

        <button
          type="submit"
          className="rounded bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover lg:self-end"
        >
          Search vans
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}
