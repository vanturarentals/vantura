/** Client-side cookie consent preferences. */

export type CookieConsent = "all" | "essential";

export const COOKIE_CONSENT_KEY = "vantura_cookie_consent";
export const COOKIE_CONSENT_EVENT = "vantura:cookie-consent";

export function parseConsent(value: string | null): CookieConsent | null {
  if (value === "all" || value === "essential") return value;
  return null;
}

export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  return parseConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
}

export function saveConsent(choice: CookieConsent): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === "all";
}
