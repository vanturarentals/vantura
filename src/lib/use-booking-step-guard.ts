"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type BookingStepSlug,
  bookingStepIndex,
  inferFurthestStepIndex,
  reachableStepSlug,
} from "@/lib/booking-progress";
import { useBookingDraft } from "@/lib/use-booking-draft";

/** Redirect if the user opens a booking step before completing prior steps. */
export function useBookingStepGuard(vanId: string, stepSlug: BookingStepSlug) {
  const router = useRouter();
  const draft = useBookingDraft(vanId);

  useEffect(() => {
    if (!draft) return;
    const required = bookingStepIndex(stepSlug);
    const allowed = inferFurthestStepIndex(draft);
    if (required > allowed) {
      router.replace(`/book/${vanId}/${reachableStepSlug(draft)}`);
    }
  }, [draft, router, stepSlug, vanId]);
}
