/** Create/read/update bookings in Airtable (real base schema). */
import {
  AirtableRecord,
  FIELDS,
  createRecord,
  escapeFormulaValue,
  getRecord,
  listRecords,
  updateRecord,
  uploadAttachment,
} from "./airtable";
import { airtableConfig } from "./config";
import type { Booking, PaymentStatus, RefundStatus } from "./types";
import { generateBookingReference } from "./booking-reference";
import { canSelfCancelOnline } from "./support";

/** How long an unpaid (Pending) booking holds a van before it's released. */
const HOLD_MINUTES = 30;

function firstLinkedId(value: unknown): string | null {
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return null;
}

function mapBooking(record: AirtableRecord): Booking {
  const f = record.fields;
  const amount = Number(f[FIELDS.booking.totalAmount] ?? 0);
  const numberValue = f[FIELDS.booking.number];
  const referenceRaw = f[FIELDS.booking.reference];
  const refundRaw = f[FIELDS.booking.refundStatus];
  const cancelRaw = f[FIELDS.booking.cancelRequestedAt];
  return {
    id: record.id,
    number: typeof numberValue === "number" ? numberValue : null,
    reference:
      typeof referenceRaw === "string" && referenceRaw.trim()
        ? referenceRaw.trim().toUpperCase()
        : null,
    customerName: String(f[FIELDS.booking.customerName] ?? ""),
    email: String(f[FIELDS.booking.email] ?? ""),
    vanId: firstLinkedId(f[FIELDS.booking.van]),
    vanName: "",
    pickupLocation: String(f[FIELDS.booking.pickupLocation] ?? ""),
    dropoffLocation: String(f[FIELDS.booking.dropoffLocation] ?? ""),
    startAt: String(f[FIELDS.booking.startAt] ?? ""),
    endAt: String(f[FIELDS.booking.endAt] ?? ""),
    totalAmountMinor: Math.round(amount * 100),
    currency: String(f[FIELDS.booking.currency] ?? ""),
    paymentStatus: (String(
      f[FIELDS.booking.paymentStatus] ?? "Pending",
    ) as PaymentStatus),
    stripeSessionId: (f[FIELDS.booking.stripeSessionId] as string) ?? null,
    userId: (() => {
      const raw = f[FIELDS.booking.userId];
      return typeof raw === "string" && raw.trim() ? raw.trim() : null;
    })(),
    cancelRequestedAt:
      typeof cancelRaw === "string" && cancelRaw ? cancelRaw : null,
    refundStatus:
      typeof refundRaw === "string" && refundRaw
        ? (refundRaw as RefundStatus)
        : null,
    createdTime: record.createdTime,
  };
}

/**
 * Bookings that still hold a van: Paid, or Pending with an unexpired hold
 * (based on the Airtable record creation time). Cancelled and expired-pending
 * bookings are ignored.
 */
export async function getActiveBookings(): Promise<Booking[]> {
  const records = await listRecords(airtableConfig.bookingsTable, {
    filterByFormula: `{${FIELDS.booking.paymentStatus}}!="Cancelled"`,
  });

  const cutoff = Date.now() - HOLD_MINUTES * 60 * 1000;
  return records.map(mapBooking).filter((b) => {
    if (b.paymentStatus === "Paid") return true;
    if (b.paymentStatus !== "Pending") return false;
    // Keep pending holds only while unexpired.
    return new Date(b.createdTime).getTime() > cutoff;
  });
}

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    return mapBooking(await getRecord(airtableConfig.bookingsTable, id));
  } catch {
    return null;
  }
}

export async function getBookingBySessionId(
  sessionId: string,
): Promise<Booking | null> {
  const formula = `{${FIELDS.booking.stripeSessionId}}="${escapeFormulaValue(
    sessionId,
  )}"`;
  const records = await listRecords(airtableConfig.bookingsTable, {
    filterByFormula: formula,
    maxRecords: "1",
  });
  return records.length ? mapBooking(records[0]) : null;
}

export async function getBookingByReference(
  reference: string,
): Promise<Booking | null> {
  const clean = reference.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  if (!clean) return null;
  const formula = `{${FIELDS.booking.reference}}="${escapeFormulaValue(clean)}"`;
  const records = await listRecords(airtableConfig.bookingsTable, {
    filterByFormula: formula,
    maxRecords: "1",
  });
  return records.length ? mapBooking(records[0]) : null;
}

/** Guest manage: reference must match and email must match (case-insensitive). */
export async function getBookingByReferenceAndEmail(
  reference: string,
  email: string,
): Promise<Booking | null> {
  const booking = await getBookingByReference(reference);
  if (!booking) return null;
  if (booking.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return null;
  }
  return booking;
}

/** Bookings for a signed-in user (by User Id or matching email). */
export async function listBookingsForUser(input: {
  userId: string;
  email: string;
}): Promise<Booking[]> {
  const email = escapeFormulaValue(input.email.trim().toLowerCase());
  const userId = escapeFormulaValue(input.userId);
  const formula = `OR({${FIELDS.booking.userId}}="${userId}", LOWER({${FIELDS.booking.email}})="${email}")`;
  const records = await listRecords(airtableConfig.bookingsTable, {
    filterByFormula: formula,
  });
  return records
    .map(mapBooking)
    .sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
}

/** Attach User Id on guest bookings that match this email. */
export async function claimBookingsForEmail(
  userId: string,
  email: string,
): Promise<number> {
  const formula = `AND(LOWER({${FIELDS.booking.email}})="${escapeFormulaValue(email.trim().toLowerCase())}", {${FIELDS.booking.userId}}=BLANK())`;
  const records = await listRecords(airtableConfig.bookingsTable, {
    filterByFormula: formula,
  });
  let claimed = 0;
  for (const record of records) {
    await updateRecord(airtableConfig.bookingsTable, record.id, {
      [FIELDS.booking.userId]: userId,
    });
    claimed += 1;
  }
  return claimed;
}

export interface NewPendingBooking {
  vanId: string;
  customerName: string;
  email: string;
  pickupLocation: string;
  dropoffLocation: string;
  startAt: string;
  endAt: string;
  totalAmountMinor: number;
  currency: string;
  userId?: string | null;
}

export async function createPendingBooking(
  input: NewPendingBooking,
): Promise<Booking> {
  // Extremely unlikely collision; retry a couple of times just in case.
  let reference = generateBookingReference();
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await getBookingByReference(reference);
    if (!existing) break;
    reference = generateBookingReference();
  }

  const fields: Record<string, unknown> = {
    [FIELDS.booking.reference]: reference,
    [FIELDS.booking.customerName]: input.customerName,
    [FIELDS.booking.email]: input.email,
    [FIELDS.booking.van]: [input.vanId],
    [FIELDS.booking.startAt]: input.startAt,
    [FIELDS.booking.endAt]: input.endAt,
    [FIELDS.booking.paymentStatus]: "Pending",
    [FIELDS.booking.pickupLocation]: input.pickupLocation,
    [FIELDS.booking.dropoffLocation]: input.dropoffLocation,
    [FIELDS.booking.totalAmount]: input.totalAmountMinor / 100,
    [FIELDS.booking.currency]: input.currency,
  };
  if (input.userId) {
    fields[FIELDS.booking.userId] = input.userId;
  }

  const record = await createRecord(airtableConfig.bookingsTable, fields);

  return mapBooking(record);
}

export async function attachStripeSession(
  bookingId: string,
  sessionId: string,
): Promise<void> {
  await updateRecord(airtableConfig.bookingsTable, bookingId, {
    [FIELDS.booking.stripeSessionId]: sessionId,
  });
}

function parseDataUrl(dataUrl: string): { contentType: string; base64: string } {
  const prefix = "data:";
  const marker = ";base64,";
  if (!dataUrl.startsWith(prefix) || !dataUrl.includes(marker)) {
    throw new Error("Invalid licence image payload.");
  }
  const markerAt = dataUrl.indexOf(marker);
  const contentType = dataUrl.slice(prefix.length, markerAt);
  const base64 = dataUrl.slice(markerAt + marker.length);
  if (!contentType.startsWith("image/") || !base64) {
    throw new Error("Invalid licence image payload.");
  }
  return { contentType, base64 };
}

/** Attach compressed licence photos to a booking record. */
export async function attachLicencePhotos(
  bookingId: string,
  licence: {
    frontDataUrl: string;
    frontName: string;
    backDataUrl: string;
    backName: string;
  },
): Promise<void> {
  const front = parseDataUrl(licence.frontDataUrl);
  const back = parseDataUrl(licence.backDataUrl);

  await uploadAttachment({
    recordId: bookingId,
    fieldName: FIELDS.booking.licenceFront,
    filename: licence.frontName || "licence-front.jpg",
    contentType: front.contentType,
    base64: front.base64,
  });
  await uploadAttachment({
    recordId: bookingId,
    fieldName: FIELDS.booking.licenceBack,
    filename: licence.backName || "licence-back.jpg",
    contentType: back.contentType,
    base64: back.base64,
  });
}

export async function setPaymentStatus(
  bookingId: string,
  status: PaymentStatus,
): Promise<Booking> {
  return mapBooking(
    await updateRecord(airtableConfig.bookingsTable, bookingId, {
      [FIELDS.booking.paymentStatus]: status,
    }),
  );
}

/** Whether this auth user may manage the booking. */
export function userOwnsBooking(
  booking: Booking,
  user: { id: string; email?: string | null },
): boolean {
  if (booking.userId && booking.userId === user.id) return true;
  if (
    user.email &&
    booking.email.trim().toLowerCase() === user.email.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

/**
 * Account self-cancel: Payment Status → Cancelled, stamp cancel time,
 * mark refund Pending if the hire was Paid.
 */
export async function requestBookingCancellation(
  bookingId: string,
): Promise<Booking> {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found.");
  if (booking.paymentStatus === "Cancelled") {
    return booking;
  }
  if (!canSelfCancelOnline(booking.startAt)) {
    throw new Error(
      "Online cancellation is only available when pick-up is at least 48 hours away.",
    );
  }

  const wasPaid = booking.paymentStatus === "Paid";
  return mapBooking(
    await updateRecord(airtableConfig.bookingsTable, bookingId, {
      [FIELDS.booking.paymentStatus]: "Cancelled",
      [FIELDS.booking.cancelRequestedAt]: new Date().toISOString(),
      [FIELDS.booking.refundStatus]: wasPaid ? "Pending" : "Not required",
    }),
  );
}
