"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import { formatShortDateTime } from "@/lib/format-datetime";

interface AvailableVan extends Van {
  days: number;
  totalMinor: number;
  currency: string;
}

const SIZE_OPTIONS: VanSize[] = ["Small", "Medium", "Large", "XL & Luton"];

export default function VanResults() {
  const params = useSearchParams();
  const router = useRouter();
  const pickupAt = params.get("pickupAt") ?? "";
  const dropoffAt = params.get("dropoffAt") ?? "";

  const missingParams = !pickupAt || !dropoffAt;
  const [vans, setVans] = useState<AvailableVan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Set<VanSize>>(new Set());
  const [editing, setEditing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedVanId, setExpandedVanId] = useState<string | null>(null);
  const expandedRef = useRef<HTMLLIElement>(null);

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
      protectionId: "basic",
      furthestStepIndex: 0,
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

  function toggleVan(van: AvailableVan) {
    setExpandedVanId((current) => (current === van.id ? null : van.id));
    selectVan(van);
  }

  function chooseExtras(van: AvailableVan) {
    selectVan(van);
    const query = new URLSearchParams({ pickupAt, dropoffAt });
    router.push(`/book/${van.id}/extras?${query.toString()}`);
  }

  useEffect(() => {
    if (expandedVanId && expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expandedVanId]);

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
            {formatShortDateTime(pickupAt)} → {formatShortDateTime(dropoffAt)}
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
          <Fragment key={van.id}>
            <li>
              <VanPreviewCard
                van={van}
                topSeller={index === 0}
                expanded={expandedVanId === van.id}
                onToggle={() => toggleVan(van)}
              />
            </li>
            {expandedVanId === van.id && (
              <li ref={expandedRef} className="col-span-1 md:col-span-2 xl:col-span-3">
                <VanExpandedPanel
                  van={van}
                  onClose={() => setExpandedVanId(null)}
                  onChooseExtras={() => chooseExtras(van)}
                />
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}

function VanPreviewCard({
  van,
  topSeller,
  expanded,
  onToggle,
}: {
  van: AvailableVan;
  topSeller: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const category = inferCategoryLabel(van.name);
  const seats = inferSeats(van.name);
  const size = inferVanSize(van.name);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`group relative flex min-h-[22rem] w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-zinc-900 text-left shadow-md transition-transform duration-200 hover:scale-[1.01] hover:shadow-lg sm:min-h-[24rem] ${
        expanded ? "ring-2 ring-brand ring-offset-2" : ""
      }`}
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
    </button>
  );
}

function VanExpandedPanel({
  van,
  onClose,
  onChooseExtras,
}: {
  van: AvailableVan;
  onClose: () => void;
  onChooseExtras: () => void;
}) {
  const category = inferCategoryLabel(van.name);
  const seats = inferSeats(van.name);
  const size = inferVanSize(van.name);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative flex min-h-[18rem] flex-col bg-zinc-900 text-white sm:min-h-[22rem] lg:min-h-[20rem]">
          {van.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={van.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-contain object-center p-4 sm:p-8"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />

          <div className="relative mt-auto p-5 sm:p-6">
            <h2 className="text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
              {van.name}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-white/90">or similar</p>
            <p className="mt-1 text-sm text-white/80">
              {category} · Manual
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/95">
              <span className="inline-flex items-center gap-2">
                <PersonIcon />
                {seats} seats
              </span>
              <span className="inline-flex items-center gap-2">
                <VanIcon />
                {size}
              </span>
              <span className="inline-flex items-center gap-2">
                <ManualIcon />
                Manual
              </span>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/75">
              <LicenceIcon />
              Minimum driver age: 21
            </p>
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-bold text-foreground">Your hire</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="mt-5 flex-1 space-y-4">
            <HireOption
              selected
              title="Standard rate"
              description="Free cancellation and rebooking within 24 hours."
              badge="Included"
            />
            <HireOption
              title="Mileage"
              description="All miles included in the price."
              badge="Included"
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatMoney(van.dailyRateMinor, van.currency)}
                <span className="text-base font-semibold"> /day</span>
              </p>
              <p className="text-sm text-muted">
                {formatMoney(van.totalMinor, van.currency)} total
              </p>
            </div>
            <button
              type="button"
              onClick={onChooseExtras}
              className="btn-primary shrink-0 px-8 py-3"
            >
              Choose extras
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HireOption({
  title,
  description,
  badge,
  selected = false,
}: {
  title: string;
  description: string;
  badge: string;
  selected?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        selected ? "border-brand bg-brand/5" : "border-border bg-surface/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-brand bg-brand" : "border-border bg-white"
          }`}
          aria-hidden
        >
          {selected && (
            <span className="h-2 w-2 rounded-full bg-white" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{title}</p>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
              {badge}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>
    </div>
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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function LicenceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 17c.5-2 2.5-3 4-3s3.5 1 4 3" strokeLinecap="round" />
    </svg>
  );
}
