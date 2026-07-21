"use client";

import { EXTRAS, formatExtraPrice, normalizeExtraId } from "@/lib/extras";
import {
  MILEAGE_OPTIONS,
  excessMileageLabel,
  type MileageId,
} from "@/lib/mileage";
import { formatMoney } from "@/lib/pricing";
import type { BookingDraft } from "@/lib/booking-draft";

interface Props {
  draft: BookingDraft;
  days: number;
  onChange: (patch: Partial<BookingDraft>) => void;
}

export default function BookingExtrasForm({ draft, days, onChange }: Props) {
  function qty(id: string): number {
    const normalized = normalizeExtraId(id);
    return draft.extras.find((e) => normalizeExtraId(e.id) === normalized)?.quantity ?? 0;
  }

  function toggleExtra(id: string, checked: boolean) {
    const normalized = normalizeExtraId(id);
    const extras = draft.extras.filter(
      (e) => normalizeExtraId(e.id) !== normalized,
    );
    if (checked) extras.push({ id: normalized, quantity: 1 });
    onChange({ extras });
  }

  function setMileage(mileageId: MileageId) {
    onChange({ mileageId });
  }

  const equipment = EXTRAS.filter((e) => e.category === "equipment");
  const services = EXTRAS.filter((e) => e.category === "service");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Mileage package</h2>
          <p className="mt-1 text-sm text-muted">
            Choose one package for your hire. Mileage is calculated per hire day.
          </p>
        </div>

        <ul className="space-y-2" role="radiogroup" aria-label="Mileage package">
          {MILEAGE_OPTIONS.map((option) => {
            const selected = (draft.mileageId ?? "included_200") === option.id;
            const priceLabel =
              option.priceMinorPerDay > 0
                ? `${formatMoney(option.priceMinorPerDay, draft.currency)} / day`
                : "Included";
            const lineTotal =
              option.priceMinorPerDay > 0
                ? option.priceMinorPerDay * days
                : 0;
            return (
              <li key={option.id}>
                <label
                  className={`panel flex cursor-pointer gap-3 p-4 transition-colors ${
                    selected
                      ? "ring-2 ring-brand ring-offset-1"
                      : "hover:border-brand/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="mileage-package"
                    checked={selected}
                    onChange={() => setMileage(option.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-brand"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-foreground">
                        {option.name}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          option.priceMinorPerDay === 0
                            ? "text-brand"
                            : "text-foreground"
                        }`}
                      >
                        {priceLabel}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {option.description}
                      {lineTotal > 0 && days > 1
                        ? ` · ${formatMoney(lineTotal, draft.currency)} for ${days} days`
                        : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="rounded-lg bg-surface px-4 py-3 text-sm text-muted">
          <strong className="font-semibold text-foreground">Excess mileage:</strong>{" "}
          if you go over your allowance, additional miles are charged at{" "}
          <strong className="text-foreground">{excessMileageLabel(draft.currency)}</strong>{" "}
          (billed after your hire).
        </p>
      </section>

      {services.length > 0 && (
        <ExtraSection
          title="Drivers"
          description="Add services for your hire."
          items={services}
          days={days}
          currency={draft.currency}
          qty={qty}
          onToggle={toggleExtra}
        />
      )}

      {equipment.length > 0 && (
        <ExtraSection
          title="Equipment & add-ons"
          description="Optional — tick anything you need. All charges are added to your hire total."
          items={equipment}
          days={days}
          currency={draft.currency}
          qty={qty}
          onToggle={toggleExtra}
        />
      )}
    </div>
  );
}

function ExtraSection({
  title,
  description,
  items,
  days,
  currency,
  qty,
  onToggle,
}: {
  title: string;
  description: string;
  items: typeof EXTRAS;
  days: number;
  currency: string;
  qty: (id: string) => number;
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const selected = qty(item.id) > 0;
          const { unitLabel, totalLabel } = formatExtraPrice(item, days, currency);
          return (
            <li key={item.id}>
              <label
                className={`panel flex cursor-pointer gap-3 p-4 transition-colors ${
                  selected ? "ring-2 ring-brand ring-offset-1" : "hover:border-brand/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onToggle(item.id, e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded accent-brand"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {unitLabel}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {item.description}
                    {totalLabel ? ` · ${totalLabel}` : ""}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
