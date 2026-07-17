/** Reads van inventory from Airtable and computes availability. */
import { AirtableRecord, FIELDS, getRecord, listRecords } from "./airtable";
import { airtableConfig } from "./config";
import { getActiveBookings } from "./bookings";
import { rangesOverlap } from "./pricing";
import { OUT_OF_SERVICE_VAN_STATUSES, type Van } from "./types";

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function firstAttachmentUrl(value: unknown): string | null {
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as { url?: string };
    return first?.url ?? null;
  }
  return null;
}

function mapVan(record: AirtableRecord): Van {
  const f = record.fields;
  // "Base Daily Rate" is a currency field in major units (£); convert to pence.
  const rate = Number(f[FIELDS.van.dailyRate] ?? 0);
  const status = String(f[FIELDS.van.status] ?? "");
  return {
    id: record.id,
    name: String(f[FIELDS.van.name] ?? "Unnamed van"),
    dailyRateMinor: Math.round(rate * 100),
    status,
    imageUrl: firstAttachmentUrl(f[FIELDS.van.image]),
    pickupLocations: toStringArray(f[FIELDS.van.pickupLocations]),
    bookable: !OUT_OF_SERVICE_VAN_STATUSES.includes(status),
  };
}

export async function getVans(): Promise<Van[]> {
  const records = await listRecords(airtableConfig.vansTable);
  return records.map(mapVan).filter((van) => van.bookable);
}

export async function getVanById(id: string): Promise<Van | null> {
  try {
    return mapVan(await getRecord(airtableConfig.vansTable, id));
  } catch {
    return null;
  }
}

/** Unique pickup-location names advertised across the bookable fleet. */
export async function getLocations(): Promise<string[]> {
  const vans = await getVans();
  const set = new Set<string>();
  for (const van of vans) {
    for (const loc of van.pickupLocations) set.add(loc);
  }
  return [...set].sort();
}

/**
 * Vans that can be picked up at `location` (if given) and have no active
 * booking overlapping the requested window.
 */
export async function getAvailableVans(
  location: string,
  startAt: string,
  endAt: string,
): Promise<Van[]> {
  const [vans, activeBookings] = await Promise.all([
    getVans(),
    getActiveBookings(),
  ]);

  const candidates = location
    ? vans.filter((van) => van.pickupLocations.includes(location))
    : vans;

  return candidates.filter((van) => {
    const clash = activeBookings.some(
      (b) =>
        b.vanId === van.id && rangesOverlap(startAt, endAt, b.startAt, b.endAt),
    );
    return !clash;
  });
}

/** Guards against double-booking; used again inside the webhook. */
export async function isVanAvailable(
  vanId: string,
  startAt: string,
  endAt: string,
  ignoreBookingId?: string,
): Promise<boolean> {
  const activeBookings = await getActiveBookings();
  return !activeBookings.some(
    (b) =>
      b.vanId === vanId &&
      b.id !== ignoreBookingId &&
      rangesOverlap(startAt, endAt, b.startAt, b.endAt),
  );
}
