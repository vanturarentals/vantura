/**
 * Seed the Airtable Extras catalogue from src/lib/extras.ts (via site defaults).
 *
 * Usage: node scripts/seed-extras.mjs
 * Requires AIRTABLE_TOKEN + AIRTABLE_BASE_ID in .env.local
 *
 * Create these tables/fields in Airtable first (see README):
 *   Extras — Slug, Name, Price (£), Charge Type (Flat | Per day)
 *   Booking Extras — Booking (link Bookings), Extra (link Extras), Quantity, Line Total (£)
 *   Bookings — Deposit Amount (£), Protection Package, Mileage Option
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXTRAS = [
  {
    id: "phone_charger",
    name: "Phone charger",
    priceMinor: 1000,
    chargeType: "flat",
  },
  {
    id: "second_driver",
    name: "Second driver",
    priceMinor: 1200,
    chargeType: "per_day",
  },
  {
    id: "pallet_truck",
    name: "Pallet truck",
    priceMinor: 2000,
    chargeType: "flat",
  },
];

const CHARGE_TYPE = { flat: "Flat", per_day: "Per day" };

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i)] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function airtable(token, baseId, pathname, options = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${pathname}: ${text.slice(0, 800)}`);
  }
  return JSON.parse(text);
}

function esc(value) {
  return value.replace(/"/g, '\\"');
}

async function main() {
  const env = loadEnv();
  const token = env.AIRTABLE_TOKEN;
  const baseId = env.AIRTABLE_BASE_ID;
  const extrasTable = env.AIRTABLE_EXTRAS_TABLE || "Extras";

  if (!token || !baseId) {
    console.error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID in .env.local");
    process.exit(1);
  }

  console.log(`Seeding ${EXTRAS.length} extras into "${extrasTable}"…`);

  for (const item of EXTRAS) {
    const formula = `{Slug}="${esc(item.id)}"`;
    const listed = await airtable(
      token,
      baseId,
      `/${encodeURIComponent(extrasTable)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
    );
    const fields = {
      Slug: item.id,
      Name: item.name,
      Price: item.priceMinor / 100,
      "Charge Type": CHARGE_TYPE[item.chargeType],
    };
    if (listed.records?.length) {
      const id = listed.records[0].id;
      await airtable(token, baseId, `/${encodeURIComponent(extrasTable)}`, {
        method: "PATCH",
        body: JSON.stringify({ records: [{ id, fields }], typecast: true }),
      });
      console.log(`  updated ${item.name} (${id})`);
    } else {
      const created = await airtable(token, baseId, `/${encodeURIComponent(extrasTable)}`, {
        method: "POST",
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      });
      console.log(`  created ${item.name} (${created.records[0].id})`);
    }
  }

  console.log("Done. Booking Extras rows are created automatically at checkout.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
