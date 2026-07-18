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
    id: "additional_driver",
    name: "Additional driver",
    description: "Add another insured driver to the hire.",
    priceMinor: 1200,
    chargeType: "per_day",
  },
  {
    id: "tail_lift",
    name: "Tail-lift",
    description: "Hydraulic lift for heavy loads.",
    priceMinor: 2500,
    chargeType: "per_day",
  },
  {
    id: "towing_hitch",
    name: "Towing hitch",
    description: "Tow bar fitted for trailers.",
    priceMinor: 1500,
    chargeType: "per_day",
  },
  {
    id: "ply_lining",
    name: "Ply lining",
    description: "Protective plywood lining for cargo.",
    priceMinor: 800,
    chargeType: "per_day",
  },
  {
    id: "moving_kit",
    name: "Moving equipment set",
    description: "Blankets, straps and a trolley.",
    priceMinor: 3500,
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
