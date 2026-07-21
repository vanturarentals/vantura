/** Booking wizard step order and progress gating. */

import type { BookingDraft } from "@/lib/booking-draft";

export const BOOKING_STEPS = [
  { slug: "extras", label: "Extras" },
  { slug: "protection", label: "Protection" },
  { slug: "driver", label: "Driver" },
  { slug: "licence", label: "Licence" },
  { slug: "review", label: "Reserve" },
] as const;

export type BookingStepSlug = (typeof BOOKING_STEPS)[number]["slug"];

export function bookingStepIndex(slug: string): number {
  const idx = BOOKING_STEPS.findIndex((s) => s.slug === slug);
  return idx === -1 ? 0 : idx;
}

export function inferFurthestStepIndex(draft: BookingDraft): number {
  if (typeof draft.furthestStepIndex === "number") return draft.furthestStepIndex;
  if (draft.licence?.frontDataUrl && draft.licence?.backDataUrl) {
    return bookingStepIndex("review");
  }
  if (
    draft.driver.firstName &&
    draft.driver.lastName &&
    draft.driver.email &&
    draft.driver.phone &&
    draft.driver.dateOfBirth &&
    draft.driver.occupation &&
    draft.driver.licenceValidFrom &&
    draft.driver.licenceCategories &&
    draft.driver.convictions5Years &&
    draft.driver.accidents5Years &&
    draft.driver.refusedInsurance &&
    draft.driver.medicalConditions &&
    draft.driver.declaredConvictions &&
    draft.driver.declaredAccidents &&
    draft.driver.declaredMedical &&
    draft.driver.entitledToDriveUk &&
    draft.driver.notUnderInfluence
  ) {
    return bookingStepIndex("licence");
  }
  return bookingStepIndex("extras");
}

export function isStepReachable(draft: BookingDraft, stepIndex: number): boolean {
  return stepIndex <= inferFurthestStepIndex(draft);
}

/** Call when the user completes a step via Continue. */
export function completeBookingStep(
  draft: BookingDraft,
  completedStepIndex: number,
): BookingDraft {
  const next = Math.max(inferFurthestStepIndex(draft), completedStepIndex + 1);
  const capped = Math.min(next, BOOKING_STEPS.length - 1);
  return { ...draft, furthestStepIndex: capped };
}

export function reachableStepSlug(draft: BookingDraft): BookingStepSlug {
  const idx = inferFurthestStepIndex(draft);
  return BOOKING_STEPS[idx]?.slug ?? "extras";
}
