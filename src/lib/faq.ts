import { companyConfig, hirePolicy, supportEmails } from "@/lib/company";
import { formatMoney } from "@/lib/pricing";

function m(minor: number) {
  return formatMoney(minor, "gbp");
}

const p = hirePolicy;

export type FaqItem = {
  q: string;
  a?: string;
  bullets?: string[];
};

export const FAQS: FaqItem[] = [
  {
    q: "Where do I collect the van?",
    a: `Vans are collected from ${companyConfig.collectionArea}. You can drive anywhere in mainland Great Britain unless we agree otherwise. Collection details are confirmed in your booking email.`,
  },
  {
    q: "What do I need to bring?",
    bullets: [
      "Valid UK photocard driving licence (and counterpart if applicable)",
      "Proof of address dated within the last 3 months (utility bill, bank statement, or council tax bill)",
      "Debit or credit card in the main driver's name",
      "Booking reference and the card used for your online deposit",
      "DVLA share code if we request an online licence check",
    ],
  },
  {
    q: "How much is the deposit?",
    a: `A refundable reservation deposit of ${m(p.depositMinor)} is paid online when you book. The remaining hire balance is paid in person at collection. Your deposit is refunded within ${p.depositRefundDays}, subject to inspection.`,
  },
  {
    q: "What is the insurance excess?",
    bullets: [
      `Basic protection: excess ${m(p.protection.basic.excessMinor)} (${m(p.protection.basic.dailyMinor)}/day)`,
      `Smart protection: excess ${m(p.protection.smart.excessMinor)} (${m(p.protection.smart.dailyMinor)}/day)`,
      `All-inclusive: no excess for eligible claims (${m(p.protection.allInclusive.dailyMinor)}/day)`,
    ],
  },
  {
    q: "How many miles are included?",
    a: `The standard package includes ${p.includedMilesPerDay} miles per hire day. Unlimited mileage is available for ${m(p.unlimitedMilesPerDayMinor)} per day when selected at booking.`,
  },
  {
    q: "How much is extra mileage?",
    a: `If you exceed your allowance, excess mileage is charged at approximately ${m(p.excessMileagePencePerMile)} per mile.`,
  },
  {
    q: "Who can drive the van?",
    a: `Drivers must be aged ${p.minDriverAge}–${p.maxDriverAge}, hold a full licence for at least ${p.minLicenceYears} year, and be approved before driving. Additional drivers can be added for a fee — see extras at booking.`,
  },
  {
    q: "Can I take the van abroad?",
    a: "Not without written permission. Standard hires are for mainland Great Britain only. Contact us before booking if you need to travel outside the UK.",
  },
  {
    q: "Can I extend my booking?",
    a: "Yes, subject to availability. Contact us as early as possible — extensions may be charged at the prevailing daily rate.",
  },
  {
    q: "Can I add another driver?",
    a: "Yes. Additional drivers must meet our eligibility requirements and be added before they drive. Tick 'Additional Driver' on the extras step — a daily fee applies.",
  },
  {
    q: "Can I pay in cash?",
    a: "The online reservation deposit must be paid by card. The remaining balance is normally paid by card at collection. Cash is not accepted unless agreed in advance.",
  },
  {
    q: "Are debit cards accepted?",
    a: "Yes, debit and credit cards are accepted for the online deposit and balance payment.",
  },
  {
    q: "What happens if I return late?",
    a: `Contact us immediately if you will be late. A ${p.lateReturnGraceMinutes}-minute grace period may apply, then charges of approximately ${m(p.lateReturnPencePerHour)} per hour (or a full extra day) may apply.`,
  },
  {
    q: "What happens after an accident?",
    a: `Report it to us immediately at ${supportEmails.claims} and to the police if required. Do not admit liability. We will guide you through insurance and recovery.`,
  },
  {
    q: "Who pays parking fines, ULEZ and congestion charges?",
    a: "You are responsible for all fines, tolls, congestion charges, and ULEZ/LEZ charges during your hire. We may pass these to you with an administration fee.",
  },
  {
    q: "Can I smoke or bring pets?",
    a: `Smoking is not permitted (charge approx. ${m(p.smokingChargeMinor)}). Pets may be allowed by prior agreement — cleaning charges may apply.`,
  },
  {
    q: "What if I lose the keys?",
    a: `Lost keys may incur a charge of approximately ${m(p.lostKeyChargeMinor)} plus replacement and recovery costs.`,
  },
  {
    q: "When is my deposit refunded?",
    a: `Within ${p.depositRefundDays}, provided the vehicle is returned on time, in acceptable condition, with the agreed fuel level, and without outstanding charges.`,
  },
  {
    q: "Can I cancel my booking?",
    bullets: [
      `More than 48 hours before pick-up: ${p.cancellation.moreThan48h}`,
      `24–48 hours: ${p.cancellation.between24And48h}`,
      `Less than 24 hours: ${p.cancellation.lessThan24h}`,
      "Account holders and guests can cancel online via Manage bookings when pick-up is 48+ hours away. Guests verify by email code.",
    ],
  },
  {
    q: "What are your support hours?",
    a: `General enquiries: ${supportEmails.support} — Monday to Friday, 9 am–5 pm. Emergencies during an active rental (breakdown, accident): call us 24/7.`,
  },
];
