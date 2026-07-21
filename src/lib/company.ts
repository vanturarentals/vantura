/**
 * Company identity, support contacts, and commercial policy figures.
 * Figures marked (estimate) should be reviewed before launch.
 */

export const companyConfig = {
  legalName: "Vantura Rentals Ltd",
  tradingName: "Vantura Rentals",
  /** Placeholder — replace when Companies House registration is confirmed. */
  companyNumber: "[Company number]",
  /** Placeholder — replace with registered office address. */
  registeredOffice: "[Registered office address]",
  /** Placeholder — replace with trading / collection address. */
  tradingAddress: "[Trading address]",
  /** Placeholder — replace when VAT registration is confirmed. */
  vatNumber: "[VAT number]",
  vatRegistered: true,
  pricesIncludeVat: true,
  /** Placeholder — e.g. "West London" or full address. */
  collectionArea: "[Collection area — West London]",
  jurisdiction: "England and Wales",
} as const;

export const supportEmails = {
  bookings:
    process.env.NEXT_PUBLIC_BOOKINGS_EMAIL?.trim() ||
    "bookings@vanturarentals.com",
  support:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    "support@vanturarentals.com",
  claims:
    process.env.NEXT_PUBLIC_CLAIMS_EMAIL?.trim() ||
    "claims@vanturarentals.com",
} as const;

export const supportHours = {
  normal: "Monday to Friday, 9:00 am – 5:00 pm",
  emergency: "24/7 for active rentals (breakdown, accident, or urgent roadside issue)",
} as const;

/** Commercial figures — estimates aligned with site packages; review before launch. */
export const hirePolicy = {
  depositMinor: 5000,
  minDriverAge: 21,
  maxDriverAge: 75,
  minLicenceYears: 1,
  includedMilesPerDay: 200,
  /** Estimate — pence per mile over allowance. */
  excessMileagePencePerMile: 35,
  unlimitedMilesPerDayMinor: 900,
  lateReturnGraceMinutes: 30,
  /** Estimate — pence per hour after grace period. */
  lateReturnPencePerHour: 2500,
  /** Estimate — flat admin fee if we refuel. */
  refuelAdminFeeMinor: 1500,
  smokingChargeMinor: 15000,
  petCleaningChargeMinor: 7500,
  lostKeyChargeMinor: 25000,
  misfuelChargeMinor: 50000,
  protection: {
    basic: { dailyMinor: 1000, excessMinor: 150_000 },
    smart: { dailyMinor: 2000, excessMinor: 75_000 },
    allInclusive: { dailyMinor: 3000, excessMinor: 0 },
  },
  cancellation: {
    moreThan48h: "Full refund of any online deposit paid.",
    between24And48h:
      "50% of the online deposit retained; remainder refunded within 14 working days.",
    lessThan24h: "Online deposit retained; no refund.",
    noShow: "Full online deposit retained; hire charge may still apply.",
  },
  depositRefundDays: "14 working days after the vehicle is returned and inspected",
} as const;

export const firstBookingPromo = {
  discountPercent: 20,
  /** Automatically applied to base rental when paying balance in person. */
  autoApplied: true,
  codeRequired: false,
  /** Applies to base van rental only — not deposit, extras, mileage, protection, or fees. */
  appliesTo: "base van rental only",
  endDate: "2026-09-01",
  endDateLabel: "1 September 2026",
} as const;

export function legalEntityLine(): string {
  const c = companyConfig;
  return `${c.tradingName} is a trading name of ${c.legalName}, registered in ${c.jurisdiction} under company number ${c.companyNumber}. Registered office: ${c.registeredOffice}.`;
}

export function vatLine(): string {
  if (!companyConfig.vatRegistered) return "";
  return `VAT registered${companyConfig.vatNumber !== "[VAT number]" ? ` (VAT no. ${companyConfig.vatNumber})` : ""}. All prices include VAT where applicable.`;
}
