"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  /** Pre-fill values when rendered above a results list. */
  defaults?: {
    location?: string;
    pickupAt?: string;
    dropoffAt?: string;
  };
}

export default function SearchForm({ defaults }: Props) {
  const router = useRouter();
  const [locations, setLocations] = useState<string[]>([]);
  const [location, setLocation] = useState(defaults?.location ?? "");
  const [pickupAt, setPickupAt] = useState(defaults?.pickupAt ?? "");
  const [dropoffAt, setDropoffAt] = useState(defaults?.dropoffAt ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? []))
      .catch(() => setLocations([]));
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pickupAt || !dropoffAt) {
      setError("Please choose pickup and drop-off times.");
      return;
    }
    if (new Date(dropoffAt) <= new Date(pickupAt)) {
      setError("Drop-off must be after pickup.");
      return;
    }
    const params = new URLSearchParams({ location, pickupAt, dropoffAt });
    router.push(`/vans?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full max-w-4xl grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 sm:grid-cols-2 lg:grid-cols-4 dark:bg-zinc-900 dark:ring-white/10"
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Pickup location
        <input
          list="locations"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Any location"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base font-normal outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-300"
        />
        <datalist id="locations">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Pickup
        <input
          type="datetime-local"
          value={pickupAt}
          onChange={(e) => setPickupAt(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base font-normal outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-300"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Drop-off
        <input
          type="datetime-local"
          value={dropoffAt}
          onChange={(e) => setDropoffAt(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-base font-normal outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-300"
        />
      </label>

      <div className="flex flex-col justify-end">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Search vans
        </button>
      </div>

      {error && (
        <p className="col-span-full text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
