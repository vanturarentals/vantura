/** Static extras catalogue (UI). Synced to Airtable Extras via booking-extras. */

import { formatMoney } from "@/lib/pricing";

export type ExtraChargeType = "per_day" | "flat";

export type ExtraCategory = "equipment" | "service";

export interface ExtraItem {
  id: string;
  name: string;
  description: string;
  /** Pence per day (or flat when chargeType is flat). */
  priceMinor: number;
  chargeType: ExtraChargeType;
  category: ExtraCategory;
  /** Max quantity per booking (default unlimited). */
  maxQuantity?: number;
}

export const EXTRAS: ExtraItem[] = [
  {
    id: "additional_driver",
    name: "Additional Driver",
    description:
      "Add another named driver who meets our eligibility requirements.",
    priceMinor: 1200,
    chargeType: "per_day",
    category: "service",
    maxQuantity: 1,
  },
  {
    id: "phone_charger",
    name: "Phone Charger",
    description: "In-van USB phone charger for your hire.",
    priceMinor: 1000,
    chargeType: "flat",
    category: "equipment",
    maxQuantity: 1,
  },
  {
    id: "pump_truck",
    name: "Pump Truck",
    description: "Manual pump truck for loading and unloading pallets.",
    priceMinor: 2000,
    chargeType: "flat",
    category: "equipment",
    maxQuantity: 1,
  },
  {
    id: "ratchet_straps",
    name: "Ratchet Straps",
    description: "Heavy-duty ratchet straps to secure your load.",
    priceMinor: 800,
    chargeType: "flat",
    category: "equipment",
    maxQuantity: 1,
  },
  {
    id: "moving_blankets",
    name: "Moving Blankets",
    description: "Protect furniture and fragile items in transit.",
    priceMinor: 1200,
    chargeType: "flat",
    category: "equipment",
    maxQuantity: 1,
  },
  {
    id: "sack_trolley",
    name: "Sack Trolley",
    description: "Sturdy sack truck for boxes and appliances.",
    priceMinor: 1500,
    chargeType: "flat",
    category: "equipment",
    maxQuantity: 1,
  },
  {
    id: "sat_nav",
    name: "Sat Nav",
    description: "Dedicated sat nav unit for the hire period.",
    priceMinor: 500,
    chargeType: "per_day",
    category: "equipment",
    maxQuantity: 1,
  },
];

/** Legacy slugs from earlier bookings / Airtable rows. */
const SLUG_ALIASES: Record<string, string> = {
  second_driver: "additional_driver",
  pallet_truck: "pump_truck",
};

export function normalizeExtraId(id: string): string {
  return SLUG_ALIASES[id] ?? id;
}

export function getExtra(id: string): ExtraItem | undefined {
  const normalized = normalizeExtraId(id);
  return EXTRAS.find((e) => e.id === normalized);
}

export function extrasTotalMinor(
  quantities: { id: string; quantity: number }[],
  days: number,
): number {
  return quantities.reduce((sum, q) => {
    const item = getExtra(q.id);
    if (!item || q.quantity <= 0) return sum;
    const unit =
      item.chargeType === "per_day" ? item.priceMinor * days : item.priceMinor;
    return sum + unit * q.quantity;
  }, 0);
}

export function formatExtraPrice(
  item: ExtraItem,
  days: number,
  currency: string,
): { unitLabel: string; totalLabel: string | null } {
  const unitLabel =
    item.chargeType === "per_day"
      ? `${formatMoney(item.priceMinor, currency)} / day`
      : `${formatMoney(item.priceMinor, currency)} per hire`;
  const totalLabel =
    item.chargeType === "per_day" && days > 1
      ? `${formatMoney(item.priceMinor * days, currency)} for ${days} days`
      : null;
  return { unitLabel, totalLabel };
}

/** Normalise stored extras (migrates legacy slugs in sessionStorage drafts). */
export function normalizeExtras(
  extras: { id: string; quantity: number }[],
): { id: string; quantity: number }[] {
  const merged = new Map<string, number>();
  for (const line of extras) {
    if (line.quantity <= 0) continue;
    const id = normalizeExtraId(line.id);
    merged.set(id, (merged.get(id) ?? 0) + line.quantity);
  }
  return [...merged.entries()].map(([id, quantity]) => {
    const item = getExtra(id);
    const max = item?.maxQuantity ?? 99;
    return { id, quantity: Math.min(quantity, max) };
  });
}
