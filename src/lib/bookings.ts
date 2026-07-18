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
import type { Booking, PaymentStatus } from "./types";

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
  return {
    id: record.id,
    number: typeof numberValue === "number" ? numberValue : null,
    customerName: String(f[FIELDS.booking.customerName] ?? ""),
    email: String(f[FIELDS.booking.email] ?? ""),
    vanId: firstLinkedId(f[FIELDS.booking.van]),
    // Linked fields return record ids only; van name is resolved on demand.
    vanName: "",
    pickupLocation: String(f[FIELDS.booking.pickupLocation] ?? ""),
    dropoffLocation: String(f[FIELDS.booking.dropoffLocation] ?? ""),
    startAt: String(f[FIELDS.booking.startAt] ?? ""),
    endAt: String(f[FIELDS.booking.endAt] ?? ""),
    // Stored in major units in Airtable; expose as pence.
    totalAmountMinor: Math.round(amount * 100),
    currency: String(f[FIELDS.booking.currency] ?? ""),
    paymentStatus: (String(
      f[FIELDS.booking.paymentStatus] ?? "Pending",
    ) as PaymentStatus),
    stripeSessionId: (f[FIELDS.booking.stripeSessionId] as string) ?? null,
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
}

export async function createPendingBooking(
  input: NewPendingBooking,
): Promise<Booking> {
  const record = await createRecord(airtableConfig.bookingsTable, {
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
  });

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
