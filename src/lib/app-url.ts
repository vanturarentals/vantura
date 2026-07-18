/** Browser-safe app origin for OAuth redirect URLs. */
export function getAppUrlClient(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "http://localhost:3000";
}
