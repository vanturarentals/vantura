/**
 * Wipe Airtable bookings + vans, seed 6 UK vans with studio PNG images.
 *
 * Usage: node scripts/reset-uk-fleet.mjs
 * Requires AIRTABLE_TOKEN + AIRTABLE_BASE_ID in .env.local
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { VAN_CATALOG } from "./generate-van-images.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${pathname}: ${text.slice(0, 500)}`);
  }
  return data;
}

async function listAll(token, baseId, table) {
  const records = [];
  let offset;
  do {
    const qs = offset ? `?offset=${offset}` : "";
    const page = await airtable(token, baseId, `/${encodeURIComponent(table)}${qs}`);
    records.push(...(page.records || []));
    offset = page.offset;
  } while (offset);
  return records;
}

async function deleteRecords(token, baseId, table, ids) {
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const params = new URLSearchParams();
    for (const id of chunk) params.append("records[]", id);
    await airtable(
      token,
      baseId,
      `/${encodeURIComponent(table)}?${params.toString()}`,
      { method: "DELETE" },
    );
    console.log(`Deleted ${chunk.length} from ${table}`);
  }
}

async function uploadImage(token, baseId, recordId, filePath, filename) {
  const base64 = fs.readFileSync(filePath).toString("base64");
  const url = `https://content.airtable.com/v0/${baseId}/${recordId}/Image/uploadAttachment`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType: "image/png",
      filename,
      file: base64,
    }),
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }
}

async function main() {
  const env = loadEnv();
  const token = env.AIRTABLE_TOKEN;
  const baseId = env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    throw new Error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID in .env.local");
  }

  // Ensure PNGs exist (skip if caller already generated them).
  if (!process.argv.includes("--skip-images")) {
    const genScript = path.join(__dirname, "generate-van-images.mjs");
    const { spawnSync } = await import("node:child_process");
    const gen = spawnSync(process.execPath, [genScript], { stdio: "inherit" });
    if (gen.status !== 0) throw new Error("Image generation failed");
  }

  console.log("Fetching existing records…");
  const bookings = await listAll(token, baseId, "Bookings");
  const vans = await listAll(token, baseId, "Vans");
  console.log(`Found ${bookings.length} booking(s), ${vans.length} van(s).`);

  if (bookings.length) {
    await deleteRecords(
      token,
      baseId,
      "Bookings",
      bookings.map((r) => r.id),
    );
  }

  if (vans.length) {
    await deleteRecords(
      token,
      baseId,
      "Vans",
      vans.map((r) => r.id),
    );
  }

  console.log("Creating UK fleet…");
  for (const van of VAN_CATALOG) {
    const created = await airtable(token, baseId, "/Vans", {
      method: "POST",
      body: JSON.stringify({
        fields: {
          "Van Name": van.name,
          "Base Daily Rate": van.rate,
          Status: "Available",
          "Pickup Locations": ["London"],
        },
        typecast: true,
      }),
    });

    const imagePath = path.join(
      __dirname,
      "..",
      "public",
      "vans",
      `${van.slug}.png`,
    );
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Missing image: ${imagePath}`);
    }

    await uploadImage(
      token,
      baseId,
      created.id,
      imagePath,
      `${van.slug}.png`,
    );
    console.log(`Created ${van.name} (${created.id})`);
  }

  console.log("Done — 6 UK vans seeded with studio images.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
