/** Driver profile captured at checkout — stored on Airtable Bookings. */

import type { BookingDraft } from "@/lib/booking-draft";

export type DriverDetails = BookingDraft["driver"];

export function driverFullName(driver: DriverDetails): string {
  return `${driver.firstName} ${driver.lastName}`.trim();
}

/** Map driver form → Airtable Bookings column values (major units N/A). */
export function driverFieldsForAirtable(
  driver: DriverDetails,
  fieldNames: {
    phone: string;
    dateOfBirth: string;
    country: string;
    occupation: string;
    licenceCountry: string;
    licenceValidFrom: string;
    licenceCategories: string;
    convictions5Years: string;
    accidents5Years: string;
    refusedInsurance: string;
    medicalConditions: string;
    declarationsConfirmed: string;
    driverSnapshot: string;
  },
): Record<string, unknown> {
  const declarationsOk =
    driver.declaredConvictions &&
    driver.declaredAccidents &&
    driver.declaredMedical &&
    driver.entitledToDriveUk &&
    driver.notUnderInfluence;

  return {
    [fieldNames.phone]: driver.phone,
    [fieldNames.dateOfBirth]: driver.dateOfBirth || undefined,
    [fieldNames.country]: driver.country,
    [fieldNames.occupation]: driver.occupation,
    [fieldNames.licenceCountry]: driver.licenceCountry,
    [fieldNames.licenceValidFrom]: driver.licenceValidFrom || undefined,
    [fieldNames.licenceCategories]: driver.licenceCategories,
    [fieldNames.convictions5Years]: formatYesNo(driver.convictions5Years),
    [fieldNames.accidents5Years]: formatYesNo(driver.accidents5Years),
    [fieldNames.refusedInsurance]: formatYesNo(driver.refusedInsurance),
    [fieldNames.medicalConditions]: formatYesNo(driver.medicalConditions),
    [fieldNames.declarationsConfirmed]: declarationsOk,
    [fieldNames.driverSnapshot]: formatDriverSnapshot(driver),
  };
}

function formatYesNo(value: string): string | undefined {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return undefined;
}

/** Human-readable snapshot for Hire Agreements and ops review. */
export function formatDriverSnapshot(driver: DriverDetails): string {
  const lines = [
    `${driver.title} ${driverFullName(driver)}`,
    `Email: ${driver.email}`,
    `Phone: ${driver.phone}`,
    `DOB: ${driver.dateOfBirth || "—"}`,
    `Country of residence: ${driver.country}`,
    `Occupation: ${driver.occupation}`,
    `Licence: ${driver.licenceCategories} (${driver.licenceCountry}), valid from ${driver.licenceValidFrom || "—"}`,
    `Convictions (5y): ${formatYesNo(driver.convictions5Years) ?? "—"}`,
    `Accidents (5y): ${formatYesNo(driver.accidents5Years) ?? "—"}`,
    `Refused insurance: ${formatYesNo(driver.refusedInsurance) ?? "—"}`,
    `Medical conditions: ${formatYesNo(driver.medicalConditions) ?? "—"}`,
    `Declarations: convictions ${driver.declaredConvictions ? "✓" : "✗"}, accidents ${driver.declaredAccidents ? "✓" : "✗"}, medical ${driver.declaredMedical ? "✓" : "✗"}, UK entitlement ${driver.entitledToDriveUk ? "✓" : "✗"}, fit to drive ${driver.notUnderInfluence ? "✓" : "✗"}`,
  ];
  return lines.join("\n");
}
