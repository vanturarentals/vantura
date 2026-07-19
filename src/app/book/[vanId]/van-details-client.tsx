"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BookingSteps from "@/components/BookingSteps";
import { formatMoney, rentalDays } from "@/lib/pricing";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import type { BookingDraft } from "@/lib/booking-draft";
import { inferCategoryLabel, inferSeats, inferVanSize } from "@/lib/van-meta";
import type { Van } from "@/lib/types";

const FEATURES = [
  { label: "Air con", icon: "ac" as const },
  { label: "Bluetooth", icon: "bt" as const },
  { label: "Parking sensors", icon: "park" as const },
];

export default function VanDetailsClient() {
  const params = useParams<{ vanId: string }>();
  const searchParams = useSearchParams();
  const vanId = params.vanId;
  const router = useRouter();
  const draft = useBookingDraft(vanId);
  const hydrating = useRef(false);

  // Rebuild draft from Select's query string if sessionStorage is empty.
  useEffect(() => {
    if (draft || hydrating.current) return;
    const pickupAt = searchParams.get("pickupAt");
    const dropoffAt = searchParams.get("dropoffAt");
    if (!pickupAt || !dropoffAt) return;

    hydrating.current = true;
    const query = new URLSearchParams({ pickupAt, dropoffAt });
    fetch(`/api/availability?${query}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to load van.");
        const van = (data.vans as (Van & { currency: string })[])?.find(
          (v) => v.id === vanId,
        );
        if (!van) throw new Error("Van not available for those dates.");
        const next: BookingDraft = {
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
        writeDraft(next);
      })
      .catch(() => {
        hydrating.current = false;
      });
  }, [draft, searchParams, vanId]);

  if (!draft) {
    return (
      <div className="space-y-4">
        <p className="text-muted">Loading van details…</p>
        <Link href="/vans" className="font-semibold text-brand hover:underline">
          Back to vans
        </Link>
      </div>
    );
  }

  const days = rentalDays(draft.pickupAt, draft.dropoffAt);
  const total = draft.dailyRateMinor * days;

  return (
    <div className="pb-24 lg:pb-0">
      <BookingSteps vanId={vanId} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-surface">
            <div className="aspect-[16/9]">
              {draft.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.imageUrl}
                  alt={draft.vanName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  No image yet
                </div>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {draft.vanName}
            </h1>
            <p className="mt-1 text-muted">{inferCategoryLabel(draft.vanName)}</p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-foreground">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  <FeatureIcon kind={f.icon} />
                  {f.label}
                </li>
              ))}
            </ul>

            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Spec label="Size" value={inferVanSize(draft.vanName)} />
              <Spec label="Seats" value={String(inferSeats(draft.vanName))} />
              <Spec label="Daily rate" value={formatMoney(draft.dailyRateMinor, draft.currency)} />
            </dl>
          </div>
        </div>

        <aside className="panel-aside hidden h-fit p-5 lg:block">
          <p className="text-sm text-muted">
            {formatShort(draft.pickupAt)} → {formatShort(draft.dropoffAt)}
          </p>
          <p className="mt-4 text-3xl font-bold text-brand">
            {formatMoney(total, draft.currency)}
          </p>
          <p className="text-sm text-muted">
            {formatMoney(draft.dailyRateMinor, draft.currency)} / day · {days}{" "}
            day{days === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/book/${vanId}/extras`)}
            className="btn-primary mt-6 w-full py-3"
          >
            Continue
          </button>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white p-4 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-brand">
              {formatMoney(total, draft.currency)}
            </p>
            <p className="text-xs text-muted">{days} day hire</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/book/${vanId}/extras`)}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border pt-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function FeatureIcon({ kind }: { kind: "ac" | "bt" | "park" }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    className: "text-brand shrink-0",
    "aria-hidden": true,
  } as const;
  if (kind === "bt") {
    return (
      <svg {...props}>
        <path d="M12 3v18l7-5.5L12 10l7-5.5L12 3zM5 8l7 4M5 16l7-4" />
      </svg>
    );
  }
  if (kind === "park") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 16V8h4a3 3 0 0 1 0 6H9" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M12 4v4M8 8h8M6 12h12l-1 8H7l-1-8z" />
    </svg>
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
