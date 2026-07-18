import { randomInt } from "crypto";

/**
 * Human-facing booking codes.
 *
 * Alphabet omits ambiguous characters (0/O, 1/I/L) so references are easy to
 * read over the phone. 9 chars → 32^9 ≈ 35 trillion combinations.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateBookingReference(length = 9): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** Format for display: ABC-DEF-GHI */
export function formatBookingReference(code: string): string {
  const clean = code.replace(/[^0-9A-Z]/gi, "").toUpperCase();
  if (clean.length !== 9) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
}
