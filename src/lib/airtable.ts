/**
 * Minimal Airtable REST client (no SDK dependency).
 *
 * Talks to the Airtable Web API using `fetch`. Server-side only — it reads the
 * Personal Access Token from the environment. Field names are centralised in
 * `FIELDS` so you can rename Airtable columns in one place.
 */
import { airtableConfig } from "./config";

const AIRTABLE_API = "https://api.airtable.com/v0";

/**
 * Airtable column names for base `appVRvdqJG6fSUrmp`.
 * Update here if you rename columns in your base.
 *
 * Fields marked (added) were created for this app on top of the original base:
 * Van "Pickup Locations", and Booking "Pickup Location", "Dropoff Location",
 * "Total Amount", "Currency", "Stripe Session ID".
 */
export const FIELDS = {
  van: {
    name: "Van Name",
    dailyRate: "Base Daily Rate",
    status: "Status",
    image: "Image",
    pickupLocations: "Pickup Locations", // added
  },
  booking: {
    number: "Booking ID", // auto-number, read-only
    customerName: "Customer Name",
    email: "Customer Email",
    van: "Van", // linked record → Vans
    startAt: "Start Date & Time",
    endAt: "End Date & Time",
    paymentStatus: "Payment Status", // Pending | Paid | Cancelled
    pickupLocation: "Pickup Location", // added
    dropoffLocation: "Dropoff Location", // added
    totalAmount: "Total Amount", // added (currency, major units)
    currency: "Currency", // added
    stripeSessionId: "Stripe Session ID", // added
  },
} as const;

export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: T;
}

interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

function endpoint(table: string): string {
  return `${AIRTABLE_API}/${airtableConfig.baseId}/${encodeURIComponent(table)}`;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${airtableConfig.token}`,
    "Content-Type": "application/json",
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable request failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch all records from a table, transparently following pagination. */
export async function listRecords<T = Record<string, unknown>>(
  table: string,
  params: Record<string, string> = {},
): Promise<AirtableRecord<T>[]> {
  const records: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(endpoint(table));
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    if (offset) url.searchParams.set("offset", offset);

    const page = await handle<AirtableListResponse<T>>(
      await fetch(url, { headers: authHeaders(), cache: "no-store" }),
    );
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

export async function getRecord<T = Record<string, unknown>>(
  table: string,
  id: string,
): Promise<AirtableRecord<T>> {
  return handle<AirtableRecord<T>>(
    await fetch(`${endpoint(table)}/${id}`, {
      headers: authHeaders(),
      cache: "no-store",
    }),
  );
}

export async function createRecord<T = Record<string, unknown>>(
  table: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord<T>> {
  return handle<AirtableRecord<T>>(
    await fetch(endpoint(table), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ fields, typecast: true }),
    }),
  );
}

export async function updateRecord<T = Record<string, unknown>>(
  table: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord<T>> {
  return handle<AirtableRecord<T>>(
    await fetch(`${endpoint(table)}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ fields, typecast: true }),
    }),
  );
}

/** Escape a value for safe interpolation into an Airtable formula string. */
export function escapeFormulaValue(value: string): string {
  return value.replace(/"/g, '\\"');
}
