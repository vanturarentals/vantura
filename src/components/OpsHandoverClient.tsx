"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  authenticated: boolean;
  pinConfigured: boolean;
}

export default function OpsHandoverClient({
  authenticated,
  pinConfigured,
}: Props) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [reference, setReference] = useState("");
  const [authed, setAuthed] = useState(authenticated);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Incorrect PIN.");
        return;
      }
      setAuthed(true);
      setPin("");
    } catch {
      setError("Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/ops/lookup?reference=${encodeURIComponent(reference)}`,
      );
      const data = (await res.json()) as {
        error?: string;
        booking?: { id: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Lookup failed.");
        return;
      }
      if (!data.booking?.id) {
        setError("Booking not found.");
        return;
      }
      router.push(`/ops/handover/${data.booking.id}`);
    } catch {
      setError("Could not look up booking.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/ops/auth", { method: "DELETE" });
    setAuthed(false);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-5 py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Staff only
        </p>
        <h1 className="mt-1 text-3xl font-bold text-brand">
          Vantura Rentals paperwork
        </h1>
        <p className="mt-2 text-sm text-muted">
          Collection handover form — look up a booking, complete the essentials,
          customer signs, then both of you get an email copy.
        </p>
      </div>

      {!pinConfigured ? (
        <div className="panel p-5 text-sm text-muted">
          Set <code className="text-foreground">OPS_STAFF_PIN</code> in your
          environment (Vercel / <code className="text-foreground">.env.local</code>
          ), then redeploy.
        </div>
      ) : !authed ? (
        <form onSubmit={onPin} className="panel-aside space-y-4 p-6 shadow-md">
          <label className="block space-y-1.5">
            <span className="field-label">Staff PIN</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="field"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
      ) : (
        <>
          <form
            onSubmit={onLookup}
            className="panel-aside space-y-4 p-6 shadow-md"
          >
            <label className="block space-y-1.5">
              <span className="field-label">Booking reference</span>
              <input
                className="field font-mono uppercase"
                placeholder="e.g. ABC-DEF-GHI"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Looking up…" : "Open paperwork"}
            </button>
          </form>
          <div className="flex justify-between text-sm">
            <Link href="/" className="text-muted hover:text-brand">
              ← Site home
            </Link>
            <button type="button" onClick={logout} className="btn-ghost px-0">
              Lock
            </button>
          </div>
        </>
      )}
    </div>
  );
}
