"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface Props {
  /** Called by Stripe when the embedded checkout needs a client secret. */
  fetchClientSecret: () => Promise<string>;
}

/**
 * Stripe Embedded Checkout — payment UI stays on our site, powered by a
 * Checkout Session (`ui_mode: 'embedded_page'`) created on the server.
 */
export default function EmbeddedPayment({ fetchClientSecret }: Props) {
  if (!stripePromise) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Missing <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>. Add your Stripe
        publishable key (pk_test_… / pk_live_…) to the environment and redeploy.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-white">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
