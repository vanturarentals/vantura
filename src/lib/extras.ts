/** Static extras catalogue (UI). Airtable Extras table can replace this later. */

export interface ExtraItem {
  id: string;
  name: string;
  description: string;
  /** Pence per day (or flat when chargeType is flat). */
  priceMinor: number;
  chargeType: "per_day" | "flat";
}

export const EXTRAS: ExtraItem[] = [
  {
    id: "phone_charger",
    name: "Phone charger",
    description: "In-van USB phone charger for your hire.",
    priceMinor: 1000,
    chargeType: "flat",
  },
  {
    id: "second_driver",
    name: "Second driver",
    description: "Add another insured driver to the hire.",
    priceMinor: 1200,
    chargeType: "per_day",
  },
  {
    id: "pallet_truck",
    name: "Pallet truck",
    description: "Manual pallet truck for loading and unloading.",
    priceMinor: 2000,
    chargeType: "flat",
  },
];

export function getExtra(id: string): ExtraItem | undefined {
  return EXTRAS.find((e) => e.id === id);
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
