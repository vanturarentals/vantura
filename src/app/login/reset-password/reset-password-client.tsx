"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PasswordInput from "@/components/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setError("Accounts are not configured.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Reset link expired or invalid. Request a new one from the login screen.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setMessage("Password updated. Redirecting…");
      setTimeout(() => router.replace("/manage"), 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update password.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-3xl font-bold text-brand">Set new password</h1>
        <p className="mt-2 text-muted">Choose a new password for your account.</p>

        <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
          <PasswordInput
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
          />
          <PasswordInput
            label="Confirm new password"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            autoComplete="new-password"
            minLength={8}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-brand">{message}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-8 text-center text-sm font-semibold text-brand hover:underline"
        >
          ← Back to log in
        </Link>
      </main>
      <Footer />
    </div>
  );
}
