/** Public support contacts for guest cancel messaging, etc. */
export const supportConfig = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "hello@vanturarentals.com",
  /** E.164 or display number; leave empty until you publish a real line. */
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "",
  phoneDisplay:
    process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() ||
    "",
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
