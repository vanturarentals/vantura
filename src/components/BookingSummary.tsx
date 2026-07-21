"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/pricing";
import { computeBookingTotals } from "@/lib/booking-totals";
import { getExtra } from "@/lib/extras";
import { getProtection } from "@/lib/protections";
import { getMileageOption, excessMileageLabel } from "@/lib/mileage";
import { companyConfig, firstBookingPromo } from "@/lib/company";
import { useFirstBookingPromo } from "@/lib/use-first-booking-promo";
import type { BookingDraft } from "@/lib/booking-draft";

interface Props {
  draft: BookingDraft;
}

export default function BookingSummary({ draft }: Props) {
  const promo = useFirstBookingPromo();
  const totals = computeBookingTotals(draft, {
    promoEligible: promo.eligible,
  });
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

      {!promo.loading && promo.eligible && (
        <p className="mt-4 rounded-lg bg-brand/10 px-3 py-2 text-xs font-medium text-brand">
          {firstBookingPromo.discountPercent}% first booking discount applied to
          van rental
        </p>
      )}

      {!promo.loading && !promo.eligible && promo.reason === "not_signed_in" && (
        <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
          <Link href="/login" className="font-semibold text-brand underline">
            Sign in
          </Link>{" "}
          to unlock {firstBookingPromo.discountPercent}% off your first van
          rental.{" "}
          <Link href="/promotions" className="text-brand underline">
            Terms
          </Link>
        </p>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">
            Van · {totals.days} day{totals.days === 1 ? "" : "s"}
          </dt>
          <dd className="text-right">
            {totals.promoDiscountMinor > 0 ? (
              <>
                <span className="block text-xs text-muted line-through">
                  {formatMoney(totals.vanTotalMinor, currency)}
                </span>
                <span className="font-medium text-foreground">
                  {formatMoney(totals.vanTotalAfterPromoMinor, currency)}
                </span>
                <span className="mt-0.5 block text-xs text-brand">
                  After {firstBookingPromo.discountPercent}% discount
                </span>
              </>
            ) : (
              <>
                <span className="font-medium">
                  {formatMoney(totals.vanTotalMinor, currency)}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Pay in person
                </span>
              </>
            )}
          </dd>
        </div>

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
          if (!mileage) return null;
          return (
            <>
              <LineItem
                label={mileage.name}
                amount={totals.mileageTotalMinor}
                currency={currency}
                payInPerson
                sublabel={
                  mileage.id === "included_200"
                    ? "Included allowance"
                    : undefined
                }
              />
              {mileage.id === "included_200" && (
                <p className="text-xs text-muted">
                  Excess mileage: {excessMileageLabel(currency)}
                </p>
              )}
            </>
          );
        })()}
        {(() => {
          const pkg = getProtection(draft.protectionId ?? "basic");
          if (!pkg) return null;
          return (
            <>
              <LineItem
                label={pkg.name}
                amount={totals.protectionTotalMinor}
                currency={currency}
                payInPerson
              />
              {pkg.excessMinor != null && pkg.excessMinor > 0 && (
                <p className="text-xs text-muted">
                  Insurance excess: {formatMoney(pkg.excessMinor, currency)}
                </p>
              )}
            </>
          );
        })()}

        {totals.promoDiscountMinor > 0 && (
          <LineItem
            label={`First booking discount (${firstBookingPromo.discountPercent}% off van rental)`}
            amount={-totals.promoDiscountMinor}
            currency={currency}
            highlight
          />
        )}

        <div className="border-t border-border pt-3">
          {totals.promoDiscountMinor > 0 && (
            <div className="mb-2 flex justify-between gap-3 text-xs text-muted">
              <dt>Subtotal before discount</dt>
              <dd className="line-through">
                {formatMoney(totals.hireTotalMinor, currency)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-3 text-muted">
            <dt>Hire total (inc. VAT)</dt>
            <dd className="text-right">
              <span className="font-medium text-foreground">
                {formatMoney(totals.hireTotalAfterPromoMinor, currency)}
              </span>
              <span className="mt-0.5 block text-xs">Pay in person</span>
            </dd>
          </div>
          {companyConfig.vatRegistered && totals.vatTotalMinor > 0 && (
            <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
              <dt>
                Includes VAT
                {companyConfig.vatNumber !== "[VAT number]"
                  ? ` (${companyConfig.vatNumber})`
                  : ""}
              </dt>
              <dd>{formatMoney(totals.vatTotalMinor, currency)}</dd>
            </div>
          )}
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
          <dd className="text-right">
            <span className="font-semibold text-foreground">
              {formatMoney(totals.balanceDueMinor, currency)}
            </span>
            {totals.promoDiscountMinor > 0 && (
              <span className="mt-0.5 block text-xs text-brand">
                Includes {firstBookingPromo.discountPercent}% van rental discount
              </span>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        Pay a £50 deposit now to reserve your van. The remaining balance is due
        at pick-up
        {totals.promoDiscountMinor > 0
          ? ", after your first-booking discount on van rental"
          : ""}
        .
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
  sublabel,
  highlight,
}: {
  label: string;
  amount: number;
  currency: string;
  payInPerson?: boolean;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={highlight ? "font-medium text-brand" : "text-muted"}>
        {label}
        {sublabel && (
          <span className="mt-0.5 block text-xs">{sublabel}</span>
        )}
      </dt>
      <dd className="text-right">
        <span className={`font-medium ${highlight ? "text-brand" : ""}`}>
          {amount === 0
            ? "Included"
            : amount < 0
              ? `−${formatMoney(-amount, currency)}`
              : formatMoney(amount, currency)}
        </span>
        {payInPerson && amount > 0 && (
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
