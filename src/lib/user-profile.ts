import type { User } from "@supabase/supabase-js";

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  emailVerified: boolean;
  /** Signed in via Google/Apple (not email+password). */
  fromOAuth: boolean;
  /** Name came from OAuth / existing metadata. */
  hasName: boolean;
  /** Phone saved on the account. */
  hasPhone: boolean;
  /** Needs first/last (email users) and/or phone. */
  needsProfile: boolean;
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function isOAuthUser(user: User): boolean {
  const identities = user.identities ?? [];
  if (identities.length === 0) {
    const provider = user.app_metadata?.provider;
    return typeof provider === "string" && provider !== "email";
  }
  return identities.some((i) => i.provider !== "email");
}

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

/** Pull display/contact fields from Supabase user + OAuth metadata. */
export function getUserProfile(user: User): UserProfile {
  const meta = user.user_metadata ?? {};
  const fromOAuth = isOAuthUser(user);

  let firstName =
    (typeof meta.first_name === "string" && meta.first_name) ||
    (typeof meta.given_name === "string" && meta.given_name) ||
    "";
  let lastName =
    (typeof meta.last_name === "string" && meta.last_name) ||
    (typeof meta.family_name === "string" && meta.family_name) ||
    "";

  if (!firstName && !lastName) {
    const full =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      "";
    if (full) {
      const split = splitFullName(full);
      firstName = split.firstName;
      lastName = split.lastName;
    }
  }

  const phone =
    (typeof meta.phone === "string" && meta.phone.replace(/\D/g, "")) || "";

  const hasName = Boolean(firstName.trim() && lastName.trim());
  const hasPhone = phone.length >= 10;
  const needsProfile = fromOAuth ? !hasPhone : !hasName || !hasPhone;

  return {
    email: user.email ?? "",
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone,
    emailVerified: isEmailVerified(user),
    fromOAuth,
    hasName,
    hasPhone,
    needsProfile,
  };
}
