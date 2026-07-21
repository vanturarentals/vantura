/**
 * Hire Agreements — ops paperwork in Airtable (collection, return, damage).
 * A record is created when a booking is paid; staff complete it at handover.
 */
import {
  FIELDS,
  createRecord,
  escapeFormulaValue,
  listRecords,
} from "./airtable";
import { airtableConfig } from "./config";
import { getBookingById } from "./bookings";

export type HireAgreementStatus =
  | "Pre-hire"
  | "At collection"
  | "On hire"
  | "Returned"
  | "Closed";

export async function getHireAgreementByBookingId(
  bookingId: string,
): Promise<{ id: string; status: HireAgreementStatus } | null> {
  const formula = `{${FIELDS.hireAgreement.booking}}="${escapeFormulaValue(bookingId)}"`;
  const records = await listRecords(airtableConfig.hireAgreementsTable, {
    filterByFormula: formula,
    maxRecords: "1",
  });
  if (!records.length) return null;
  const f = records[0].fields;
  const status = String(f[FIELDS.hireAgreement.status] ?? "Pre-hire");
  return {
    id: records[0].id,
    status: status as HireAgreementStatus,
  };
}

/**
 * Create a Hire Agreement linked to a paid booking (idempotent).
 * Returns the agreement record id, or null if the table/fields are missing.
 */
export async function ensureHireAgreementForBooking(
  bookingId: string,
): Promise<string | null> {
  const existing = await getHireAgreementByBookingId(bookingId);
  if (existing) return existing.id;

  const booking = await getBookingById(bookingId);
  if (!booking) return null;

  const snapshot =
    typeof booking.driverSnapshot === "string" && booking.driverSnapshot.trim()
      ? booking.driverSnapshot
      : [
          booking.customerName,
          booking.email,
          booking.customerPhone ? `Phone: ${booking.customerPhone}` : null,
        ]
          .filter(Boolean)
          .join("\n");

  try {
    const record = await createRecord(airtableConfig.hireAgreementsTable, {
      [FIELDS.hireAgreement.booking]: [bookingId],
      [FIELDS.hireAgreement.status]: "Pre-hire",
      [FIELDS.hireAgreement.driverSnapshot]: snapshot,
      [FIELDS.hireAgreement.notes]: `Auto-created from online booking ${booking.reference ?? booking.id}.`,
    });
    return record.id;
  } catch (error) {
    console.warn(
      "[hire-agreements] Could not create agreement:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
