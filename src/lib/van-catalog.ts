/**
 * Van specifications catalogue — matched by van name from Airtable.
 * Figures are typical for the class; actual vehicle may vary ("or similar").
 */

import { hirePolicy } from "@/lib/company";
import { formatMoney } from "@/lib/pricing";

export interface VanSpecs {
  size: string;
  seats: number;
  transmission: "Manual" | "Automatic";
  fuel: "Diesel" | "Petrol" | "Electric";
  loadLengthM: number;
  loadWidthM: number;
  loadHeightM: number;
  payloadKg: number;
  /** Short label for cards, e.g. "Small van". */
  category: string;
  /** What this van is suited for. */
  suitableFor: string;
  /** Typical daily rate pence — fallback when Airtable rate missing. */
  typicalDailyMinor: number;
}

const DEFAULT: VanSpecs = {
  size: "Medium",
  seats: 3,
  transmission: "Manual",
  fuel: "Diesel",
  loadLengthM: 2.5,
  loadWidthM: 1.6,
  loadHeightM: 1.4,
  payloadKg: 1000,
  category: "Medium van",
  suitableFor: "General loads, furniture, and trade use",
  typicalDailyMinor: 7500,
};

const BY_NAME: { match: RegExp; specs: Partial<VanSpecs> & Pick<VanSpecs, "category" | "suitableFor"> }[] = [
  {
    match: /connect/i,
    specs: {
      size: "Small",
      seats: 2,
      transmission: "Manual",
      fuel: "Diesel",
      loadLengthM: 1.8,
      loadWidthM: 1.2,
      loadHeightM: 1.2,
      payloadKg: 600,
      category: "Small van",
      suitableFor: "Boxes, small deliveries, and compact loads",
      typicalDailyMinor: 5500,
    },
  },
  {
    match: /sprinter|luton|e-350|express|boxer|jumper|ducato/i,
    specs: {
      size: "XL & Luton",
      seats: 3,
      transmission: "Manual",
      fuel: "Diesel",
      loadLengthM: 4.0,
      loadWidthM: 1.8,
      loadHeightM: 1.9,
      payloadKg: 1200,
      category: "Large / Luton van",
      suitableFor: "Full house moves and heavy loads (tail lift where fitted)",
      typicalDailyMinor: 11000,
    },
  },
  {
    match: /transit custom|transporter|trafic|vivaro|promaster|h350/i,
    specs: {
      size: "Large",
      seats: 3,
      transmission: "Manual",
      fuel: "Diesel",
      loadLengthM: 2.9,
      loadWidthM: 1.7,
      loadHeightM: 1.4,
      payloadKg: 1100,
      category: "Large van",
      suitableFor: "Furniture collections and one-bedroom moves",
      typicalDailyMinor: 7600,
    },
  },
  {
    match: /vito|metris|sienna|caravan/i,
    specs: {
      size: "Medium",
      seats: 3,
      transmission: "Manual",
      fuel: "Diesel",
      loadLengthM: 2.2,
      loadWidthM: 1.5,
      loadHeightM: 1.3,
      payloadKg: 900,
      category: "Medium van",
      suitableFor: "Mixed loads and small furniture runs",
      typicalDailyMinor: 7000,
    },
  },
];

export function getVanSpecs(vanName: string): VanSpecs {
  for (const entry of BY_NAME) {
    if (entry.match.test(vanName)) {
      return { ...DEFAULT, ...entry.specs };
    }
  }
  return { ...DEFAULT };
}

/** Lowest typical daily rate in the catalogue (pence). */
export function fleetFromPriceMinor(): number {
  return Math.min(...BY_NAME.map((e) => e.specs.typicalDailyMinor ?? DEFAULT.typicalDailyMinor));
}

export function formatLoadVolume(specs: VanSpecs): string {
  return `${specs.loadLengthM}m × ${specs.loadWidthM}m × ${specs.loadHeightM}m`;
}

export interface VanPricingSummary {
  dailyFrom: string;
  deposit: string;
  excessBasic: string;
  milesIncluded: number;
}

export function vanPricingSummary(currency = "gbp"): VanPricingSummary {
  const p = hirePolicy;
  return {
    dailyFrom: formatMoney(fleetFromPriceMinor(), currency),
    deposit: formatMoney(p.depositMinor, currency),
    excessBasic: formatMoney(p.protection.basic.excessMinor, currency),
    milesIncluded: p.includedMilesPerDay,
  };
}
