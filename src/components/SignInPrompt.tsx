"use client";

import { useState } from "react";
import AuthModal from "@/components/AuthModal";

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
      <div className="rounded-md border border-brand/20 bg-brand-muted/60 p-4">
        <p className="text-sm font-semibold text-brand">
          Sign in to manage this booking later
        </p>
        <p className="mt-1 text-sm text-muted">
          Create a free account to view history and manage trips in one place.
          Or continue as a guest — you can still book now.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Log in | Register
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-sm font-medium text-muted hover:text-brand"
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
