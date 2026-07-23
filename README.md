# Van Rental

A Sixt-style van rental site built on **Next.js 16** (App Router). Inventory is
read from **Airtable**, payments are taken with **Stripe Checkout**, and paid
bookings are written back to Airtable. Confirmation email is wired for **Resend**
(optional — it no-ops until you add credentials).

## How it works

```
Customer → search (location + dates)
        → /api/availability  ── reads Vans from Airtable, filters out clashes
        → picks a van, enters name/email
        → /api/checkout      ── creates a PENDING booking (hold) + Stripe Checkout Session
        → Stripe hosted checkout (payment)
        → /api/webhooks/stripe (checkout.session.completed)
                             ── confirms booking in Airtable + sends email
```

**The Stripe webhook is the source of truth** — bookings are only confirmed
server-to-server, never from the browser redirect.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Purpose |
   | --- | --- |
   | `STRIPE_SECRET_KEY` | Stripe **restricted** key (`rk_...`) with Checkout + Refund permissions |
   | `STRIPE_WEBHOOK_SECRET` | Signing secret from `stripe listen` or the Dashboard |
   | `AIRTABLE_TOKEN` | Personal Access Token (`data.records:read` + `:write`) |
   | `AIRTABLE_BASE_ID` | Your base id (`app...`) |
   | `BOOKING_CURRENCY` | ISO currency, lowercase (default `gbp`) |
   | `NEXT_PUBLIC_APP_URL` | App base URL for Stripe redirect URLs |
   | `RESEND_API_KEY` / `BOOKING_FROM_EMAIL` | Optional — enables confirmation emails |
   | `OPS_STAFF_PIN` | Staff PIN for `/ops/handover` collection paperwork |

3. Run the app:

   ```bash
   npm run dev
   ```

4. In a second terminal, forward Stripe webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

## Airtable schema

Field names are centralised in `src/lib/airtable.ts` (`FIELDS`) — rename there if
your columns differ. This matches base `appVRvdqJG6fSUrmp`. Fields marked
**(added)** were created for this app on top of the original base.

### `Vans`

| Field | Type | Notes |
| --- | --- | --- |
| `Van Name` | Single line text | Primary field |
| `Base Daily Rate` | Currency (£) | Major units; converted to pence in code |
| `Status` | Single select | Bookable when `Active` or `Available` |
| `Image` | Attachment | First attachment is shown |
| `Pickup Locations` | Multiple select | **(added)** branches this van is collected from; powers the location picker |

### `Bookings`

| Field | Type | Notes |
| --- | --- | --- |
| `Booking ID` | Auto number | Human-facing reference |
| `Customer Name` | Single line text | |
| `Customer Email` | Email | |
| `Van` | Link → Vans | Written as `[recordId]` |
| `Start Date & Time` | Date (incl. time) | Stored as ISO 8601 |
| `End Date & Time` | Date (incl. time) | Stored as ISO 8601 |
| `Payment Status` | Single select | `Pending` → `Paid` → `Cancelled` |
| `Pickup Location` | Single line text | **(added)** |
| `Dropoff Location` | Single line text | **(added)** |
| `Total Amount` | Currency (£) | **(added)** full hire total (major units) |
| `Deposit Amount` | Currency (£) | **(added)** £50 reservation deposit |
| `Protection Package` | Single line text | **(added)** e.g. Basic, Smart |
| `Mileage Option` | Single line text | **(added)** e.g. 200 miles, Unlimited miles |
| `Currency` | Single line text | **(added)** |
| `Stripe Session ID` | Single line text | **(added)** used for the success-page lookup |

### Extras catalogue (`Extras` table)

| Field | Type | Notes |
|-------|------|-------|
| `Slug` | Single line text | Site id — `phone_charger`, `second_driver`, `pallet_truck` |
| `Name` | Single line text | Display name |
| `Price` | Currency (£) | Per day or flat (see Charge Type) |
| `Charge Type` | Single select | `Flat` or `Per day` |

Run `node scripts/seed-extras.mjs` to upsert the three site extras.

### Booking extras (`Booking Extras` table)

| Field | Type | Notes |
|-------|------|-------|
| `Booking` | Link → Bookings | One row per extra line on a booking |
| `Extra` | Link → Extras | Catalogue item |
| `Quantity` | Number | |
| `Line Total` | Currency (£) | Computed at checkout |

Rows are created automatically when a customer checks out with extras selected.

Unpaid `Pending` bookings act as 30-minute holds (expiry is derived from the
Airtable record `createdTime`), then are released by the
`checkout.session.expired` webhook.

Checkout charges a **£50 deposit** online; the full hire total is stored on
the booking and the balance is collected in person at pick-up.

## Project structure

```
src/
  app/
    api/
      availability/route.ts   GET  – available vans for a date range
      checkout/route.ts       POST – create hold + Stripe Checkout Session
      locations/route.ts      GET  – pickup locations
      webhooks/stripe/route.ts POST – confirm/cancel bookings (source of truth)
    booking/success/page.tsx
    booking/cancelled/page.tsx
    vans/page.tsx             results page
    page.tsx                  home + search
  components/
    SearchForm.tsx
    VanResults.tsx
  lib/
    airtable.ts   REST client + field map
    bookings.ts   create/read/update bookings
    config.ts     env access
    email.ts      Resend (optional)
    inventory.ts  vans + availability
    pricing.ts    price/date helpers
    stripe.ts     Stripe client
    types.ts      domain types
```

## Notes & next steps

- **Double-booking:** Airtable has no locking, so availability is re-checked at
  checkout and again in the webhook (which refunds if a race slipped through).
  For higher volume, move inventory to a transactional DB.
- **Expired holds:** unpaid holds are released via the `checkout.session.expired`
  webhook. You can also add a scheduled cleanup for safety.
- **Email:** add real templates in `src/lib/email.ts`; it already sends via the
  Resend REST API once `RESEND_API_KEY` + `BOOKING_FROM_EMAIL` are set.
