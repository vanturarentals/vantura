"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppUrlClient } from "@/lib/app-url";
import { isEmailVerified } from "@/lib/user-profile";

type Step = "email" | "password" | "verify";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Where to send the user after a successful OAuth / verified sign-in. */
  nextPath?: string;
  /** @deprecated Unused — login and signup share one flow. */
  initialMode?: "login" | "signup";
}

export default function AuthModal({
  open,
  onClose,
  nextPath = "/manage",
}: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("email");
      setPassword("");
      setPasswordConfirm("");
      setMessage(null);
      setError(null);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const configured = isSupabaseConfigured();
  const redirectTo = `${getAppUrlClient()}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  function finishSignedIn() {
    onClose();
    const target = nextPath.startsWith("/") ? nextPath : "/manage";
    window.location.assign(target);
  }

  function onEmailContinue(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!configured) {
      setError("Accounts are not configured yet. You can still book as a guest.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setStep("password");
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!configured) {
      setError("Accounts are not configured yet. You can still book as a guest.");
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
      const trimmed = email.trim();

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });

      if (!signInError && signInData.user) {
        if (!isEmailVerified(signInData.user)) {
          setStep("verify");
          setMessage(
            "Please verify your email before using your account. Check your inbox for the link.",
          );
          return;
        }
        finishSignedIn();
        return;
      }

      const invalidLogin =
        signInError?.message?.toLowerCase().includes("invalid login") ||
        signInError?.message?.toLowerCase().includes("invalid credentials");

      if (!invalidLogin && signInError) {
        if (
          signInError.message.toLowerCase().includes("email not confirmed") ||
          signInError.message.toLowerCase().includes("not confirmed")
        ) {
          setStep("verify");
          setMessage(
            "Please verify your email before signing in. Check your inbox for the link.",
          );
          return;
        }
        throw signInError;
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: trimmed,
          password,
          options: { emailRedirectTo: redirectTo },
        });

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes("already") ||
          signUpError.message.toLowerCase().includes("registered")
        ) {
          setError("Incorrect password for this email. Try again.");
          return;
        }
        throw signUpError;
      }

      if (signUpData.session && signUpData.user && isEmailVerified(signUpData.user)) {
        finishSignedIn();
        return;
      }

      setStep("verify");
      setMessage(
        "Account created. Check your email and verify before you can manage bookings.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setError(null);
    setMessage(null);
    if (!configured || !email.trim()) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
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

  async function continueWithProvider(provider: "google" | "apple") {
    setError(null);
    setMessage(null);
    if (!configured) {
      setError("Accounts are not configured yet. You can still book as a guest.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not start ${provider} sign-in.`,
      );
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="panel relative z-10 w-full max-w-md p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xl leading-none text-muted hover:text-foreground"
          aria-label="Close dialog"
        >
          ×
        </button>

        <p className="inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Vantura Rentals"
            className="h-9 w-auto"
            width={180}
            height={79}
          />
        </p>
        <h2
          id="auth-modal-title"
          className="mt-4 pr-8 text-2xl font-extrabold tracking-tight text-brand"
        >
          {step === "verify" ? "Verify your email" : "Log in"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {step === "verify"
            ? "Verify your email to unlock manage bookings and saved details."
            : step === "password"
              ? "Enter your password to sign in or create your account."
              : "Access seamless checkouts and easy trip management."}
        </p>

        {step === "email" && (
          <form onSubmit={onEmailContinue} className="mt-6 space-y-3">
            <label className="block space-y-1.5">
              <span className="field-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mail.com"
                autoComplete="email"
                className="field"
              />
            </label>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              Continue with email
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={onPasswordSubmit} className="mt-6 space-y-3">
            <p className="text-sm text-foreground">
              <span className="text-muted">Signing in as </span>
              <span className="font-semibold">{email.trim()}</span>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setPasswordConfirm("");
                  setError(null);
                }}
                className="ml-2 text-sm font-semibold text-brand hover:underline"
              >
                Change
              </button>
            </p>
            <label className="block space-y-1.5">
              <span className="field-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="field"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="field-label">Confirm password</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="field"
              />
            </label>
            <p className="text-xs text-muted">
              New here? We&apos;ll create your account. You&apos;ll need to
              verify your email before managing bookings.
            </p>
            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? "Please wait…" : "Log in"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg bg-brand-muted/60 p-4 text-sm text-foreground">
              We sent a verification link to{" "}
              <span className="font-semibold">{email.trim()}</span>. Open it to
              activate your account, then come back and sign in.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={resendVerification}
              className="btn-secondary w-full py-3"
            >
              {busy ? "Sending…" : "Resend verification email"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setPassword("");
                setPasswordConfirm("");
                setError(null);
                setMessage(null);
              }}
              className="btn-ghost w-full"
            >
              Use a different email
            </button>
          </div>
        )}

        {step !== "verify" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
              <span className="h-px flex-1 bg-border" />
              or continue with
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => continueWithProvider("google")}
                className="btn-secondary gap-2 py-2.5 disabled:opacity-60"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => continueWithProvider("apple")}
                className="btn-secondary gap-2 py-2.5 disabled:opacity-60"
              >
                <AppleIcon />
                Apple
              </button>
            </div>
          </>
        )}

        {message && <p className="mt-4 text-sm text-brand">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <p className="mt-6 text-center text-xs text-muted">
          By continuing you agree to our terms. You can always close this and
          book as a guest.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.02-.8.88-2.13 1.56-3.27 1.47-.14-1.1.42-2.26 1.17-3.06.8-.88 2.2-1.52 3.28-1.43zM20.9 17.3c-.55 1.26-.82 1.82-1.53 2.94-.99 1.55-2.39 3.48-4.13 3.5-1.54.02-1.94-.99-4.04-.98-2.1.02-2.54 1-4.08.98-1.74-.02-3.08-1.76-4.07-3.31C1.4 17.3.2 12.9 1.96 9.9c1.12-1.9 2.9-3.01 4.57-3.01 1.7 0 2.77 1 4.18 1 1.36 0 2.19-1.01 4.17-1.01 1.48 0 3.05.8 4.16 2.19-3.65 2-3.05 7.2 1.86 8.23z" />
    </svg>
  );
}
