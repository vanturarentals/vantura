/**
 * SEO location pages — unique copy per area (West London & surrounds).
 * Replace collectionArea placeholder in company.ts when confirmed.
 */

export interface SeoLocation {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  headline: string;
  intro: string;
  paragraphs: string[];
  highlights: string[];
  nearbyAreas: string[];
}

export const SEO_LOCATIONS: SeoLocation[] = [
  {
    slug: "west-london",
    name: "West London",
    title: "Van hire West London",
    metaDescription:
      "Van hire in West London from Vantura Rentals. Small, medium and Luton vans for moves, trade and deliveries. Book online with a £50 deposit.",
    headline: "Van hire in West London",
    intro:
      "Need a van in West London for a house move, trade job, or delivery run? Vantura Rentals offers flexible self-drive hire with clear pricing and online booking.",
    paragraphs: [
      "Our fleet covers small vans through to Luton-size vehicles — ideal for furniture moves, eBay collections, builder's merchants runs, and event logistics across West London.",
      "Book online in minutes, pay a £50 deposit to reserve, and settle the balance when you collect. Every hire includes a standard mileage allowance with unlimited upgrades available.",
    ],
    highlights: [
      "Small to Luton vans",
      "200 miles/day included",
      "£50 online deposit",
      "Protection packages available",
    ],
    nearbyAreas: ["Southall", "Ealing", "Hounslow", "Hayes", "Uxbridge"],
  },
  {
    slug: "southall",
    name: "Southall",
    title: "Van hire Southall",
    metaDescription:
      "Hire a van in Southall and West London. Vantura Rentals — online booking, transparent pricing, moves and trade use.",
    headline: "Van hire near Southall",
    intro:
      "Southall is one of the busiest hubs in West London for moves, shop deliveries, and market traders. We make van hire straightforward with online booking and honest pricing.",
    paragraphs: [
      "Whether you're shifting stock along the High Street, collecting furniture, or heading out on a multi-drop delivery route, choose a van size that matches your load — from compact vans to high-roof Lutons.",
      "Pick your dates, add mileage and extras if you need them, and reserve with a small online deposit. The remaining balance is paid in person at collection.",
    ],
    highlights: [
      "Ideal for moves & trade",
      "Extras: straps, blankets, trolleys",
      "Additional driver available",
      "Weekday support 9–5",
    ],
    nearbyAreas: ["Hayes", "Ealing", "Hounslow", "West London"],
  },
  {
    slug: "ealing",
    name: "Ealing",
    title: "Van hire Ealing",
    metaDescription:
      "Van rental in Ealing, West London. Book small, medium and large vans online with Vantura Rentals.",
    headline: "Van hire in Ealing",
    intro:
      "From Ealing Broadway to residential streets across the borough, a reliable hire van saves time on moves, clear-outs, and business deliveries.",
    paragraphs: [
      "Vantura offers self-drive van hire with a simple online flow: search dates, compare van sizes, choose protection and extras, then pay a £50 deposit to secure your vehicle.",
      "All hires include a daily mileage allowance. Upgrade to unlimited mileage if you're covering longer distances, or pay excess mileage only if you go over your package.",
    ],
    highlights: [
      "Self-drive hire",
      "Unlimited mileage option",
      "Equipment extras available",
      "Licence upload online",
    ],
    nearbyAreas: ["Southall", "Hanwell", "Greenford", "West London"],
  },
  {
    slug: "hounslow",
    name: "Hounslow",
    title: "Van hire Hounslow",
    metaDescription:
      "Affordable van hire in Hounslow and West London. Reserve online with Vantura Rentals — moves, trade and airport-area deliveries.",
    headline: "Van hire in Hounslow",
    intro:
      "Hounslow's mix of residential moves, retail supply, and airport-related logistics means demand for vans stays high. Book ahead to secure the right size for your job.",
    paragraphs: [
      "Our vans suit everything from a quick Gumtree pickup to a full flat move. Add ratchet straps, moving blankets, or a sack trolley at checkout if you need loading kit.",
      "Drivers must meet our eligibility requirements — minimum age 21, at least one year on licence, and valid insurance declarations. See our driver requirements page before you book.",
    ],
    highlights: [
      "Short & long hires",
      "Loading equipment extras",
      "Sat nav available",
      "24/7 emergency support when on hire",
    ],
    nearbyAreas: ["Feltham", "Hayes", "West London", "Ealing"],
  },
  {
    slug: "hayes",
    name: "Hayes",
    title: "Van hire Hayes",
    metaDescription:
      "Van hire Hayes UB3 / UB4 — Vantura Rentals. Online booking for moves, trade and deliveries in West London.",
    headline: "Van hire in Hayes",
    intro:
      "Hayes sits at the crossroads of West London logistics — perfect for van hire whether you're working locally or heading out on the M4 corridor.",
    paragraphs: [
      "Choose a van by load size and height. Medium panel vans work well for most home moves; Lutons give extra cubic capacity for bulky furniture.",
      "Reserve online with a £50 deposit. Your hire total — rental, protection, mileage and extras — is shown clearly before you pay, with VAT included in our prices.",
    ],
    highlights: [
      "Panel vans & Lutons",
      "Clear VAT-inclusive pricing",
      "Pump truck & pallet kit",
      "Cancel online 48h+ before pick-up",
    ],
    nearbyAreas: ["Southall", "Uxbridge", "Hounslow", "West London"],
  },
  {
    slug: "uxbridge",
    name: "Uxbridge",
    title: "Van hire Uxbridge",
    metaDescription:
      "Van rental Uxbridge and Hillingdon. Book with Vantura Rentals — West London van hire for moves and business use.",
    headline: "Van hire in Uxbridge",
    intro:
      "Uxbridge and the wider Hillingdon area need vans for university moves, retail replenishment, and contractor tool runs. We keep booking simple and transparent.",
    paragraphs: [
      "Search availability for your dates, review van specifications (seats, payload, load dimensions), and tailor your hire with mileage packages and optional extras.",
      "Returning the van late or over mileage? Our terms set out charges upfront — including excess mileage rates — so there are no surprises after your hire.",
    ],
    highlights: [
      "Spec sheets on every van",
      "200 mile package included",
      "Excess mileage rate published",
      "All-inclusive protection option",
    ],
    nearbyAreas: ["Hayes", "West London", "Ealing", "Hounslow"],
  },
  {
    slug: "feltham",
    name: "Feltham",
    title: "Van hire Feltham",
    metaDescription:
      "Van hire Feltham TW13 / TW14. Vantura Rentals — West London self-drive vans for home and business.",
    headline: "Van hire in Feltham",
    intro:
      "Feltham residents and businesses use hire vans for house moves, storage runs, and last-mile deliveries. Book the right van size online in a few steps.",
    paragraphs: [
      "Start with your pick-up and return dates, then compare available vans. Add an additional driver if someone else will share the driving — they must meet the same eligibility rules.",
      "Equipment such as ratchet straps, moving blankets, and phone chargers can be ticked on the extras step. Pay the deposit online; the balance is due at collection.",
    ],
    highlights: [
      "Additional driver option",
      "Phone charger extra",
      "Protection from £10/day",
      "Guest booking management online",
    ],
    nearbyAreas: ["Hounslow", "West London", "Hayes", "Ealing"],
  },
  {
    slug: "hanwell",
    name: "Hanwell",
    title: "Van hire Hanwell",
    metaDescription:
      "Van hire Hanwell W7 — Vantura Rentals. West London van rental for moves, clear-outs and small business.",
    headline: "Van hire in Hanwell",
    intro:
      "Hanwell's terraced streets and park-side roads often need a compact or medium van rather than the largest Luton. Compare sizes and book online.",
    paragraphs: [
      "Our booking flow shows daily rates, included mileage, deposit, and insurance excess before you commit. Upgrade protection if you want a lower excess.",
      "First-time customers can save 20% off base rental when paying the balance in person — see our promotions page for terms.",
    ],
    highlights: [
      "Small & medium vans",
      "20% first-booking promo",
      "Basic to all-inclusive cover",
      "Online licence upload",
    ],
    nearbyAreas: ["Ealing", "Greenford", "West London", "Southall"],
  },
  {
    slug: "greenford",
    name: "Greenford",
    title: "Van hire Greenford",
    metaDescription:
      "Van hire Greenford UB6. Vantura Rentals — hire a van in West London for moves, trade and deliveries.",
    headline: "Van hire in Greenford",
    intro:
      "Greenford sits between Ealing and Perivale industrial estates — a practical base for van hire whether you're moving home or supplying a job site.",
    paragraphs: [
      "Select your hire window, pick a van category, and choose between the standard 200 mile package or unlimited mileage for longer trips.",
      "We publish our excess mileage charge per mile so you can budget accurately. Equipment extras help you move safely without buying gear you only need once.",
    ],
    highlights: [
      "Mileage packages explained",
      "Trade & domestic hire",
      "Moving blankets & straps",
      "Terms & pricing upfront",
    ],
    nearbyAreas: ["Ealing", "Hanwell", "West London", "Uxbridge"],
  },
];

export function getSeoLocation(slug: string): SeoLocation | undefined {
  return SEO_LOCATIONS.find((l) => l.slug === slug);
}

export function allSeoLocationSlugs(): string[] {
  return SEO_LOCATIONS.map((l) => l.slug);
}
