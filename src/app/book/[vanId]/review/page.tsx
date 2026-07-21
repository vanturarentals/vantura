"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";
import BookingSummary from "@/components/BookingSummary";
import EmbeddedPayment from "@/components/EmbeddedPayment";
import SignInPrompt from "@/components/SignInPrompt";
import { getExtra } from "@/lib/extras";
import { getProtection } from "@/lib/protections";
import { getMileageOption } from "@/lib/mileage";
import { useBookingDraft } from "@/lib/use-booking-draft";
import { useBookingStepGuard } from "@/lib/use-booking-step-guard";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ReviewPage() {
  const { vanId } = useParams<{ vanId: string }>();
  const router = useRouter();
  const draft = useBookingDraft(vanId);
  useBookingStepGuard(vanId, "review");
  const [accepted, setAccepted] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const clientSecretRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchClientSecret = useCallback(async () => {
    if (!draft) throw new Error("Missing booking details.");
    if (!draft.licence?.frontDataUrl || !draft.licence?.backDataUrl) {
      throw new Error("Please upload your driving licence first.");
    }
    if (!clientSecretRef.current) {
      clientSecretRef.current = (async () => {
        const customerName =
          `${draft.driver.firstName} ${draft.driver.lastName}`.trim();
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vanId: draft.vanId,
            pickupLocation: draft.pickupLocation,
            dropoffLocation: draft.dropoffLocation,
            startAt: draft.pickupAt,
            endAt: draft.dropoffAt,
            customerName,
            email: draft.driver.email,
            phone: draft.driver.phone,
            driver: draft.driver,
            extras: draft.extras,
            protectionId: draft.protectionId ?? "basic",
            mileageId: draft.mileageId ?? "included_200",
            licence: draft.licence,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          clientSecretRef.current = null;
          throw new Error(data.error ?? "Could not start checkout.");
        }
        return data.clientSecret as string;
      })();
    }
    return clientSecretRef.current;
  }, [draft]);

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

  if (!draft.licence?.frontDataUrl || !draft.licence?.backDataUrl) {
    return (
      <p className="text-muted">
        Please upload your driving licence before payment.{" "}
        <Link href={`/book/${vanId}/licence`} className="text-brand underline">
          Upload licence
        </Link>
      </p>
    );
  }

  const current = draft;

  const extrasLabel = current.extras
    .filter((e) => e.quantity > 0)
    .map((e) => {
      const item = getExtra(e.id);
      return item
        ? `${item.name}${e.quantity > 1 ? ` ×${e.quantity}` : ""}`
        : null;
    })
    .filter(Boolean)
    .join(", ");

  const protection = getProtection(current.protectionId ?? "basic");
  const protectionLabel = protection?.name ?? "Basic";

  const mileage = getMileageOption(current.mileageId ?? "included_200");
  const mileageLabel = mileage?.name ?? "200 miles";

  function startPayment() {
    setError(null);
    if (!accepted) {
      setError("Please accept the terms to continue.");
      return;
    }
    setShowPayment(true);
  }

  return (
    <div>
      <BookingSteps vanId={vanId} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-brand">
            {showPayment ? "Pay deposit" : "Review & reserve"}
          </h1>

          {!showPayment && (
            <>
              <SignInPrompt signedIn={signedIn} />
              <Section
                title="Hire dates"
                href={`/vans?${new URLSearchParams({
                  pickupAt: current.pickupAt,
                  dropoffAt: current.dropoffAt,
                }).toString()}`}
                lines={[
                  `Pick-up · ${formatLong(current.pickupAt)}`,
                  `Drop-off · ${formatLong(current.dropoffAt)}`,
                ]}
              />
              <Section
                title="Vehicle"
                href={`/vans?${new URLSearchParams({
                  pickupAt: current.pickupAt,
                  dropoffAt: current.dropoffAt,
                }).toString()}`}
                lines={[current.vanName]}
              />
              <Section
                title="Mileage"
                href={`/vans?${new URLSearchParams({
                  pickupAt: current.pickupAt,
                  dropoffAt: current.dropoffAt,
                }).toString()}`}
                lines={[mileageLabel]}
              />
              <Section
                title="Extras"
                href={`/book/${vanId}/extras`}
                lines={[extrasLabel || "None"]}
              />
              <Section
                title="Protection"
                href={`/book/${vanId}/protection`}
                lines={[protectionLabel]}
              />
              <Section
                title="Driver"
                href={`/book/${vanId}/driver`}
                lines={[
                  `${current.driver.title} ${current.driver.firstName} ${current.driver.lastName}`,
                  current.driver.email,
                  current.driver.phone,
                ]}
              />
              <Section
                title="Driving licence"
                href={`/book/${vanId}/licence`}
                lines={["Front and back uploaded"]}
              />

              <label className="panel flex items-start gap-3 p-4 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 accent-brand"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link href="/terms" className="font-semibold text-brand underline">
                    Terms &amp; Conditions
                  </Link>
                  ,{" "}
                  <Link href="/privacy" className="font-semibold text-brand underline">
                    Privacy Policy
                  </Link>
                  , and confirm the driver details are correct.
                </span>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => router.push(`/book/${vanId}/licence`)}
                  className="btn-ghost px-0"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={startPayment}
                  className="btn-primary py-3"
                >
                  Continue to reserve
                </button>
              </div>
            </>
          )}

          {showPayment && (
            <div className="space-y-4">
              <SignInPrompt signedIn={signedIn} />
              <p className="text-sm text-muted">
                Pay a £50 deposit now to reserve your van. The remaining balance
                is due in person at pick-up. Card details are processed securely
                by Stripe.
              </p>
              <EmbeddedPayment fetchClientSecret={fetchClientSecret} />
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="btn-ghost px-0"
              >
                ← Back to review
              </button>
            </div>
          )}
        </div>

        <BookingSummary draft={current} />
      </div>
    </div>
  );
}

function Section({
  title,
  href,
  lines,
}: {
  title: string;
  href: string;
  lines: string[];
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <Link
          href={href}
          className="text-xs font-semibold text-brand hover:underline"
        >
          Edit
        </Link>
      </div>
      <ul className="mt-2 space-y-0.5 text-sm text-muted">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function formatLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
