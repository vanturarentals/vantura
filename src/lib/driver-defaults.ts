import type { BookingDraft } from "@/lib/booking-draft";

/** Default empty driver + declarations for new booking drafts. */
export function emptyDriver(): BookingDraft["driver"] {
  return {
    title: "Mr",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    country: "United Kingdom",
    occupation: "",
    licenceCountry: "United Kingdom",
    licenceValidFrom: "",
    licenceCategories: "B",
    convictions5Years: "",
    accidents5Years: "",
    refusedInsurance: "",
    medicalConditions: "",
    declaredConvictions: false,
    declaredAccidents: false,
    declaredMedical: false,
    entitledToDriveUk: false,
    notUnderInfluence: false,
  };
}

/** Merge saved draft driver with defaults (handles older sessionStorage drafts). */
export function normalizeDriver(
  raw: Partial<BookingDraft["driver"]> | undefined,
): BookingDraft["driver"] {
  return { ...emptyDriver(), ...raw };
}

export function yearsLicenceHeld(validFrom: string): number | null {
  if (!validFrom) return null;
  const from = new Date(validFrom);
  if (Number.isNaN(from.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - from.getFullYear();
  const monthDiff = now.getMonth() - from.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < from.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function yesNoRequired(value: string): boolean {
  return value === "yes" || value === "no";
}
