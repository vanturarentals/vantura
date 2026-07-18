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
    const location = searchParams.get("location") || "London, UK";
    if (!pickupAt || !dropoffAt) return;

    hydrating.current = true;
    const query = new URLSearchParams({ pickupAt, dropoffAt, location });
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
          pickupLocation: location,
          dropoffLocation: location,
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
    <div>
      <BookingSteps vanId={vanId} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="overflow-hidden rounded-md border border-border bg-white">
            <div className="aspect-[16/9] bg-surface">
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
            <div className="p-6">
              <h1 className="text-2xl font-bold text-foreground">
                {draft.vanName}
              </h1>
              <p className="mt-1 text-muted">{inferCategoryLabel(draft.vanName)}</p>

              <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">
                Features
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Spec label="Size" value={inferVanSize(draft.vanName)} />
                <Spec label="Seats" value={String(inferSeats(draft.vanName))} />
                <Spec label="Transmission" value="Manual" />
                <Spec label="Fuel" value="Diesel" />
                <Spec label="Air conditioning" value="Available" />
                <Spec label="Rear doors" value="Twin / barn" />
              </dl>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-md border border-border bg-white p-5">
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
            className="mt-6 w-full rounded bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover"
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
            className="rounded bg-brand px-6 py-2.5 text-sm font-semibold text-white"
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
    <div className="rounded border border-border px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
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
