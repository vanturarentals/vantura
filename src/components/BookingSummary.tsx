"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/pricing";
import { computeBookingTotals } from "@/lib/booking-totals";
import { getExtra } from "@/lib/extras";
import { getProtection } from "@/lib/protections";
import { getMileageOption } from "@/lib/mileage";
import type { BookingDraft } from "@/lib/booking-draft";

interface Props {
  draft: BookingDraft;
}

export default function BookingSummary({ draft }: Props) {
  const totals = computeBookingTotals(draft);
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
        <LineItem
          label={`Van · ${totals.days} day${totals.days === 1 ? "" : "s"}`}
          amount={totals.vanTotalMinor}
          currency={currency}
          payInPerson
        />
        {draft.extras
          .filter((e) => e.quantity > 0)
          .map((e) => {
            const item = getExtra(e.id);
            if (!item) return null;
            const line =
              item.chargeType === "per_day"
                ? item.priceMinor * totals.days * e.quantity
                : item.priceMinor * e.quantity;
            return (
              <LineItem
                key={e.id}
                label={`${item.name}${e.quantity > 1 ? ` ×${e.quantity}` : ""}`}
                amount={line}
                currency={currency}
                payInPerson
              />
            );
          })}
        {(() => {
          const mileage = getMileageOption(draft.mileageId ?? "included_200");
          if (!mileage || totals.mileageTotalMinor === 0) return null;
          return (
            <LineItem
              label={mileage.name}
              amount={totals.mileageTotalMinor}
              currency={currency}
              payInPerson
            />
          );
        })()}
        {(() => {
          const pkg = getProtection(draft.protectionId ?? "basic");
          if (!pkg) return null;
          return (
            <LineItem
              label={pkg.name}
              amount={totals.protectionTotalMinor}
              currency={currency}
              payInPerson
            />
          );
        })()}

        <div className="border-t border-border pt-3">
          <div className="flex justify-between gap-3 text-muted">
            <dt>Hire total</dt>
            <dd className="text-right">
              <span className="font-medium text-foreground">
                {formatMoney(totals.hireTotalMinor, currency)}
              </span>
              <span className="mt-0.5 block text-xs">Pay in person</span>
            </dd>
          </div>
        </div>

        <div className="flex justify-between gap-3 rounded-lg bg-brand/5 px-3 py-2.5">
          <dt className="text-xs font-bold uppercase tracking-wide text-brand">
            Due today
          </dt>
          <dd className="text-base font-bold text-brand">
            {formatMoney(totals.depositMinor, currency)}
          </dd>
        </div>

        <div className="flex justify-between gap-3 text-sm">
          <dt className="text-muted">Balance due in person</dt>
          <dd className="font-semibold text-foreground">
            {formatMoney(totals.balanceDueMinor, currency)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        Pay a £50 deposit now to reserve your van. The remaining balance is due
        at pick-up.
      </p>

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

function LineItem({
  label,
  amount,
  currency,
  payInPerson,
}: {
  label: string;
  amount: number;
  currency: string;
  payInPerson?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">
        <span className="font-medium">{formatMoney(amount, currency)}</span>
        {payInPerson && (
          <span className="mt-0.5 block text-xs text-muted">Pay in person</span>
        )}
      </dd>
    </div>
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
