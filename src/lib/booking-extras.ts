/** Sync site extras catalogue with Airtable and attach them to bookings. */
import {
  FIELDS,
  createRecord,
  escapeFormulaValue,
  listRecords,
  updateRecord,
} from "./airtable";
import { airtableConfig } from "./config";
import { EXTRAS, extrasTotalMinor, getExtra } from "./extras";
import { rentalDays } from "./pricing";

const CHARGE_TYPE_TO_AIRTABLE: Record<string, string> = {
  flat: "Flat",
  per_day: "Per day",
};

const CATEGORY_TO_AIRTABLE: Record<string, string> = {
  equipment: "Equipment",
  service: "Service",
};

const slugToRecordId = new Map<string, string>();

function extraLineTotalMinor(
  extraId: string,
  quantity: number,
  days: number,
): number {
  const item = getExtra(extraId);
  if (!item || quantity <= 0) return 0;
  const unit =
    item.chargeType === "per_day" ? item.priceMinor * days : item.priceMinor;
  return unit * quantity;
}

/** Look up (or create) an Extras catalogue row by site slug. */
export async function ensureExtraCatalogRecord(slug: string): Promise<string | null> {
  const cached = slugToRecordId.get(slug);
  if (cached) return cached;

  const item = getExtra(slug);
  if (!item) return null;

  const formula = `{${FIELDS.extra.slug}}="${escapeFormulaValue(slug)}"`;
  const existing = await listRecords(airtableConfig.extrasTable, {
    filterByFormula: formula,
    maxRecords: "1",
  });
  if (existing.length) {
    slugToRecordId.set(slug, existing[0].id);
    return existing[0].id;
  }

  const created = await createRecord(airtableConfig.extrasTable, {
    [FIELDS.extra.slug]: slug,
    [FIELDS.extra.name]: item.name,
    [FIELDS.extra.price]: item.priceMinor / 100,
    [FIELDS.extra.chargeType]:
      CHARGE_TYPE_TO_AIRTABLE[item.chargeType] ?? item.chargeType,
    [FIELDS.extra.description]: item.description,
    [FIELDS.extra.category]:
      CATEGORY_TO_AIRTABLE[item.category] ?? item.category,
  });
  slugToRecordId.set(slug, created.id);
  return created.id;
}

/** Upsert all site extras into the Airtable Extras catalogue. */
export async function syncExtrasCatalog(): Promise<number> {
  let synced = 0;
  for (const item of EXTRAS) {
    const formula = `{${FIELDS.extra.slug}}="${escapeFormulaValue(item.id)}"`;
    const existing = await listRecords(airtableConfig.extrasTable, {
      filterByFormula: formula,
      maxRecords: "1",
    });
    const fields = {
      [FIELDS.extra.slug]: item.id,
      [FIELDS.extra.name]: item.name,
      [FIELDS.extra.price]: item.priceMinor / 100,
      [FIELDS.extra.chargeType]:
        CHARGE_TYPE_TO_AIRTABLE[item.chargeType] ?? item.chargeType,
      [FIELDS.extra.description]: item.description,
      [FIELDS.extra.category]:
        CATEGORY_TO_AIRTABLE[item.category] ?? item.category,
    };
    if (existing.length) {
      await updateRecord(airtableConfig.extrasTable, existing[0].id, fields);
      slugToRecordId.set(item.id, existing[0].id);
    } else {
      const created = await createRecord(airtableConfig.extrasTable, fields);
      slugToRecordId.set(item.id, created.id);
    }
    synced += 1;
  }
  return synced;
}

/** Create Booking Extras rows linked to a booking. Soft-fails if tables aren't set up yet. */
export async function attachBookingExtras(input: {
  bookingId: string;
  extras: { id: string; quantity: number }[];
  startAt: string;
  endAt: string;
}): Promise<void> {
  const selected = input.extras.filter((line) => line.quantity > 0);
  if (selected.length === 0) return;

  try {
    const days = rentalDays(input.startAt, input.endAt);
    for (const line of selected) {
      const extraRecordId = await ensureExtraCatalogRecord(line.id);
      if (!extraRecordId) continue;
      const lineTotalMinor = extraLineTotalMinor(line.id, line.quantity, days);
      await createRecord(airtableConfig.bookingExtrasTable, {
        [FIELDS.bookingExtra.booking]: [input.bookingId],
        [FIELDS.bookingExtra.extra]: [extraRecordId],
        [FIELDS.bookingExtra.quantity]: line.quantity,
        [FIELDS.bookingExtra.lineTotal]: lineTotalMinor / 100,
      });
    }
  } catch (error) {
    // Don't block Stripe checkout if Extras / Booking Extras tables aren't created yet.
    console.warn(
      "[booking-extras] Could not sync extras to Airtable (tables may be missing):",
      error instanceof Error ? error.message : error,
    );
  }
}
