"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { EXTRAS } from "@/lib/extras";
import { formatMoney, rentalDays } from "@/lib/pricing";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";

export default function ExtrasPage() {
  const { vanId } = useParams<{ vanId: string }>();
  const router = useRouter();
  const draft = useBookingDraft(vanId);

  if (!draft) {
    return (
      <p className="text-muted">
        Missing booking details.{" "}
        <Link href="/" className="text-brand underline">
          Start again
        </Link>
      </p>
    );
  }

  const current = draft;
  const days = rentalDays(current.pickupAt, current.dropoffAt);

  function qty(id: string): number {
    return current.extras.find((e) => e.id === id)?.quantity ?? 0;
  }

  function setQty(id: string, quantity: number) {
    const nextQty = Math.max(0, quantity);
    const extras = current.extras.filter((e) => e.id !== id);
    if (nextQty > 0) extras.push({ id, quantity: nextQty });
    writeDraft({ ...current, extras });
  }

  return (
    <div>
      <BookingSteps vanId={vanId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-brand">Extras</h1>
          <p className="text-sm text-muted">
            Optional add-ons for your hire. You can skip this step.
          </p>

          <ul className="space-y-3">
            {EXTRAS.map((item) => {
              const q = qty(item.id);
              const unitLabel =
                item.chargeType === "per_day"
                  ? `${formatMoney(item.priceMinor, current.currency)} / day`
                  : `${formatMoney(item.priceMinor, current.currency)} flat`;
              return (
                <li
                  key={item.id}
                  className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted">{item.description}</p>
                    <p className="mt-1 text-sm font-medium text-brand">
                      {unitLabel}
                      {item.chargeType === "per_day" && days > 1
                        ? ` · ${formatMoney(item.priceMinor * days, current.currency)} for ${days} days`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={`Decrease ${item.name}`}
                      onClick={() => setQty(item.id, q - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border font-bold hover:bg-surface"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold">{q}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${item.name}`}
                      onClick={() => setQty(item.id, q + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border font-bold hover:bg-surface"
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push(`/book/${vanId}`)}
              className="btn-ghost px-0"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => router.push(`/book/${vanId}/driver`)}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </div>

        <BookingSummary draft={current} />
      </div>
    </div>
  );
}
