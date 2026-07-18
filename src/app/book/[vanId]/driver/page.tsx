"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import type { BookingDraft } from "@/lib/booking-draft";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUserProfile } from "@/lib/user-profile";

const TITLES = ["Mr", "Mrs", "Ms", "Mx", "Dr"];

function maxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 21);
  return d.toISOString().slice(0, 10);
}

/** Keep digits only so phone confirm compares cleanly. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export default function DriverPage() {
  const { vanId } = useParams<{ vanId: string }>();
  const draft = useBookingDraft(vanId);

  if (!draft) {
    return (
      <p className="text-muted">
        Missing booking details.{" "}
        <Link href="/" className="text-brand underline">
          Start again
        </Link>
      </p>
    );
  }

  // No remounting key — a previous `key={email}` remounted on every keystroke.
  return (
    <div>
      <BookingSteps vanId={vanId} />
      <DriverForm draft={draft} />
    </div>
  );
}

function DriverForm({ draft }: { draft: BookingDraft }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Local state avoids focus loss when sessionStorage draft updates.
  const [driver, setDriver] = useState(draft.driver);
  const [phoneConfirm, setPhoneConfirm] = useState(draft.driver.phone);
  const [emailLocked, setEmailLocked] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user?.email) return;
      const profile = getUserProfile(user);
      setEmailLocked(true);
      setDriver((prev) => {
        const next = {
          ...prev,
          email: user.email!,
          firstName: prev.firstName || profile.firstName,
          lastName: prev.lastName || profile.lastName,
          phone: prev.phone || profile.phone,
        };
        writeDraft({ ...draft, driver: next });
        if (profile.phone && !prev.phone) {
          setPhoneConfirm(profile.phone);
        }
        return next;
      });
    });
    // Prefill once from the signed-in account.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft identity is vanId-scoped
  }, [draft.vanId]);

  const field =
    "w-full rounded border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";
  const fieldLocked =
    "w-full cursor-not-allowed rounded border border-border bg-surface px-3 py-2.5 text-sm text-muted outline-none";

  function updateDriver(patch: Partial<BookingDraft["driver"]>) {
    setDriver((prev) => {
      const next = { ...prev, ...patch };
      writeDraft({ ...draft, driver: next });
      return next;
    });
  }

  function onPhoneChange(value: string) {
    updateDriver({ phone: digitsOnly(value) });
  }

  function onPhoneConfirmChange(value: string) {
    setPhoneConfirm(digitsOnly(value));
  }

  function onContinue() {
    setError(null);
    const { firstName, lastName, email, phone, dateOfBirth } = driver;
    if (!firstName || !lastName || !email || !phone || !dateOfBirth) {
      setError("Please complete all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^\d{10,15}$/.test(phone)) {
      setError("Enter a valid phone number (digits only, 10–15 numbers).");
      return;
    }
    if (phone !== phoneConfirm) {
      setError("Phone numbers do not match.");
      return;
    }
    if (dateOfBirth > maxDob()) {
      setError("Drivers must be 21 or over.");
      return;
    }
    writeDraft({ ...draft, driver });
    router.push(`/book/${draft.vanId}/licence`);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4 rounded-md border border-border bg-white p-6">
        <h1 className="text-2xl font-bold text-brand">Driver details</h1>
        <p className="text-sm text-muted">
          Drivers must be 21 or over. We&apos;ll send your confirmation to this
          email.
          {emailLocked && (
            <>
              {" "}
              You&apos;re signed in — confirmation goes to your account email.
            </>
          )}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Title</span>
            <select
              value={driver.title}
              onChange={(e) => updateDriver({ title: e.target.value })}
              className={field}
              autoComplete="honorific-prefix"
            >
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">First name</span>
            <input
              value={driver.firstName}
              onChange={(e) => updateDriver({ firstName: e.target.value })}
              className={field}
              autoComplete="given-name"
              name="firstName"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Last name</span>
            <input
              value={driver.lastName}
              onChange={(e) => updateDriver({ lastName: e.target.value })}
              className={field}
              autoComplete="family-name"
              name="lastName"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Email</span>
            <input
              type="email"
              value={driver.email}
              onChange={(e) => {
                if (emailLocked) return;
                updateDriver({ email: e.target.value });
              }}
              className={emailLocked ? fieldLocked : field}
              autoComplete="email"
              name="email"
              inputMode="email"
              readOnly={emailLocked}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">
              Phone (digits only)
            </span>
            <input
              type="tel"
              value={driver.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className={field}
              autoComplete="tel-national"
              name="phone"
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted">
            Confirm phone
          </span>
          <input
            type="tel"
            value={phoneConfirm}
            onChange={(e) => onPhoneConfirmChange(e.target.value)}
            className={field}
            autoComplete="off"
            name="phoneConfirm"
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">Date of birth</span>
            <input
              type="date"
              max={maxDob()}
              value={driver.dateOfBirth}
              onChange={(e) => updateDriver({ dateOfBirth: e.target.value })}
              className={field}
              autoComplete="bday"
              name="dateOfBirth"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-muted">
              Country of residence
            </span>
            <input
              value={driver.country}
              onChange={(e) => updateDriver({ country: e.target.value })}
              className={field}
              autoComplete="country-name"
              name="country"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push(`/book/${draft.vanId}/extras`)}
            className="cursor-pointer text-sm font-medium text-muted hover:text-brand"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="cursor-pointer rounded bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Continue
          </button>
        </div>
      </div>

      <BookingSummary draft={{ ...draft, driver }} />
    </div>
  );
}
