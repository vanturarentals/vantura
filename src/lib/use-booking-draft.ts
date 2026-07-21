"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  saveDraft as persistDraft,
  type BookingDraft,
} from "@/lib/booking-draft";
import { normalizeDriver } from "@/lib/driver-defaults";
import { normalizeExtras } from "@/lib/extras";
import { normalizeProtectionId } from "@/lib/protections";
import { inferFurthestStepIndex } from "@/lib/booking-progress";

const listeners = new Set<() => void>();

/** Cached snapshots so getSnapshot returns a stable reference. */
let cachedRaw: string | null | undefined;
let cachedDraft: BookingDraft | null = null;

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function emit() {
  // Invalidate cache so the next getSnapshot re-reads sessionStorage.
  cachedRaw = undefined;
  cachedDraft = null;
  for (const listener of listeners) listener();
}

function readCachedDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem("vantura_booking_draft");
  } catch {
    return null;
  }

  if (raw === cachedRaw) return cachedDraft;

  cachedRaw = raw;
  if (!raw) {
    cachedDraft = null;
    return null;
  }
  try {
    cachedDraft = JSON.parse(raw) as BookingDraft;
    if (cachedDraft.protectionId) {
      cachedDraft = {
        ...cachedDraft,
        protectionId: normalizeProtectionId(cachedDraft.protectionId as string),
      };
    } else {
      cachedDraft = { ...cachedDraft, protectionId: "basic" };
    }
    if (!cachedDraft.mileageId) {
      cachedDraft = { ...cachedDraft, mileageId: "included_200" };
    }
    cachedDraft = {
      ...cachedDraft,
      furthestStepIndex: inferFurthestStepIndex(cachedDraft),
      driver: normalizeDriver(cachedDraft.driver),
      extras: normalizeExtras(cachedDraft.extras ?? []),
    };
  } catch {
    cachedDraft = null;
  }
  return cachedDraft;
}

/** Persist a draft and notify all subscribed booking steps. */
export function writeDraft(draft: BookingDraft): void {
  persistDraft(draft);
  emit();
}

/**
 * Live booking draft from sessionStorage.
 * Snapshots are cached so React's useSyncExternalStore gets a stable reference
 * (returning a new object every read causes an infinite update loop).
 */
export function useBookingDraft(vanId?: string): BookingDraft | null {
  const getSnapshot = useCallback(() => {
    const draft = readCachedDraft();
    if (!draft) return null;
    if (vanId && draft.vanId !== vanId) return null;
    return draft;
  }, [vanId]);

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
