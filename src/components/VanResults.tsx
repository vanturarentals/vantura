"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/pricing";
import type { Van } from "@/lib/types";

interface AvailableVan extends Van {
  days: number;
  totalMinor: number;
  currency: string;
}

export default function VanResults() {
  const params = useSearchParams();
  const location = params.get("location") ?? "";
  const pickupAt = params.get("pickupAt") ?? "";
  const dropoffAt = params.get("dropoffAt") ?? "";

  const missingParams = !pickupAt || !dropoffAt;
  const [vans, setVans] = useState<AvailableVan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (missingParams) return;
    let cancelled = false;
    const query = new URLSearchParams({ location, pickupAt, dropoffAt });
    fetch(`/api/availability?${query.toString()}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to load vans.");
        return data;
      })
      .then((d) => {
        if (!cancelled) setVans(d.vans);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [location, pickupAt, dropoffAt, missingParams]);

  if (missingParams) {
    return (
      <p className="text-red-600 dark:text-red-400">
        Please start a search from the home page.
      </p>
    );
  }
  if (error) {
    return <p className="text-red-600 dark:text-red-400">{error}</p>;
  }
  if (vans === null) {
    return <p className="text-zinc-500">Searching available vans…</p>;
  }
  if (vans.length === 0) {
    return (
      <p className="text-zinc-500">
        No vans available for those dates. Try a different window or location.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vans.map((van) => (
        <VanCard
          key={van.id}
          van={van}
          pickupLocation={location}
          pickupAt={pickupAt}
          dropoffAt={dropoffAt}
        />
      ))}
    </div>
  );
}

function VanCard({
  van,
  pickupLocation,
  pickupAt,
  dropoffAt,
}: {
  van: AvailableVan;
  pickupLocation: string;
  pickupAt: string;
  dropoffAt: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState(pickupLocation);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vanId: van.id,
          pickupLocation,
          dropoffLocation,
          startAt: pickupAt,
          endAt: dropoffAt,
          customerName: name,
          email,
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

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
      <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
        {van.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={van.imageUrl}
            alt={van.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            No image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">{van.name}</h3>
            <p className="text-sm text-zinc-500">
              {formatMoney(van.dailyRateMinor, van.currency)} / day
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              {formatMoney(van.totalMinor, van.currency)}
            </p>
            <p className="text-xs text-zinc-500">
              {van.days} day{van.days > 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {van.pickupLocations.length > 0 && (
          <p className="text-xs text-zinc-500">
            Pickup: {van.pickupLocations.join(", ")}
          </p>
        )}

        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="mt-auto rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Book this van
          </button>
        ) : (
          <form onSubmit={book} className="mt-auto flex flex-col gap-2">
            <input
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              placeholder="Drop-off location"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? "Redirecting…" : "Continue to payment"}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
