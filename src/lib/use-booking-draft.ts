"use client";

import { useSyncExternalStore } from "react";
import {
  loadDraft,
  saveDraft as persistDraft,
  type BookingDraft,
} from "@/lib/booking-draft";

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function emit() {
  for (const listener of listeners) listener();
}

/** Persist a draft and notify all subscribed booking steps. */
export function writeDraft(draft: BookingDraft): void {
  persistDraft(draft);
  emit();
}

/**
 * Live booking draft from sessionStorage. SSR snapshot is always null;
 * the client snapshot filters by vanId when provided.
 */
export function useBookingDraft(vanId?: string): BookingDraft | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      const draft = loadDraft();
      if (!draft) return null;
      if (vanId && draft.vanId !== vanId) return null;
      return draft;
    },
    () => null,
  );
}
