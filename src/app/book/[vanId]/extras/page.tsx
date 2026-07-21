"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import BookingExtrasForm from "@/components/BookingExtrasForm";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import { completeBookingStep } from "@/lib/booking-progress";
import { rentalDays } from "@/lib/pricing";

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

  return (
    <div>
      <BookingSteps vanId={vanId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-brand">Extras &amp; mileage</h1>
            <p className="mt-2 text-sm text-muted">
              Choose your mileage package and any optional add-ons. You can skip
              equipment — the standard 200 mile package is already selected.
            </p>
          </div>

          <BookingExtrasForm
            draft={current}
            days={days}
            onChange={(patch) => writeDraft({ ...current, ...patch })}
          />

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/vans?${new URLSearchParams({
                    pickupAt: current.pickupAt,
                    dropoffAt: current.dropoffAt,
                  }).toString()}`,
                )
              }
              className="btn-ghost px-0"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                writeDraft(completeBookingStep(current, 0));
                router.push(`/book/${vanId}/protection`);
              }}
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
