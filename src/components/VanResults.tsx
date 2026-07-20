"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  const pickupAt = params.get("pickupAt") ?? "";
  const dropoffAt = params.get("dropoffAt") ?? "";

  const missingParams = !pickupAt || !dropoffAt;
  const [vans, setVans] = useState<AvailableVan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Set<VanSize>>(new Set());
  const [editing, setEditing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (missingParams) return;
    let cancelled = false;
    const query = new URLSearchParams({ pickupAt, dropoffAt });
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
  }, [pickupAt, dropoffAt, missingParams]);

  const filtered = useMemo(() => {
    if (!vans) return [];
    let list = vans;
    if (sizes.size > 0) {
      list = list.filter((v) => sizes.has(inferVanSize(v.name)));
    }
    return [...list].sort((a, b) => a.dailyRateMinor - b.dailyRateMinor);
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
      pickupLocation: "",
      dropoffLocation: "",
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
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
          Which van do you want to drive?
        </h1>
        <p className="text-muted">Start with a search to see available vans.</p>
        <SearchForm variant="inline" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            Which van do you want to drive?
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatShort(pickupAt)} → {formatShort(dropoffAt)}
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="ml-2 cursor-pointer font-semibold text-brand hover:underline"
            >
              {editing ? "Hide" : "Change"}
            </button>
          </p>
        </div>
      </div>

      {editing && (
        <SearchForm variant="inline" defaults={{ pickupAt, dropoffAt }} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <FilterPill active icon="sort" label="Lowest price" />
        <FilterPill
          active={filtersOpen || sizes.size > 0}
          icon="filters"
          label="Filters"
          onClick={() => setFiltersOpen((v) => !v)}
        />
        {sizes.size > 0 && (
          <button
            type="button"
            onClick={() => setSizes(new Set())}
            className="cursor-pointer text-xs font-semibold text-brand hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                sizes.has(size)
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-foreground hover:bg-surface"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {vans === null && !error && (
        <p className="text-muted">Searching available vans…</p>
      )}
      {vans && filtered.length === 0 && (
        <p className="text-muted">
          No vans match these filters. Try clearing size filters or another date
          range.
        </p>
      )}

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((van, index) => (
          <li key={van.id}>
            <VanPreviewCard
              van={van}
              pickupAt={pickupAt}
              dropoffAt={dropoffAt}
              topSeller={index === 0}
              onSelect={() => selectVan(van)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function VanPreviewCard({
  van,
  pickupAt,
  dropoffAt,
  topSeller,
  onSelect,
}: {
  van: AvailableVan;
  pickupAt: string;
  dropoffAt: string;
  topSeller: boolean;
  onSelect: () => void;
}) {
  const category = inferCategoryLabel(van.name);
  const seats = inferSeats(van.name);
  const size = inferVanSize(van.name);

  return (
    <Link
      href={`/book/${van.id}?${new URLSearchParams({
        pickupAt,
        dropoffAt,
      }).toString()}`}
      onClick={onSelect}
      className="group relative flex min-h-[22rem] flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-md transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg sm:min-h-[24rem]"
    >
      {van.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={van.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/35 to-black/75" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative flex flex-1 flex-col p-5 text-white">
        <div className="text-on-image">
          <h2 className="text-xl font-extrabold uppercase leading-tight tracking-tight sm:text-2xl">
            {van.name}
          </h2>
          <p className="mt-0.5 text-sm font-medium text-white/90">or similar</p>
          <p className="mt-2 text-sm text-white/85">{category}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <MetaPill icon="person">{seats}</MetaPill>
            <MetaPill icon="size">{size}</MetaPill>
            <MetaPill icon="manual">Manual</MetaPill>
          </div>
        </div>

        <div className="flex-1" aria-hidden />

        <div className="text-on-image">
          <p className="flex items-center gap-1.5 text-sm text-white/95">
            <CheckIcon />
            Available for your dates
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
            <p className="text-2xl font-bold leading-none">
              {formatMoney(van.dailyRateMinor, van.currency)}
              <span className="text-base font-semibold"> /day</span>
            </p>
            <p className="text-sm text-white/80">
              {formatMoney(van.totalMinor, van.currency)} total
            </p>
          </div>
          {topSeller && (
            <span className="mt-4 inline-block rounded-full border border-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Top seller
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function MetaPill({
  icon,
  children,
}: {
  icon: "person" | "size" | "manual";
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
      {icon === "person" && <PersonIcon />}
      {icon === "size" && <VanIcon />}
      {icon === "manual" && <ManualIcon />}
      {children}
    </span>
  );
}

function FilterPill({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: "sort" | "filters";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-foreground bg-surface text-foreground"
          : "border-border bg-white text-foreground hover:bg-surface"
      }`}
    >
      {icon === "sort" ? <SortIcon /> : <FiltersIcon />}
      {label}
      {icon === "filters" && <ChevronDown />}
    </button>
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

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 4v16M17 20l-3-3M17 20l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FiltersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z" />
    </svg>
  );
}

function VanIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 8h11v8H3V8zM14 10h4l3 4v2h-7v-6zM6 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );
}

function ManualIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 6h8M8 12h8M8 18h5" strokeLinecap="round" />
    </svg>
  );
}
