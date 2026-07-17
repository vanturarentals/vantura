"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

/** 30-minute time slots, 24/7 (00:00 … 23:30). */
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

/** Driver ages start at 21. */
const AGE_OPTIONS: number[] = Array.from({ length: 80 - 21 + 1 }, (_, i) => 21 + i);

function splitDateTime(value?: string): { date: string; time: string } {
  if (value && value.includes("T")) {
    const [date, time] = value.split("T");
    return { date, time: (time ?? "").slice(0, 5) };
  }
  return { date: "", time: "" };
}

interface Props {
  defaults?: { pickupAt?: string; dropoffAt?: string };
}

export default function SearchForm({ defaults }: Props) {
  const router = useRouter();
  const p = useMemo(() => splitDateTime(defaults?.pickupAt), [defaults?.pickupAt]);
  const d = useMemo(() => splitDateTime(defaults?.dropoffAt), [defaults?.dropoffAt]);

  const [pickupDate, setPickupDate] = useState(p.date);
  const [pickupTime, setPickupTime] = useState(p.time || "10:00");
  const [dropoffDate, setDropoffDate] = useState(d.date);
  const [dropoffTime, setDropoffTime] = useState(d.time || "10:00");
  const [age, setAge] = useState("30");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pickupDate || !dropoffDate) {
      setError("Please choose pickup and drop-off dates.");
      return;
    }
    const pickupAt = `${pickupDate}T${pickupTime}`;
    const dropoffAt = `${dropoffDate}T${dropoffTime}`;
    if (new Date(dropoffAt) <= new Date(pickupAt)) {
      setError("Drop-off must be after pickup.");
      return;
    }
    router.push(`/vans?${new URLSearchParams({ pickupAt, dropoffAt })}`);
  }

  const fieldBase =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-[#ff5f00]";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-2xl bg-white p-4 text-zinc-900 shadow-2xl ring-1 ring-black/5 sm:p-5"
    >
      {/* Vehicle type tabs — vans only */}
      <div className="mb-4 flex gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
          <VanIcon className="h-4 w-4" />
          Vans
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        {/* Pickup */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pickup date &amp; time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className={`${fieldBase} flex-1`}
            />
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className={fieldBase}
              aria-label="Pickup time"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drop-off */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Drop-off date &amp; time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className={`${fieldBase} flex-1`}
            />
            <select
              value={dropoffTime}
              onChange={(e) => setDropoffTime(e.target.value)}
              className={fieldBase}
              aria-label="Drop-off time"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-[#ff5f00] px-8 py-3 text-base font-bold text-white transition-colors hover:bg-[#e05500]"
        >
          Show vans
        </button>
      </div>

      {/* Driver's age */}
      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
        <label htmlFor="driver-age" className="font-medium">
          Driver&apos;s age
        </label>
        <select
          id="driver-age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-900 outline-none focus:border-[#ff5f00]"
        >
          {AGE_OPTIONS.map((a) => (
            <option key={a} value={String(a)}>
              {a}
              {a === 80 ? "+" : ""}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function VanIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}
