"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BOOKING_STEPS,
  inferFurthestStepIndex,
  isStepReachable,
} from "@/lib/booking-progress";
import { useBookingDraft } from "@/lib/use-booking-draft";

export default function BookingSteps({ vanId }: { vanId: string }) {
  const pathname = usePathname();
  const draft = useBookingDraft(vanId);
  const base = `/book/${vanId}`;
  const furthest = draft ? inferFurthestStepIndex(draft) : 0;

  function isActive(slug: string) {
    return pathname.endsWith(`/${slug}`);
  }

  const activeIdx = BOOKING_STEPS.findIndex((s) => isActive(s.slug));

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {BOOKING_STEPS.map((step, i) => {
          const href = `${base}/${step.slug}`;
          const active = isActive(step.slug);
          const reachable = draft ? isStepReachable(draft, i) : i === 0;
          const done = activeIdx > i || (i < furthest && !active);

          return (
            <li key={step.slug} className="flex items-center gap-1">
              {i > 0 && (
                <span className="mx-1 text-border" aria-hidden>
                  →
                </span>
              )}
              {reachable ? (
                <Link
                  href={href}
                  className={
                    active
                      ? "font-bold text-brand"
                      : done
                        ? "font-medium text-foreground hover:text-brand"
                        : "font-medium text-muted hover:text-brand"
                  }
                  aria-current={active ? "step" : undefined}
                >
                  {step.label}
                </Link>
              ) : (
                <span
                  className="cursor-not-allowed font-medium text-muted/50"
                  aria-disabled="true"
                  title="Complete the previous step first"
                >
                  {step.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
