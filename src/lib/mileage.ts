/** Mileage packages — unlimited is priced per hire day. */

import { hirePolicy } from "@/lib/company";
import { formatMoney } from "@/lib/pricing";

export type MileageId = "included_200" | "unlimited";

export interface MileageOption {
  id: MileageId;
  name: string;
  description: string;
  /** Extra pence per day (0 when included in van rate). */
  priceMinorPerDay: number;
}

export const MILEAGE_OPTIONS: MileageOption[] = [
  {
    id: "included_200",
    name: "200 Mile Package",
    description: `${hirePolicy.includedMilesPerDay} miles included per hire day.`,
    priceMinorPerDay: 0,
  },
  {
    id: "unlimited",
    name: "Unlimited Mileage",
    description: "Drive without a daily mileage cap.",
    priceMinorPerDay: hirePolicy.unlimitedMilesPerDayMinor,
  },
];

export function getMileageOption(id: string): MileageOption | undefined {
  return MILEAGE_OPTIONS.find((m) => m.id === id);
}

export function mileageTotalMinor(id: MileageId | string, days: number): number {
  const option = getMileageOption(id);
  if (!option) return 0;
  return option.priceMinorPerDay * days;
}

/** e.g. "35p per mile" — shown on extras and mileage screens. */
export function excessMileageLabel(currency = "gbp"): string {
  return `${formatMoney(hirePolicy.excessMileagePencePerMile, currency)} per mile`;
}
