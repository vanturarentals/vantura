/** Staff PIN session for /ops paperwork pages. */
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { opsConfig } from "./config";

export const OPS_COOKIE = "vantura_ops";

function signingKey(): string {
  const pin = opsConfig.staffPin.trim();
  if (!pin) throw new Error("OPS_STAFF_PIN is not configured.");
  return pin;
}

export function createOpsSessionToken(now = Date.now()): string {
  const exp = now + opsConfig.sessionHours * 60 * 60 * 1000;
  const payload = `ops:${exp}`;
  const sig = createHmac("sha256", signingKey()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyOpsSessionToken(
  token: string | undefined | null,
  now = Date.now(),
): boolean {
  if (!token || !opsConfig.isConfigured) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [payload, sig] = raw.split(".");
    if (!payload || !sig || !payload.startsWith("ops:")) return false;
    const exp = Number(payload.slice(4));
    if (!Number.isFinite(exp) || exp < now) return false;
    const expected = createHmac("sha256", signingKey())
      .update(payload)
      .digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyStaffPin(pin: string): boolean {
  if (!opsConfig.isConfigured) return false;
  const expected = opsConfig.staffPin.trim();
  const got = pin.trim();
  if (!got || got.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isOpsAuthenticated(): Promise<boolean> {
  if (!opsConfig.isConfigured) return false;
  const jar = await cookies();
  return verifyOpsSessionToken(jar.get(OPS_COOKIE)?.value);
}

export async function requireOpsAuth(): Promise<boolean> {
  return isOpsAuthenticated();
}
