import Stripe from "stripe";
import { stripeConfig } from "./config";

let client: Stripe | null = null;

/**
 * Lazily-instantiated Stripe client. We don't pin `apiVersion` here so the SDK
 * uses the version it ships with (currently the latest), avoiding type drift.
 */
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(stripeConfig.secretKey, {
      appInfo: { name: "van-rental" },
    });
  }
  return client;
}
