/**
 * Generate studio-style side-profile van PNGs on Vantura forest green (#1A3932).
 *
 * Usage: node scripts/generate-van-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "vans");

/** Van body length variants for side-profile SVG. */
const PROFILES = {
  short: { bodyW: 520, bodyH: 118, wheelR: 34, cabW: 118 },
  medium: { bodyW: 660, bodyH: 126, wheelR: 36, cabW: 128 },
  long: { bodyW: 820, bodyH: 132, wheelR: 38, cabW: 132 },
};

export const VAN_CATALOG = [
  {
    slug: "ford-transit-connect",
    name: "Ford Transit Connect",
    rate: 55,
    profile: "short",
  },
  {
    slug: "ford-transit-custom",
    name: "Ford Transit Custom",
    rate: 75,
    profile: "medium",
  },
  {
    slug: "vw-transporter",
    name: "Volkswagen Transporter",
    rate: 80,
    profile: "medium",
  },
  {
    slug: "renault-trafic",
    name: "Renault Trafic",
    rate: 78,
    profile: "medium",
  },
  {
    slug: "vauxhall-vivaro",
    name: "Vauxhall Vivaro",
    rate: 76,
    profile: "medium",
  },
  {
    slug: "mercedes-sprinter",
    name: "Mercedes-Benz Sprinter",
    rate: 110,
    profile: "long",
  },
];

function vanSvg(name, profileKey) {
  const p = PROFILES[profileKey];
  const totalW = p.cabW + p.bodyW;
  const x = Math.round((1200 - totalW) / 2);
  const groundY = 560;
  const bodyY = groundY - p.bodyH;
  const cargoX = x + p.cabW;
  const frontWheelCx = x + p.cabW * 0.42;
  const rearWheelCx = cargoX + p.bodyW * 0.72;
  const wheelCy = groundY - 6;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1f4239"/>
      <stop offset="55%" stop-color="#1a3932"/>
      <stop offset="100%" stop-color="#132e28"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e9ecea"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <ellipse cx="600" cy="${groundY + 28}" rx="${Math.round(totalW * 0.42)}" ry="18" fill="#000000" opacity="0.22"/>
  <g filter="url(#shadow)">
    <rect x="${x}" y="${bodyY + 34}" width="${p.cabW}" height="${p.bodyH - 34}" rx="10" fill="url(#body)"/>
    <rect x="${cargoX - 4}" y="${bodyY + 18}" width="${p.bodyW + 4}" height="${p.bodyH - 18}" rx="12" fill="url(#body)"/>
    <path d="M ${x + 8} ${bodyY + 34} Q ${x + p.cabW * 0.55} ${bodyY - 6} ${x + p.cabW - 6} ${bodyY + 34}" fill="url(#body)"/>
    <rect x="${x + 14}" y="${bodyY + 42}" width="${p.cabW - 28}" height="${p.bodyH - 52}" rx="6" fill="#24343a" opacity="0.92"/>
    <rect x="${cargoX + 28}" y="${bodyY + 30}" width="${Math.round(p.bodyW * 0.55)}" height="${p.bodyH - 44}" rx="5" fill="#24343a" opacity="0.88"/>
    <rect x="${x + p.cabW - 18}" y="${bodyY + 48}" width="10" height="${p.bodyH - 58}" rx="2" fill="#d7ddd9"/>
    <rect x="${cargoX + p.bodyW - 16}" y="${bodyY + 36}" width="8" height="${p.bodyH - 48}" rx="2" fill="#ffb4a2" opacity="0.85"/>
    <rect x="${x + 6}" y="${bodyY + 52}" width="8" height="16" rx="2" fill="#fff6cc" opacity="0.9"/>
    <circle cx="${frontWheelCx}" cy="${wheelCy}" r="${p.wheelR}" fill="#1a1a1a"/>
    <circle cx="${frontWheelCx}" cy="${wheelCy}" r="${p.wheelR - 12}" fill="#3d3d3d"/>
    <circle cx="${rearWheelCx}" cy="${wheelCy}" r="${p.wheelR}" fill="#1a1a1a"/>
    <circle cx="${rearWheelCx}" cy="${wheelCy}" r="${p.wheelR - 12}" fill="#3d3d3d"/>
  </g>
  <text x="600" y="720" text-anchor="middle" fill="#ffffff" opacity="0.18" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600">${name}</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const van of VAN_CATALOG) {
    const svg = vanSvg(van.name, van.profile);
    const outPath = path.join(OUT_DIR, `${van.slug}.png`);
    await sharp(Buffer.from(svg)).png({ quality: 92 }).toFile(outPath);
    console.log(`Wrote ${outPath}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
