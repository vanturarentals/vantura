"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import { useBookingDraft, writeDraft } from "@/lib/use-booking-draft";
import { completeBookingStep } from "@/lib/booking-progress";
import { useBookingStepGuard } from "@/lib/use-booking-step-guard";
import type { BookingDraft } from "@/lib/booking-draft";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hirePolicy } from "@/lib/company";
import { yearsLicenceHeld, yesNoRequired } from "@/lib/driver-defaults";
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
  useBookingStepGuard(vanId, "driver");

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
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  // Local state avoids focus loss when sessionStorage draft updates.
  const [driver, setDriver] = useState(draft.driver);
  const [phoneConfirm, setPhoneConfirm] = useState(draft.driver.phone);
  const [emailLocked, setEmailLocked] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Persist driver edits after render — never call writeDraft inside setState updaters.
  useEffect(() => {
    writeDraft({ ...draftRef.current, driver });
  }, [driver]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user?.email) return;
      const profile = getUserProfile(user);
      setEmailLocked(true);
      setDriver((prev) => ({
        ...prev,
        email: user.email!,
        firstName: prev.firstName || profile.firstName,
        lastName: prev.lastName || profile.lastName,
        phone: prev.phone || profile.phone,
      }));
      if (profile.phone) {
        setPhoneConfirm((pc) => pc || profile.phone);
      }
    });
    // Prefill once from the signed-in account.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft identity is vanId-scoped
  }, [draft.vanId]);

  const field = "field";
  const fieldLocked = "field cursor-not-allowed bg-surface text-muted";

  function inputClass(name: string, locked = false) {
    const base = locked ? fieldLocked : field;
    return fieldErrors.has(name) ? `${base} field-error` : base;
  }

  function clearFieldError(name: string) {
    setFieldErrors((prev) => {
      if (!prev.has(name)) return prev;
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  function updateDriver(patch: Partial<BookingDraft["driver"]>) {
    for (const key of Object.keys(patch)) {
      clearFieldError(key);
    }
    setDriver((prev) => ({ ...prev, ...patch }));
  }

  function onPhoneChange(value: string) {
    updateDriver({ phone: digitsOnly(value) });
    clearFieldError("phone");
  }

  function onPhoneConfirmChange(value: string) {
    setPhoneConfirm(digitsOnly(value));
    clearFieldError("phoneConfirm");
  }

  function onContinue() {
    setError(null);
    const invalid = new Set<string>();

    if (!driver.firstName) invalid.add("firstName");
    if (!driver.lastName) invalid.add("lastName");
    if (!driver.email) invalid.add("email");
    if (!driver.phone) invalid.add("phone");
    if (!phoneConfirm) invalid.add("phoneConfirm");
    if (!driver.dateOfBirth) invalid.add("dateOfBirth");
    if (!driver.occupation.trim()) invalid.add("occupation");
    if (!driver.licenceValidFrom) invalid.add("licenceValidFrom");
    if (!driver.licenceCategories.trim()) invalid.add("licenceCategories");
    if (!yesNoRequired(driver.convictions5Years)) invalid.add("convictions5Years");
    if (!yesNoRequired(driver.accidents5Years)) invalid.add("accidents5Years");
    if (!yesNoRequired(driver.refusedInsurance)) invalid.add("refusedInsurance");
    if (!yesNoRequired(driver.medicalConditions)) invalid.add("medicalConditions");

    if (invalid.size > 0) {
      setFieldErrors(invalid);
      setError("Please complete all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email)) {
      setFieldErrors(new Set(["email"]));
      setError("Enter a valid email address.");
      return;
    }
    if (!/^\d{10,15}$/.test(driver.phone)) {
      setFieldErrors(new Set(["phone"]));
      setError("Enter a valid phone number (digits only, 10–15 numbers).");
      return;
    }
    if (driver.phone !== phoneConfirm) {
      setFieldErrors(new Set(["phone", "phoneConfirm"]));
      setError("Phone numbers do not match.");
      return;
    }
    if (driver.dateOfBirth > maxDob()) {
      setFieldErrors(new Set(["dateOfBirth"]));
      setError(`Drivers must be ${hirePolicy.minDriverAge} or over.`);
      return;
    }
    const held = yearsLicenceHeld(driver.licenceValidFrom);
    if (held === null || held < hirePolicy.minLicenceYears) {
      setFieldErrors(new Set(["licenceValidFrom"]));
      setError(
        `Licence must have been held for at least ${hirePolicy.minLicenceYears} year.`,
      );
      return;
    }
    if (
      !driver.declaredConvictions ||
      !driver.declaredAccidents ||
      !driver.declaredMedical ||
      !driver.entitledToDriveUk ||
      !driver.notUnderInfluence
    ) {
      setError("Please confirm all insurance declarations.");
      return;
    }
    setFieldErrors(new Set());
    writeDraft(completeBookingStep({ ...draft, driver }, 2));
    router.push(`/book/${draft.vanId}/licence`);
  }

  const licenceYears = yearsLicenceHeld(driver.licenceValidFrom);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
      <div className="panel space-y-4 p-6">
        <h1 className="text-2xl font-bold text-brand">Driver details</h1>
        <p className="text-sm text-muted">
          We&apos;ll send your confirmation to this email.{" "}
          <Link href="/driver-requirements" className="font-semibold text-brand underline">
            Driver requirements
          </Link>
          {emailLocked && (
            <>
              {" "}
              · Signed in — confirmation goes to your account email.
            </>
          )}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="field-label">Title</span>
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
            <span className="field-label">First name</span>
            <input
              value={driver.firstName}
              onChange={(e) => updateDriver({ firstName: e.target.value })}
              className={inputClass("firstName")}
              autoComplete="given-name"
              name="firstName"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="field-label">Last name</span>
            <input
              value={driver.lastName}
              onChange={(e) => updateDriver({ lastName: e.target.value })}
              className={inputClass("lastName")}
              autoComplete="family-name"
              name="lastName"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={driver.email}
              onChange={(e) => {
                if (emailLocked) return;
                updateDriver({ email: e.target.value });
              }}
              className={emailLocked ? fieldLocked : inputClass("email")}
              autoComplete="email"
              name="email"
              inputMode="email"
              readOnly={emailLocked}
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="field-label">Phone (digits only)</span>
            <input
              type="tel"
              value={driver.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className={inputClass("phone")}
              autoComplete="tel-national"
              name="phone"
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="field-label">Confirm phone</span>
          <input
            type="tel"
            value={phoneConfirm}
            onChange={(e) => onPhoneConfirmChange(e.target.value)}
            className={inputClass("phoneConfirm")}
            autoComplete="off"
            name="phoneConfirm"
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="field-label">Date of birth</span>
            <input
              type="date"
              max={maxDob()}
              value={driver.dateOfBirth}
              onChange={(e) => updateDriver({ dateOfBirth: e.target.value })}
              className={inputClass("dateOfBirth")}
              autoComplete="bday"
              name="dateOfBirth"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="field-label">Country of residence</span>
            <input
              value={driver.country}
              onChange={(e) => updateDriver({ country: e.target.value })}
              className={field}
              autoComplete="country-name"
              name="country"
            />
          </label>
          <label className="space-y-1.5">
            <span className="field-label">Occupation</span>
            <input
              value={driver.occupation}
              onChange={(e) => updateDriver({ occupation: e.target.value })}
              className={inputClass("occupation")}
              name="occupation"
              required
            />
          </label>
        </div>

        <h2 className="pt-2 text-sm font-bold text-foreground">Licence details</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="field-label">Country of licence issue</span>
            <input
              value={driver.licenceCountry}
              onChange={(e) => updateDriver({ licenceCountry: e.target.value })}
              className={field}
              name="licenceCountry"
              required
            />
          </label>
          <label className="space-y-1.5">
            <span className="field-label">Licence valid from</span>
            <input
              type="date"
              value={driver.licenceValidFrom}
              onChange={(e) => updateDriver({ licenceValidFrom: e.target.value })}
              className={inputClass("licenceValidFrom")}
              name="licenceValidFrom"
              required
            />
            {licenceYears !== null && driver.licenceValidFrom && (
              <span className="text-xs text-muted">
                {licenceYears} year{licenceYears === 1 ? "" : "s"} held
              </span>
            )}
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="field-label">Licence categories (e.g. B, C1)</span>
          <input
            value={driver.licenceCategories}
            onChange={(e) => updateDriver({ licenceCategories: e.target.value })}
            className={inputClass("licenceCategories")}
            name="licenceCategories"
            placeholder="B"
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <YesNoField
            label="Driving convictions in last 5 years?"
            value={driver.convictions5Years}
            onChange={(v) => updateDriver({ convictions5Years: v })}
            error={fieldErrors.has("convictions5Years")}
          />
          <YesNoField
            label="Accidents or insurance claims in last 5 years?"
            value={driver.accidents5Years}
            onChange={(v) => updateDriver({ accidents5Years: v })}
            error={fieldErrors.has("accidents5Years")}
          />
          <YesNoField
            label="Ever refused vehicle insurance?"
            value={driver.refusedInsurance}
            onChange={(v) => updateDriver({ refusedInsurance: v })}
            error={fieldErrors.has("refusedInsurance")}
          />
          <YesNoField
            label="Medical conditions affecting driving?"
            value={driver.medicalConditions}
            onChange={(v) => updateDriver({ medicalConditions: v })}
            error={fieldErrors.has("medicalConditions")}
          />
        </div>

        <fieldset className="space-y-3 rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-bold text-foreground">
            Insurance declarations
          </legend>
          <DeclCheckbox
            checked={driver.declaredConvictions}
            onChange={(v) => updateDriver({ declaredConvictions: v })}
            label="I confirm I have disclosed all driving convictions."
          />
          <DeclCheckbox
            checked={driver.declaredAccidents}
            onChange={(v) => updateDriver({ declaredAccidents: v })}
            label="I confirm I have disclosed any accidents or insurance claims."
          />
          <DeclCheckbox
            checked={driver.declaredMedical}
            onChange={(v) => updateDriver({ declaredMedical: v })}
            label="I confirm I have disclosed any medical conditions affecting my ability to drive."
          />
          <DeclCheckbox
            checked={driver.entitledToDriveUk}
            onChange={(v) => updateDriver({ entitledToDriveUk: v })}
            label="I confirm I am legally entitled to drive in the UK."
          />
          <DeclCheckbox
            checked={driver.notUnderInfluence}
            onChange={(v) => updateDriver({ notUnderInfluence: v })}
            label="I confirm I am not under the influence of alcohol or drugs."
          />
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push(`/book/${draft.vanId}/protection`)}
            className="btn-ghost px-0"
          >
            ← Back
          </button>
          <button type="button" onClick={onContinue} className="btn-primary">
            Continue
          </button>
        </div>
      </div>

      <BookingSummary draft={{ ...draft, driver }} />
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  return (
    <fieldset className={`space-y-2 ${error ? "rounded-lg ring-2 ring-red-600 ring-offset-2" : ""}`}>
      <legend className="field-label">{label}</legend>
      <div className="flex gap-4">
        {(["yes", "no"] as const).map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={label}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="accent-brand"
            />
            {opt === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function DeclCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-brand"
      />
      <span>{label}</span>
    </label>
  );
}
