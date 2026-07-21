"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COOKIE_CONSENT_EVENT,
  readConsent,
  saveConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
    const onChange = () => setVisible(readConsent() === null);
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  function choose(choice: CookieConsent) {
    saveConsent(choice);
    setVisible(false);
    setManageOpen(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-white p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] sm:p-5"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl text-sm text-muted">
          <p className="font-semibold text-foreground">Cookies on this site</p>
          <p className="mt-1 leading-relaxed">
            We use essential cookies to run bookings and sign-in. With your
            permission we may also use analytics cookies to understand how the
            site is used. See our{" "}
            <Link href="/cookies" className="font-medium text-brand underline">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-brand underline">
              Privacy Policy
            </Link>
            .
          </p>
          {manageOpen && (
            <div className="mt-3 rounded-lg border border-border bg-surface p-3 text-xs">
              <p className="font-semibold text-foreground">Essential cookies</p>
              <p className="mt-1">
                Required for checkout, session management, and security. Always
                on.
              </p>
              <p className="mt-3 font-semibold text-foreground">
                Analytics cookies
              </p>
              <p className="mt-1">
                Optional — help us improve the website. Only loaded if you
                accept all cookies.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="btn-ghost border border-border px-4 py-2 text-sm"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => setManageOpen((v) => !v)}
            className="btn-ghost border border-border px-4 py-2 text-sm"
          >
            Manage
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="btn-primary px-4 py-2 text-sm"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
