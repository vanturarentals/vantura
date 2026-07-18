"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/pricing";
import {
  inferCategoryLabel,
  inferSeats,
  inferVanSize,
  type VanSize,
} from "@/lib/van-meta";
import { writeDraft } from "@/lib/use-booking-draft";
import type { BookingDraft } from "@/lib/booking-draft";
import type { Van } from "@/lib/types";
import SearchForm from "@/components/SearchForm";

interface AvailableVan extends Van {
  days: number;
  totalMinor: number;
  currency: string;
}

const SIZE_OPTIONS: VanSize[] = ["Small", "Medium", "Large", "XL & Luton"];

export default function VanResults() {
  const params = useSearchParams();
  const location = params.get("location") ?? "";
  const pickupAt = params.get("pickupAt") ?? "";
  const dropoffAt = params.get("dropoffAt") ?? "";

  const missingParams = !pickupAt || !dropoffAt;
  const [vans, setVans] = useState<AvailableVan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Set<VanSize>>(new Set());
  const [editing, setEditing] = useState(false);

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

  const filtered = useMemo(() => {
    if (!vans) return [];
    if (sizes.size === 0) return vans;
    return vans.filter((v) => sizes.has(inferVanSize(v.name)));
  }, [vans, sizes]);

  function toggleSize(size: VanSize) {
    setSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      return next;
    });
  }

  function selectVan(van: AvailableVan) {
    const draft: BookingDraft = {
      vanId: van.id,
      vanName: van.name,
      imageUrl: van.imageUrl,
      dailyRateMinor: van.dailyRateMinor,
      currency: van.currency,
      pickupAt,
      dropoffAt,
      pickupLocation: location || "London, UK",
      dropoffLocation: location || "London, UK",
      differentReturn: false,
      extras: [],
      driver: {
        title: "Mr",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        country: "United Kingdom",
      },
    };
    writeDraft(draft);
  }

  if (missingParams) {
    return (
      <div className="space-y-4">
        <p className="text-muted">Start with a search to see available vans.</p>
        <SearchForm variant="inline" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white px-4 py-3">
        <div className="text-sm text-foreground">
          <span className="font-semibold">{location || "London, UK"}</span>
          <span className="text-muted">
            {" "}
            · {formatShort(pickupAt)} → {formatShort(dropoffAt)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-sm font-semibold text-brand hover:underline"
        >
          {editing ? "Hide search" : "Change search"}
        </button>
      </div>

      {editing && (
        <SearchForm
          variant="inline"
          defaults={{ location, pickupAt, dropoffAt }}
        />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-md border border-border bg-white p-5">
          <h2 className="text-sm font-bold text-foreground">Filters</h2>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Van size
            </p>
            <ul className="mt-3 space-y-2">
              {SIZE_OPTIONS.map((size) => (
                <li key={size}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sizes.has(size)}
                      onChange={() => toggleSize(size)}
                      className="accent-brand"
                    />
                    {size}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 opacity-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Transmission
            </p>
            <p className="mt-2 text-xs text-muted">Coming soon</p>
          </div>
          <div className="mt-4 opacity-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Fuel type
            </p>
            <p className="mt-2 text-xs text-muted">Coming soon</p>
          </div>
        </aside>

        <div>
          {error && <p className="text-red-600">{error}</p>}
          {vans === null && !error && (
            <p className="text-muted">Searching available vans…</p>
          )}
          {vans && filtered.length === 0 && (
            <p className="text-muted">
              No vans match these filters. Try clearing size filters or another
              date range.
            </p>
          )}

          <ul className="space-y-4">
            {filtered.map((van) => (
              <li
                key={van.id}
                className="flex flex-col overflow-hidden rounded-md border border-border bg-white sm:flex-row"
              >
                <div className="aspect-[16/10] w-full bg-surface sm:w-56 sm:shrink-0 sm:aspect-auto sm:min-h-[140px]">
                  {van.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={van.imageUrl}
                      alt={van.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {van.name}
                    </h3>
                    <p className="text-sm text-muted">
                      {inferCategoryLabel(van.name)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                      <span>{inferSeats(van.name)} seats</span>
                      <span>·</span>
                      <span>Manual</span>
                      <span>·</span>
                      <span>Diesel</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="text-xl font-bold text-brand">
                        {formatMoney(van.dailyRateMinor, van.currency)}
                      </p>
                      <p className="text-xs text-muted">per day</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatMoney(van.totalMinor, van.currency)} total ·{" "}
                        {van.days}d
                      </p>
                    </div>
                    <Link
                      href={`/book/${van.id}?${new URLSearchParams({
                        pickupAt,
                        dropoffAt,
                        location: location || "London, UK",
                      }).toString()}`}
                      onClick={() => selectVan(van)}
                      className="rounded bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                    >
                      Select
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
