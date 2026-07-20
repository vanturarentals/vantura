/** Protection packages — priced per hire day. */

export type ProtectionId = "basic" | "smart" | "all_inclusive";

export interface ProtectionFeature {
  label: string;
  included: boolean;
}

export interface ProtectionPackage {
  id: ProtectionId;
  name: string;
  /** Pence per day. */
  priceMinor: number;
  /** Null means no excess. */
  excessMinor: number | null;
  stars: number;
  features: ProtectionFeature[];
}

export const PROTECTIONS: ProtectionPackage[] = [
  {
    id: "basic",
    name: "Basic",
    priceMinor: 1000,
    excessMinor: 150_000,
    stars: 1,
    features: [
      { label: "Collision damage waiver", included: true },
      { label: "Theft protection", included: true },
      { label: "Windscreen & tyre protection", included: false },
      { label: "Interior protection", included: false },
      { label: "Personal accident cover", included: false },
    ],
  },
  {
    id: "smart",
    name: "Smart",
    priceMinor: 2000,
    excessMinor: 75_000,
    stars: 2,
    features: [
      { label: "Collision damage waiver", included: true },
      { label: "Theft protection", included: true },
      { label: "Windscreen & tyre protection", included: true },
      { label: "Interior protection", included: false },
      { label: "Personal accident cover", included: false },
    ],
  },
  {
    id: "all_inclusive",
    name: "All-inclusive",
    priceMinor: 3000,
    excessMinor: null,
    stars: 3,
    features: [
      { label: "Collision damage waiver", included: true },
      { label: "Theft protection", included: true },
      { label: "Windscreen & tyre protection", included: true },
      { label: "Interior protection", included: true },
      { label: "Personal accident cover", included: true },
    ],
  },
];

export function getProtection(id: string): ProtectionPackage | undefined {
  const normalized = normalizeProtectionId(id);
  return PROTECTIONS.find((p) => p.id === normalized);
}

export function normalizeProtectionId(id: string): ProtectionId {
  if (id === "medium") return "smart";
  if (id === "high") return "all_inclusive";
  if (id === "basic" || id === "smart" || id === "all_inclusive") return id;
  return "basic";
}

export function protectionTotalMinor(id: ProtectionId | string, days: number): number {
  const pkg = getProtection(id);
  if (!pkg) return 0;
  return pkg.priceMinor * days;
}
