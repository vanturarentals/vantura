"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAppUrlClient } from "@/lib/app-url";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface Props {
  email: string;
}

/** Shown on /manage when signed in but email is not verified yet. */
export default function UnverifiedAccountPanel({ email }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setMessage(null);
    setError(null);
    if (!isSupabaseConfigured()) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const redirectTo = `${getAppUrlClient()}/auth/callback?next=${encodeURIComponent("/manage")}`;
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (resendError) throw resendError;
      setMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not resend verification email.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/manage";
  }

  return (
    <div className="rounded-md border border-border bg-white p-6 sm:p-8">
      <h1 className="text-3xl font-bold text-brand">Verify your email</h1>
      <p className="mt-3 text-muted">
        Managing bookings isn&apos;t available until your account is verified.
        We sent a link to{" "}
        <span className="font-semibold text-foreground">{email}</span>.
      </p>
      <p className="mt-2 text-sm text-muted">
        After you verify, refresh this page or sign in again to see your
        bookings.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={resend}
          className="cursor-pointer rounded bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Sending…" : "Resend verification email"}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="cursor-pointer rounded border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface"
        >
          Sign out
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-brand">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
