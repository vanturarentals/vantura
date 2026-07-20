/** Server-side Supabase admin client (service role). */

export function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getServiceRoleKey(),
  );
}

/** Returns whether an auth user already exists for this email. */
export async function emailIsRegistered(email: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = getServiceRoleKey();
  if (!url || !key) {
    throw new Error("Supabase admin is not configured.");
  }

  const normalized = email.trim().toLowerCase();
  const res = await fetch(
    `${url}/auth/v1/admin/users?filter=${encodeURIComponent(normalized)}&page=1&per_page=10`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`Admin user lookup failed (${res.status}).`);
  }

  const body = (await res.json()) as { users?: { email?: string }[] };
  const users = body.users ?? [];
  return users.some((u) => u.email?.toLowerCase() === normalized);
}
