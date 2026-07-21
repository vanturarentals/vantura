/**
 * Centralised, server-side configuration.
 *
 * All secrets live in environment variables (never in source). These helpers
 * read them lazily at call time so the app can still build without a populated
 * `.env.local`. Only call these from server code (route handlers / server
 * components) — never from a Client Component.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". See .env.example for setup.`,
    );
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const airtableConfig = {
  get token() {
    return required("AIRTABLE_TOKEN");
  },
  get baseId() {
    return required("AIRTABLE_BASE_ID");
  },
  get vansTable() {
    return optional("AIRTABLE_VANS_TABLE", "Vans");
  },
  get bookingsTable() {
    return optional("AIRTABLE_BOOKINGS_TABLE", "Bookings");
  },
  get extrasTable() {
    return optional("AIRTABLE_EXTRAS_TABLE", "Extras");
  },
  get bookingExtrasTable() {
    return optional("AIRTABLE_BOOKING_EXTRAS_TABLE", "Booking Extras");
  },
};

export const stripeConfig = {
  get secretKey() {
    // Prefer a restricted API key (rk_...) over a full secret key (sk_...).
    return required("STRIPE_SECRET_KEY");
  },
  get webhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET");
  },
  get currency() {
    return optional("BOOKING_CURRENCY", "gbp").toLowerCase();
  },
};

export const emailConfig = {
  get apiKey() {
    return optional("RESEND_API_KEY");
  },
  get fromAddress() {
    return optional("BOOKING_FROM_EMAIL");
  },
  /** Inbox that receives “new booking” alerts (your team Gmail is fine). */
  get notifyAddress() {
    return optional("BOOKING_NOTIFY_EMAIL", "bookings@vanturarentals.com");
  },
  get isConfigured() {
    return Boolean(this.apiKey && this.fromAddress);
  },
};

/**
 * Absolute base URL of the app, used to build Stripe success/cancel URLs.
 *
 * Prefers an explicit `NEXT_PUBLIC_APP_URL`, then Vercel's production domain
 * (which has no scheme, so we add `https://`), then localhost for dev.
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  // Treat an empty/whitespace NEXT_PUBLIC_APP_URL as unset.
  const raw = explicit
    ? explicit
    : vercel
      ? `https://${vercel}`
      : "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
