/** Heuristic van meta for filters / cards when Airtable lacks those columns. */

export type VanSize = "Small" | "Medium" | "Large" | "XL & Luton";

export function inferVanSize(name: string): VanSize {
  const n = name.toLowerCase();
  if (n.includes("transit connect") || n.includes("connect")) {
    return "Small";
  }
  if (n.includes("luton") || n.includes("sprinter") || n.includes("e-350") || n.includes("express")) {
    return "XL & Luton";
  }
  if (
    n.includes("transit custom") ||
    n.includes("transporter") ||
    n.includes("ducato") ||
    n.includes("boxer") ||
    n.includes("jumper") ||
    n.includes("trafic") ||
    n.includes("vivaro") ||
    n.includes("h350") ||
    n.includes("promaster") ||
    n.includes("transit")
  ) {
    return "Large";
  }
  if (n.includes("vito") || n.includes("metris") || n.includes("sienna") || n.includes("caravan")) {
    return "Medium";
  }
  return "Small";
}

export function inferSeats(name: string): number {
  const size = inferVanSize(name);
  if (size === "Small") return 2;
  if (size === "Medium") return 3;
  return 3;
}

export function inferCategoryLabel(name: string): string {
  return `${inferVanSize(name)} van`;
}
