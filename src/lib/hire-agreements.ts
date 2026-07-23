/**
 * Hire Agreements — ops paperwork in Airtable (collection, return, damage).
 * A record is created when a booking is paid; staff complete it at handover.
 */
import {
  FIELDS,
  createRecord,
  escapeFormulaValue,
  listRecords,
  updateRecord,
} from "./airtable";
import { airtableConfig } from "./config";
import { getBookingById } from "./bookings";
import type { PaperworkPayload } from "./paperwork";
import { fuelForAirtable } from "./paperwork";

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

/** Persist completed collection paperwork onto the Hire Agreement. */
export async function completeCollectionPaperwork(
  bookingId: string,
  data: PaperworkPayload,
): Promise<string | null> {
  const agreementId =
    (await ensureHireAgreementForBooking(bookingId)) ??
    (await getHireAgreementByBookingId(bookingId))?.id ??
    null;
  if (!agreementId) return null;

  const mileage = Number(data.van.mileage.replace(/[^\d.]/g, ""));
  const summary = [
    `Collection paperwork completed ${data.signedAtIso}`,
    `Staff: ${data.staffName}`,
    `Primary: ${data.primary.fullName} · ${data.primary.mobile}`,
    data.hasSecondDriver === "yes" && data.secondDriver
      ? `Second driver: ${data.secondDriver.fullName}`
      : "Second driver: no",
    `Van: ${data.van.makeModel} ${data.van.registration}`,
    `Mileage: ${data.van.mileage} · Fuel: ${data.van.fuelLevel}`,
    `Payment: ${data.rental.paymentMethod} · Total: ${data.rental.totalRentalCost}`,
    "",
    "PAPERWORK_JSON:",
    JSON.stringify(data),
  ].join("\n");

  const fields: Record<string, unknown> = {
    [FIELDS.hireAgreement.status]: "On hire",
    [FIELDS.hireAgreement.collectionSignedAt]: data.signedAtIso,
    [FIELDS.hireAgreement.collectionStaff]: data.staffName.slice(0, 100),
    [FIELDS.hireAgreement.collectionDamageNotes]:
      data.condition.existingDamage.trim() || "None noted",
    [FIELDS.hireAgreement.notes]: summary.slice(0, 90000),
    [FIELDS.hireAgreement.driverSnapshot]: [
      data.primary.fullName,
      data.primary.mobile,
      data.primary.licenceNumber,
      data.primary.homeAddress,
      data.primary.postcode,
    ]
      .filter(Boolean)
      .join("\n"),
  };

  if (Number.isFinite(mileage)) {
    fields[FIELDS.hireAgreement.collectionMileage] = mileage;
  }
  fields[FIELDS.hireAgreement.collectionFuel] = fuelForAirtable(
    data.van.fuelLevel,
  );

  try {
    await updateRecord(airtableConfig.hireAgreementsTable, agreementId, fields);
  } catch (error) {
    // Retry without fuel if the select option isn't recognised yet.
    delete fields[FIELDS.hireAgreement.collectionFuel];
    try {
      await updateRecord(
        airtableConfig.hireAgreementsTable,
        agreementId,
        fields,
      );
    } catch (retryError) {
      console.error("[hire-agreements] update failed:", retryError ?? error);
      throw retryError;
    }
  }
  return agreementId;
}
