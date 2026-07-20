"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { formatMoney, rentalDays } from "@/lib/pricing";
import {
  PROTECTIONS,
  type ProtectionId,
  type ProtectionPackage,
} from "@/lib/protections";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import { completeBookingStep } from "@/lib/booking-progress";
import { useBookingStepGuard } from "@/lib/use-booking-step-guard";

export default function ProtectionPage() {
  const { vanId } = useParams<{ vanId: string }>();
  const router = useRouter();
  const draft = useBookingDraft(vanId);
  useBookingStepGuard(vanId, "protection");

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
  const selected = current.protectionId ?? "basic";

  function selectProtection(id: ProtectionId) {
    writeDraft({ ...current, protectionId: id });
  }

  return (
    <div>
      <BookingSteps vanId={vanId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-brand">
            Which protection package do you need?
          </h1>

          <div className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            <InfoIcon />
            <p>
              Drivers must have held their driving licence for at least 4 years
              for this vehicle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PROTECTIONS.map((pkg) => (
              <ProtectionCard
                key={pkg.id}
                pkg={pkg}
                days={days}
                currency={current.currency}
                selected={selected === pkg.id}
                onSelect={() => selectProtection(pkg.id)}
              />
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push(`/book/${vanId}/extras`)}
              className="btn-ghost px-0"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                writeDraft(completeBookingStep(current, 1));
                router.push(`/book/${vanId}/driver`);
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

function ProtectionCard({
  pkg,
  days,
  currency,
  selected,
  onSelect,
}: {
  pkg: ProtectionPackage;
  days: number;
  currency: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const dayTotal = pkg.priceMinor * days;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-full cursor-pointer flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${
        selected
          ? "border-brand ring-2 ring-brand/20"
          : "border-border hover:border-brand/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{pkg.name}</h2>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-brand bg-brand" : "border-border bg-white"
          }`}
          aria-hidden
        >
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-0.5" aria-label={`${pkg.stars} of 3 stars`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <StarIcon key={i} filled={i < pkg.stars} />
        ))}
      </div>

      <p className="mt-4 text-sm">
        {pkg.excessMinor != null ? (
          <>
            Excess: up to{" "}
            <span className="font-bold text-foreground">
              {formatMoney(pkg.excessMinor, currency)}
            </span>
          </>
        ) : (
          <span className="font-bold text-brand">No excess</span>
        )}
      </p>

      <ul className="mt-4 flex-1 space-y-2.5 text-sm">
        {pkg.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2">
            {feature.included ? (
              <CheckIcon />
            ) : (
              <CrossIcon />
            )}
            <span
              className={
                feature.included ? "text-foreground" : "text-muted line-through"
              }
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xl font-bold text-foreground">
          {formatMoney(pkg.priceMinor, currency)}
          <span className="text-sm font-semibold text-muted"> / day</span>
        </p>
        {days > 1 && (
          <p className="mt-0.5 text-sm text-muted">
            {formatMoney(dayTotal, currency)} for {days} days
          </p>
        )}
      </div>
    </button>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className={filled ? "text-foreground" : "text-border"}
      aria-hidden
    >
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18.8 22 12 18.1 5.2 22l2.3-7.3L2 10l7.1-1.1L12 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="mt-0.5 shrink-0 text-brand"
      aria-hidden
    >
      <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="mt-0.5 shrink-0 text-border"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="mt-0.5 shrink-0 text-brand"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" strokeLinecap="round" />
    </svg>
  );
}
