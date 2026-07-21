/** Public support contacts for guest cancel messaging, etc. */
import { supportEmails } from "./company";

export const supportConfig = {
  email: supportEmails.support,
  bookingsEmail: supportEmails.bookings,
  claimsEmail: supportEmails.claims,
  /** Digits for tel: / WhatsApp links; display can differ. */
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "07949943055",
  phoneDisplay:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() ||
    "07949 943055",
  whatsapp:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "447949943055",
};

/** True when pick-up is at least `hours` away from now. */
export function canSelfCancelOnline(
  startAtIso: string,
  hours = 48,
  now = new Date(),
): boolean {
  const start = new Date(startAtIso);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() - now.getTime() >= hours * 60 * 60 * 1000;
}

export function hoursUntilStart(startAtIso: string, now = new Date()): number {
  const start = new Date(startAtIso);
  if (Number.isNaN(start.getTime())) return 0;
  return (start.getTime() - now.getTime()) / (60 * 60 * 1000);
}
