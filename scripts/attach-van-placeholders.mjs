/**
 * Attach placeholder van images to Airtable Vans records.
 *
 * Usage: node scripts/attach-van-placeholders.mjs
 * Requires AIRTABLE_TOKEN + AIRTABLE_BASE_ID in .env.local
 *
 * Airtable fetches attachment URLs itself — we pass public image URLs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    env[t.slice(0, i)] = t
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

/** Distinct van-like stock photos (Unsplash, free to use). */
const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&h=800&q=80", // camper van road
  "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&w=1200&h=800&q=80", // white van
  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&h=800&q=80", // suv/van exterior
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&h=800&q=80", // cargo van
  "https://images.unsplash.com/photo-1601362840469-51e4d8da33ff?auto=format&fit=crop&w=1200&h=800&q=80", // commercial van
  "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&h=800&q=80", // van side
];

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
    throw new Error(`${res.status} ${pathname}: ${text.slice(0, 400)}`);
  }
  return data;
}

async function main() {
  const env = loadEnv();
  const token = env.AIRTABLE_TOKEN;
  const baseId = env.AIRTABLE_BASE_ID;
  if (!token || token === "[SENSITIVE]" || token.startsWith("TODO")) {
    throw new Error("AIRTABLE_TOKEN missing or still a placeholder in .env.local — save the file first.");
  }
  if (!baseId || baseId === "[SENSITIVE]") {
    throw new Error("AIRTABLE_BASE_ID missing in .env.local — save the file first.");
  }

  const onlyMissing = process.argv.includes("--only-missing");

  const listed = await airtable(token, baseId, "/Vans");
  const records = listed.records || [];
  console.log(`Found ${records.length} van(s).`);

  const updates = [];
  records.forEach((rec, idx) => {
    const name = rec.fields["Van Name"] || rec.id;
    const hasImage = Array.isArray(rec.fields.Image) && rec.fields.Image.length > 0;
    if (onlyMissing && hasImage) {
      console.log(`skip ${name} (already has image)`);
      return;
    }
    const url = PLACEHOLDERS[idx % PLACEHOLDERS.length];
    updates.push({
      id: rec.id,
      fields: {
        Image: [{ url, filename: `${String(name).replace(/\s+/g, "-").toLowerCase()}-placeholder.jpg` }],
      },
    });
    console.log(`queue ${name} → placeholder ${idx % PLACEHOLDERS.length + 1}`);
  });

  if (!updates.length) {
    console.log("Nothing to update.");
    return;
  }

  // Airtable allows 10 records per patch.
  for (let i = 0; i < updates.length; i += 10) {
    const chunk = updates.slice(i, i + 10);
    await airtable(token, baseId, "/Vans", {
      method: "PATCH",
      body: JSON.stringify({ records: chunk, typecast: true }),
    });
    console.log(`Updated ${chunk.length} record(s).`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
