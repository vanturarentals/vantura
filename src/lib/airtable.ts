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
    number: "Booking ID", // auto-number, internal/Airtable only
    reference: "Booking Reference", // added — public 9-char code
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
    licenceFront: "Licence Front", // added — attachment
    licenceBack: "Licence Back", // added — attachment
    userId: "User Id", // added — Supabase auth user id
    cancelRequestedAt: "Cancel Requested At", // added
    refundStatus: "Refund Status", // added — Not required | Pending | Completed
    cancelVerifyCode: "Cancel Verify Code", // added — guest cancel OTP
    cancelVerifyExpires: "Cancel Verify Expires", // added — ISO datetime
    depositAmount: "Deposit Amount", // added — currency, major units
    protectionPackage: "Protection Package", // added — single line text
    mileageOption: "Mileage Option", // added — single line text
    customerPhone: "Customer Phone", // added
    dateOfBirth: "Date of Birth", // added — date
    countryOfResidence: "Country of Residence", // added
    occupation: "Occupation", // added
    licenceCountry: "Licence Country", // added
    licenceValidFrom: "Licence Valid From", // added — date
    licenceCategories: "Licence Categories", // added
    convictions5Years: "Convictions 5 Years", // added — Yes/No
    accidents5Years: "Accidents 5 Years", // added
    refusedInsurance: "Refused Insurance", // added
    medicalConditions: "Medical Conditions", // added
    declarationsConfirmed: "Declarations Confirmed", // added — checkbox
    driverSnapshot: "Driver Snapshot", // added — long text
    promoDiscount: "Promo Discount", // added — currency, major units
    firstBookingPromo: "First Booking Promo", // added — checkbox
  },
  extra: {
    slug: "Slug", // matches site catalogue id
    name: "Name",
    price: "Price", // currency, major units (per day or flat)
    chargeType: "Charge Type", // Flat | Per day
    description: "Description", // added
    category: "Category", // added — Equipment | Service
  },
  bookingExtra: {
    booking: "Booking", // link → Bookings
    extra: "Extra", // link → Extras
    quantity: "Quantity",
    lineTotal: "Line Total", // currency, major units
  },
  hireAgreement: {
    booking: "Booking", // link → Bookings
    status: "Status", // Pre-hire | At collection | On hire | Returned | Closed
    driverSnapshot: "Driver Snapshot", // long text
    collectionMileage: "Collection Mileage", // number
    collectionFuel: "Collection Fuel", // single select
    collectionDamageNotes: "Collection Damage Notes", // long text
    collectionSignedAt: "Collection Signed At", // datetime
    collectionStaff: "Collection Staff", // single line text
    returnMileage: "Return Mileage", // number
    returnFuel: "Return Fuel", // single select
    returnDamageNotes: "Return Damage Notes", // long text
    additionalCharges: "Additional Charges", // currency
    returnSignedAt: "Return Signed At", // datetime
    returnStaff: "Return Staff", // single line text
    notes: "Notes", // long text
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

/**
 * Upload a binary attachment (base64) onto an existing record field.
 * Uses Airtable's content upload API.
 */
export async function uploadAttachment(input: {
  recordId: string;
  fieldName: string;
  filename: string;
  contentType: string;
  /** Raw base64 without the data:…;base64, prefix. */
  base64: string;
}): Promise<void> {
  const url = `https://content.airtable.com/v0/${airtableConfig.baseId}/${input.recordId}/${encodeURIComponent(input.fieldName)}/uploadAttachment`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${airtableConfig.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType: input.contentType,
      filename: input.filename,
      file: input.base64,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable attachment upload failed (${res.status}): ${body}`);
  }
}

/** Escape a value for safe interpolation into an Airtable formula string. */
export function escapeFormulaValue(value: string): string {
  return value.replace(/"/g, '\\"');
}
