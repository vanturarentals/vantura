/** Domain types — aligned to the Airtable base `appVRvdqJG6fSUrmp`. */

/** Matches the Airtable "Payment Status" single-select exactly. */
export type PaymentStatus = "Pending" | "Paid" | "Cancelled";

/**
 * Van "Status" values that take a van out of the rentable fleet entirely.
 * Everything else (Active, Available, Rented) is bookable — actual availability
 * for a given window is decided by booking date-overlaps, not this status.
 */
export const OUT_OF_SERVICE_VAN_STATUSES = ["Maintenance", "Retired"];

export interface Van {
  /** Airtable record id. */
  id: string;
  name: string;
  /** Daily rate in the smallest currency unit (pence). */
  dailyRateMinor: number;
  status: string;
  imageUrl: string | null;
  /** Branch names this van can be picked up from ("Pickup Locations"). */
  pickupLocations: string[];
  bookable: boolean;
}

export interface Booking {
  /** Airtable record id (used internally + in Stripe metadata). */
  id: string;
  /** Airtable auto-number "Booking ID" (internal only). */
  number: number | null;
  /** Public 9-char booking reference (e.g. K7M2X9QP4). */
  reference: string | null;
  customerName: string;
  email: string;
  vanId: string | null;
  vanName: string;
  pickupLocation: string;
  dropoffLocation: string;
  /** ISO 8601 datetime strings. */
  startAt: string;
  endAt: string;
  totalAmountMinor: number;
  currency: string;
  paymentStatus: PaymentStatus;
  stripeSessionId: string | null;
  /** Supabase auth user id when booked while logged in. */
  userId: string | null;
  /** Airtable record creation time — used to expire unpaid holds. */
  createdTime: string;
}

/** Payload the browser sends to start a booking. */
export interface CheckoutRequest {
  vanId: string;
  pickupLocation: string;
  dropoffLocation: string;
  startAt: string;
  endAt: string;
  customerName: string;
  email: string;
  phone?: string;
  extras?: { id: string; quantity: number }[];
  licence?: {
    frontDataUrl: string;
    frontName: string;
    backDataUrl: string;
    backName: string;
  };
}
