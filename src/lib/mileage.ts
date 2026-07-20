/** Mileage packages — unlimited is priced per hire day. */

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
    name: "200 miles",
    description: "Standard mileage allowance for your hire.",
    priceMinorPerDay: 0,
  },
  {
    id: "unlimited",
    name: "Unlimited miles",
    description: "Drive as far as you need with no mileage cap.",
    priceMinorPerDay: 900,
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
