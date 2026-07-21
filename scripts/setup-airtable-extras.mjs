/**
 * Create Airtable Extras + Booking Extras schema and seed catalogue rows.
 * Also adds Deposit Amount / Protection Package / Mileage Option on Bookings.
 *
 * Usage: node scripts/setup-airtable-extras.mjs
 * Requires AIRTABLE_TOKEN (with schema.bases:write + data.records:write) + AIRTABLE_BASE_ID
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
    chargeType: "Flat",
  },
  {
    id: "second_driver",
    name: "Second driver",
    priceMinor: 1200,
    chargeType: "Per day",
  },
  {
    id: "pallet_truck",
    name: "Pallet truck",
    priceMinor: 2000,
    chargeType: "Flat",
  },
];

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

async function api(token, url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error?.message || text.slice(0, 800);
    const err = new Error(`${res.status} ${url}: ${msg}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function listTables(token, baseId) {
  const data = await api(
    token,
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
  );
  return data.tables || [];
}

async function createTable(token, baseId, body) {
  return api(token, `https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function createField(token, baseId, tableId, field) {
  return api(
    token,
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`,
    {
      method: "POST",
      body: JSON.stringify(field),
    },
  );
}

async function ensureField(token, baseId, table, fieldConfig) {
  const existing = table.fields.find(
    (f) => f.name.toLowerCase() === fieldConfig.name.toLowerCase(),
  );
  if (existing) {
    console.log(`  · field "${fieldConfig.name}" already exists`);
    return existing;
  }
  const created = await createField(token, baseId, table.id, fieldConfig);
  console.log(`  + created field "${fieldConfig.name}"`);
  table.fields.push(created);
  return created;
}

function esc(value) {
  return String(value).replace(/"/g, '\\"');
}

async function upsertExtra(token, baseId, tableName, item) {
  const formula = `{Slug}="${esc(item.id)}"`;
  const listed = await api(
    token,
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
  );
  const fields = {
    Slug: item.id,
    Name: item.name,
    Price: item.priceMinor / 100,
    "Charge Type": item.chargeType,
  };
  if (listed.records?.length) {
    const id = listed.records[0].id;
    await api(
      token,
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          records: [{ id, fields }],
          typecast: true,
        }),
      },
    );
    console.log(`  ~ updated extra ${item.name}`);
    return id;
  }
  const created = await api(
    token,
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: "POST",
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    },
  );
  console.log(`  + created extra ${item.name}`);
  return created.records[0].id;
}

async function main() {
  const env = loadEnv();
  const token = env.AIRTABLE_TOKEN;
  const baseId = env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    console.error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID in .env.local");
    process.exit(1);
  }

  console.log("Reading base schema…");
  let tables;
  try {
    tables = await listTables(token, baseId);
  } catch (err) {
    if (err.status === 403 || err.status === 401) {
      console.error(`
Could not read/write base schema. Your Airtable token needs:
  • schema.bases:read
  • schema.bases:write
  • data.records:read
  • data.records:write

Update the token at https://airtable.com/create/tokens then re-run:
  node scripts/setup-airtable-extras.mjs

Error: ${err.message}
`);
      process.exit(1);
    }
    throw err;
  }

  const byName = (name) =>
    tables.find((t) => t.name.toLowerCase() === name.toLowerCase());

  // ── Bookings optional fields ─────────────────────────────────────────────
  const bookings = byName("Bookings");
  if (!bookings) {
    console.error('Could not find a "Bookings" table.');
    process.exit(1);
  }
  console.log(`\nBookings (${bookings.id})`);
  await ensureField(token, baseId, bookings, {
    name: "Deposit Amount",
    type: "currency",
    options: { precision: 2, symbol: "£" },
  });
  await ensureField(token, baseId, bookings, {
    name: "Protection Package",
    type: "singleLineText",
  });
  await ensureField(token, baseId, bookings, {
    name: "Mileage Option",
    type: "singleLineText",
  });
  await ensureField(token, baseId, bookings, {
    name: "Cancel Verify Code",
    type: "singleLineText",
  });
  await ensureField(token, baseId, bookings, {
    name: "Cancel Verify Expires",
    type: "dateTime",
    options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" },
  });

  // ── Extras catalogue ─────────────────────────────────────────────────────
  let extras = byName("Extras");
  if (!extras) {
    console.log("\nCreating Extras table…");
    extras = await createTable(token, baseId, {
      name: "Extras",
      description: "Add-ons available on the Vantura booking site",
      fields: [
        { name: "Name", type: "singleLineText" },
        { name: "Slug", type: "singleLineText" },
        {
          name: "Price",
          type: "currency",
          options: { precision: 2, symbol: "£" },
        },
        {
          name: "Charge Type",
          type: "singleSelect",
          options: {
            choices: [{ name: "Flat" }, { name: "Per day" }],
          },
        },
      ],
    });
    tables.push(extras);
    console.log(`  + Extras created (${extras.id})`);
  } else {
    console.log(`\nExtras (${extras.id})`);
    await ensureField(token, baseId, extras, {
      name: "Slug",
      type: "singleLineText",
    });
    await ensureField(token, baseId, extras, {
      name: "Price",
      type: "currency",
      options: { precision: 2, symbol: "£" },
    });
    await ensureField(token, baseId, extras, {
      name: "Charge Type",
      type: "singleSelect",
      options: {
        choices: [{ name: "Flat" }, { name: "Per day" }],
      },
    });
  }

  // Refresh schema so we have ids for linked-record options
  tables = await listTables(token, baseId);
  const bookingsFresh = byName("Bookings");
  const extrasFresh = byName("Extras");

  // ── Booking Extras junction ──────────────────────────────────────────────
  let bookingExtras = byName("Booking Extras");
  if (!bookingExtras) {
    console.log("\nCreating Booking Extras table…");
    bookingExtras = await createTable(token, baseId, {
      name: "Booking Extras",
      description: "Extras selected on each booking",
      fields: [
        { name: "Name", type: "singleLineText" },
        {
          name: "Booking",
          type: "multipleRecordLinks",
          options: { linkedTableId: bookingsFresh.id },
        },
        {
          name: "Extra",
          type: "multipleRecordLinks",
          options: { linkedTableId: extrasFresh.id },
        },
        {
          name: "Quantity",
          type: "number",
          options: { precision: 0 },
        },
        {
          name: "Line Total",
          type: "currency",
          options: { precision: 2, symbol: "£" },
        },
      ],
    });
    tables.push(bookingExtras);
    console.log(`  + Booking Extras created (${bookingExtras.id})`);
  } else {
    console.log(`\nBooking Extras (${bookingExtras.id})`);
    await ensureField(token, baseId, bookingExtras, {
      name: "Booking",
      type: "multipleRecordLinks",
      options: { linkedTableId: bookingsFresh.id },
    });
    await ensureField(token, baseId, bookingExtras, {
      name: "Extra",
      type: "multipleRecordLinks",
      options: { linkedTableId: extrasFresh.id },
    });
    await ensureField(token, baseId, bookingExtras, {
      name: "Quantity",
      type: "number",
      options: { precision: 0 },
    });
    await ensureField(token, baseId, bookingExtras, {
      name: "Line Total",
      type: "currency",
      options: { precision: 2, symbol: "£" },
    });
  }

  // ── Seed extras catalogue ────────────────────────────────────────────────
  console.log("\nSeeding extras catalogue…");
  for (const item of EXTRAS) {
    await upsertExtra(token, baseId, "Extras", item);
  }

  console.log(`
Done.
  • Extras table seeded with ${EXTRAS.length} items
  • Booking Extras will fill automatically on new checkouts
  • Bookings now has Deposit Amount / Protection Package / Mileage Option
`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
