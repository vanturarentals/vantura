"use client";

import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const ELEMENT_STYLE = {
  base: {
    color: "#1a1a1a",
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif",
    fontSize: "14px",
    fontSmoothing: "antialiased" as const,
    "::placeholder": { color: "#6b726e" },
  },
  invalid: { color: "#dc2626" },
};

const fieldShell =
  "rounded-lg border border-border bg-white px-3 py-2.5 transition-colors focus-within:border-brand";

interface Props {
  /** Creates a PaymentIntent and returns its client secret. */
  fetchClientSecret: () => Promise<string>;
}

/**
 * Vantura-styled card fields backed by Stripe.
 * Inputs look native; card data stays in Stripe iframes (PCI-safe).
 */
export default function EmbeddedPayment({ fetchClientSecret }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchClientSecret()
      .then((secret) => {
        if (!cancelled) setClientSecret(secret);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Could not start payment.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchClientSecret]);

  if (!stripePromise) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Missing <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>. Add your Stripe
        publishable key to the environment and redeploy.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {loadError}
      </p>
    );
  }

  if (!clientSecret) {
    return (
      <p className="rounded-md border border-border bg-surface p-4 text-sm text-muted">
        Preparing secure payment…
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1a3932",
            colorBackground: "#ffffff",
            colorText: "#1a1a1a",
            colorDanger: "#dc2626",
            fontFamily:
              "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setError("Card form is not ready yet.");
      return;
    }

    setBusy(true);
    setError(null);

    const { error: confirmError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumber },
      });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setBusy(false);
      return;
    }

    if (
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "processing"
    ) {
      router.push(`/booking/success?payment_intent=${paymentIntent.id}`);
      return;
    }

    setError("Payment was not completed. Please try again.");
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold text-brand">Reserve your van</h2>
        <p className="mt-1 text-sm text-muted">
          Pay a £50 deposit today. Your card details never touch our servers.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="field-label">Card number</span>
        <div className={fieldShell}>
          <CardNumberElement
            options={{ style: ELEMENT_STYLE, showIcon: true }}
          />
        </div>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="field-label">Expiry</span>
          <div className={fieldShell}>
            <CardExpiryElement options={{ style: ELEMENT_STYLE }} />
          </div>
        </label>
        <label className="block space-y-1.5">
          <span className="field-label">CVC</span>
          <div className={fieldShell}>
            <CardCvcElement options={{ style: ELEMENT_STYLE }} />
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || busy}
        className="btn-primary w-full gap-2 py-3"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        {busy ? "Processing…" : "Reserve now — pay £50 deposit"}
      </button>
    </form>
  );
}
