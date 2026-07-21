"use client";

import { useState } from "react";
import AuthModal from "@/components/AuthModal";
import { firstBookingPromo } from "@/lib/company";

interface Props {
  /** When true, the user is already signed in — hide the prompt. */
  signedIn: boolean;
}

/** Soft sign-in nudge before payment; never blocks guest checkout. */
export default function SignInPrompt({ signedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (signedIn || dismissed) return null;

  return (
    <>
      <div className="rounded-lg bg-brand-muted/60 p-4">
        <p className="text-sm font-semibold text-brand">
          Sign in to save {firstBookingPromo.discountPercent}% on your first van rental
        </p>
        <p className="mt-1 text-sm text-muted">
          Registered accounts get {firstBookingPromo.discountPercent}% off the
          base van rental on their first booking. Create a free account to see
          the discount in your summary — or continue as a guest.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-primary"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="btn-ghost"
          >
            Continue as guest
          </button>
        </div>
      </div>
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        nextPath={typeof window !== "undefined" ? window.location.pathname : "/"}
      />
    </>
  );
}
