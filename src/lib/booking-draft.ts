/** Client-side booking draft stored between multi-step screens. */

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
  driver: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    country: string;
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
