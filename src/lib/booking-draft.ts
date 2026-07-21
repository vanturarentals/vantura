/** Client-side booking draft stored between multi-step screens. */

import type { ProtectionId } from "@/lib/protections";
import type { MileageId } from "@/lib/mileage";

export interface BookingExtraQty {
  id: string;
  quantity: number;
}

export interface BookingDraft {
  vanId: string;
  vanName: string;
  imageUrl: string | null;
  dailyRateMinor: number;
  currency: string;
  pickupAt: string;
  dropoffAt: string;
  pickupLocation: string;
  dropoffLocation: string;
  differentReturn: boolean;
  extras: BookingExtraQty[];
  protectionId: ProtectionId;
  mileageId: MileageId;
  /** Highest booking step index the user may open (0 = extras only). */
  furthestStepIndex?: number;
  driver: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    /** Country of residence. */
    country: string;
    occupation: string;
    licenceCountry: string;
    licenceValidFrom: string;
    licenceCategories: string;
    /** "yes" | "no" | "" */
    convictions5Years: string;
    accidents5Years: string;
    refusedInsurance: string;
    medicalConditions: string;
    declaredConvictions: boolean;
    declaredAccidents: boolean;
    declaredMedical: boolean;
    entitledToDriveUk: boolean;
    notUnderInfluence: boolean;
  };
  /** Compressed data-URL previews of licence photos (front/back). */
  licence?: {
    frontDataUrl: string;
    frontName: string;
    backDataUrl: string;
    backName: string;
  };
}

const KEY = "vantura_booking_draft";

export function loadDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: BookingDraft): void {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function updateDraft(patch: Partial<BookingDraft>): BookingDraft | null {
  const current = loadDraft();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveDraft(next);
  return next;
}

export function clearDraft(): void {
  sessionStorage.removeItem(KEY);
}
