"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/user-profile";

interface Props {
  user: User | null;
  onSaved?: () => void;
}

/** Collect name + phone after login; Google users only need phone. */
export default function ProfileCompleteModal({ user, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [fromOAuth, setFromOAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.email || !user.email_confirmed_at) {
      setOpen(false);
      return;
    }
    const profile = getUserProfile(user);
    if (!profile.needsProfile) {
      setOpen(false);
      return;
    }
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setPhone(profile.phone);
    setFromOAuth(profile.fromOAuth);
    setOpen(true);
  }, [user]);

  if (!open || !user) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;
    const digits = phone.replace(/\D/g, "");
    if (!fromOAuth) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Enter your first and last name.");
        return;
      }
    }
    if (!/^\d{10,15}$/.test(digits)) {
      setError("Enter a valid phone number (digits only, 10–15 numbers).");
      return;
    }

    setBusy(true);
    try {
      const existing = getUserProfile(user);
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim() || existing.firstName,
          last_name: lastName.trim() || existing.lastName,
          phone: digits,
          profile_complete: true,
        },
      });
      if (updateError) throw updateError;
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your details.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="panel relative z-10 w-full max-w-md p-6 sm:p-8"
      >
        <h2
          id="profile-modal-title"
          className="text-2xl font-extrabold tracking-tight text-brand"
        >
          {fromOAuth ? "Add your phone number" : "Complete your profile"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {fromOAuth
            ? "We pulled your name from Google. Add a phone number for booking confirmations."
            : "Save your details once — we’ll use them when you book."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {!fromOAuth && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="field-label">First name</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  className="field"
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="field-label">Last name</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  className="field"
                  required
                />
              </label>
            </div>
          )}

          {fromOAuth && (firstName || lastName) && (
            <p className="text-sm text-foreground">
              <span className="text-muted">Name: </span>
              <span className="font-semibold">
                {[firstName, lastName].filter(Boolean).join(" ")}
              </span>
            </p>
          )}

          <label className="block space-y-1.5">
            <span className="field-label">Phone (digits only)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              autoComplete="tel-national"
              inputMode="numeric"
              className="field"
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full py-3">
            {busy ? "Saving…" : "Save details"}
          </button>
        </form>
      </div>
    </div>
  );
}
