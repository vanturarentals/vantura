/**
 * Upload local PNGs from public/vans/ onto matching Airtable van records.
 *
 * Usage: node scripts/upload-van-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VANS_DIR = path.join(__dirname, "..", "public", "vans");

/** Airtable "Van Name" → local filename in public/vans/ */
const IMAGE_MAP = {
  "Ford Transit Connect": "ford-transit-connect.png",
  "Ford Transit Custom": "ford-transit-custom.png",
  "Volkswagen Transporter": "vw-transporter.png",
  "Renault Trafic": "renault-trafic.png",
  "Vauxhall Vivaro": "vauxhall-vivaro.png",
  "Mercedes-Benz Sprinter": "mercedes-sprinter.png",
};

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

async function listVans(token, baseId) {
  const records = [];
  let offset;
  do {
    const qs = offset ? `?offset=${offset}` : "";
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/Vans${qs}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
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
    throw new Error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID");
  }

  const vans = await listVans(token, baseId);
  for (const rec of vans) {
    const name = rec.fields["Van Name"];
    const file = IMAGE_MAP[name];
    if (!file) {
      console.warn(`skip ${name ?? rec.id} — no image mapping`);
      continue;
    }
    const filePath = path.join(VANS_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing file: ${filePath}`);
    }
    await uploadImage(token, baseId, rec.id, filePath, file);
    console.log(`Updated ${name}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
