"use client";

import Link from "next/link";
import { formatMoney, rentalDays } from "@/lib/pricing";
import { extrasTotalMinor, getExtra } from "@/lib/extras";
import { getProtection, protectionTotalMinor } from "@/lib/protections";
import type { BookingDraft } from "@/lib/booking-draft";

interface Props {
  draft: BookingDraft;
}

export default function BookingSummary({ draft }: Props) {
  const days = rentalDays(draft.pickupAt, draft.dropoffAt);
  const vanTotal = draft.dailyRateMinor * days;
  const extrasTotal = extrasTotalMinor(draft.extras, days);
  const protectionTotal = protectionTotalMinor(draft.protectionId ?? "basic", days);
  const total = vanTotal + extrasTotal + protectionTotal;
  const currency = draft.currency || "gbp";

  return (
    <aside className="panel-aside h-fit p-5">
      <h2 className="text-sm font-bold text-foreground">Your hire summary</h2>

      <div className="mt-4 overflow-hidden rounded-lg bg-surface">
        <div className="aspect-[16/10]">
          {draft.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.imageUrl}
              alt={draft.vanName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-28 items-center justify-center text-sm text-muted">
              {draft.vanName}
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-semibold text-foreground">{draft.vanName}</p>
          <p className="mt-1 text-xs text-muted">
            {formatRange(draft.pickupAt)} → {formatRange(draft.dropoffAt)}
          </p>
          {(draft.pickupLocation || draft.dropoffLocation) && (
            <p className="mt-1 text-xs text-muted">
              {draft.pickupLocation || "Pick-up"}
              {draft.dropoffLocation &&
              draft.dropoffLocation !== draft.pickupLocation
                ? ` → ${draft.dropoffLocation}`
                : ""}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">
            Van · {days} day{days === 1 ? "" : "s"}
          </dt>
          <dd className="font-medium">{formatMoney(vanTotal, currency)}</dd>
        </div>
        {draft.extras
          .filter((e) => e.quantity > 0)
          .map((e) => {
            const item = getExtra(e.id);
            if (!item) return null;
            const line =
              item.chargeType === "per_day"
                ? item.priceMinor * days * e.quantity
                : item.priceMinor * e.quantity;
            return (
              <div key={e.id} className="flex justify-between gap-3">
                <dt className="text-muted">
                  {item.name}
                  {e.quantity > 1 ? ` ×${e.quantity}` : ""}
                </dt>
                <dd className="font-medium">{formatMoney(line, currency)}</dd>
              </div>
            );
          })}
        {(() => {
          const pkg = getProtection(draft.protectionId ?? "basic");
          if (!pkg) return null;
          return (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{pkg.name}</dt>
              <dd className="font-medium">
                {formatMoney(protectionTotal, currency)}
              </dd>
            </div>
          );
        })()}
        <div className="flex justify-between gap-3 border-t border-border pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-bold text-brand">{formatMoney(total, currency)}</dd>
        </div>
      </dl>

      <Link
        href={`/vans?${new URLSearchParams({
          pickupAt: draft.pickupAt,
          dropoffAt: draft.dropoffAt,
        }).toString()}`}
        className="mt-4 block rounded-lg py-2 text-center text-sm font-medium text-brand outline outline-2 outline-transparent outline-offset-2 transition-[outline-color] hover:outline-brand"
      >
        Change search
      </Link>
    </aside>
  );
}

function formatRange(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
