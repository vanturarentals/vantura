import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import {
  companyConfig,
  hirePolicy,
  supportEmails,
} from "@/lib/company";
import { formatMoney } from "@/lib/pricing";

function money(minor: number) {
  return formatMoney(minor, "gbp");
}

export const metadata = {
  title: "Terms & Conditions — Vantura Rentals",
  description: "Rental terms and conditions for van hire with Vantura Rentals Ltd.",
};

export default function TermsPage() {
  const p = hirePolicy;

  return (
    <LegalPageLayout
      title="Terms & Conditions"
      description={`These terms apply when you hire a van from ${companyConfig.legalName} (trading as ${companyConfig.tradingName}). By making a booking you agree to them.`}
    >
      <LegalSection title="1. Who we are">
        <p>
          Your hire agreement is with <strong>{companyConfig.legalName}</strong>{" "}
          (trading as <strong>{companyConfig.tradingName}</strong>), company
          number {companyConfig.companyNumber}, registered office{" "}
          {companyConfig.registeredOffice}. We are VAT registered. All prices
          shown on our website include VAT unless stated otherwise.
        </p>
        <p>
          Contact:{" "}
          <a href={`mailto:${supportEmails.bookings}`} className="text-brand underline">
            {supportEmails.bookings}
          </a>{" "}
          (bookings),{" "}
          <a href={`mailto:${supportEmails.support}`} className="text-brand underline">
            {supportEmails.support}
          </a>{" "}
          (general enquiries),{" "}
          <a href={`mailto:${supportEmails.claims}`} className="text-brand underline">
            {supportEmails.claims}
          </a>{" "}
          (damage and insurance claims).
        </p>
      </LegalSection>

      <LegalSection title="2. Collection and use of the vehicle">
        <p>
          Vehicles are collected from <strong>{companyConfig.collectionArea}</strong>{" "}
          unless we agree delivery in writing. You may drive within mainland Great
          Britain only unless we give written permission to travel abroad.
        </p>
        <p>
          The vehicle must be returned to the agreed location by the agreed
          date and time, with the same fuel level as at collection, in a
          reasonable condition, and with all keys, documents, and hired
          equipment.
        </p>
      </LegalSection>

      <LegalSection title="3. Who may drive">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Drivers must be aged {p.minDriverAge}–{p.maxDriverAge} (subject to
            insurer approval).
          </li>
          <li>
            A full valid driving licence must have been held for at least{" "}
            {p.minLicenceYears} year{p.minLicenceYears === 1 ? "" : "s"}.
          </li>
          <li>
            Only drivers named and approved on the hire agreement may drive the
            vehicle.
          </li>
          <li>
            We may require a DVLA licence check, proof of address (dated within
            the last 3 months), and additional documents for insurance
            verification.
          </li>
          <li>
            We reserve the right to refuse hire if licence checks, insurance
            eligibility, or identity verification are not satisfactory.
          </li>
          <li>
            The payment card used for the online deposit should be in the main
            driver&apos;s name where possible.
          </li>
        </ul>
        <p className="text-xs italic">
          Drivers from age {p.minDriverAge} may be accepted subject to licence
          checks, insurer approval, and eligibility requirements.
        </p>
      </LegalSection>

      <LegalSection title="4. Booking, deposit and payment">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            A refundable reservation deposit of <strong>{money(p.depositMinor)}</strong>{" "}
            is payable online to confirm your booking.
          </li>
          <li>
            The remaining hire balance (van rental, protection, mileage,
            extras, and any applicable charges) is payable in person at
            collection unless we agree otherwise in writing.
          </li>
          <li>
            We accept debit and credit cards for the online deposit. Cash may
            not be accepted for the balance unless agreed in advance.
          </li>
          <li>
            Prices are confirmed in your booking summary before you pay the
            deposit. See our{" "}
            <Link href="/promotions" className="text-brand underline">
              Promotions
            </Link>{" "}
            page for introductory offer terms.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Insurance, protection and excess">
        <p>Basic insurance is included for eligible drivers. Insurance excess applies as follows (estimates — confirm at booking):</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Basic protection</strong> — {money(p.protection.basic.dailyMinor)}/day;
            excess {money(p.protection.basic.excessMinor)}
          </li>
          <li>
            <strong>Smart protection</strong> — {money(p.protection.smart.dailyMinor)}/day;
            excess {money(p.protection.smart.excessMinor)}
          </li>
          <li>
            <strong>All-inclusive protection</strong> —{" "}
            {money(p.protection.allInclusive.dailyMinor)}/day; no excess for
            eligible damage claims
          </li>
        </ul>
        <p>
          You are responsible for damage not covered by insurance, including
          tyres, windscreen, roof, underbody, interior, and lost keys. Report
          all damage and accidents immediately to{" "}
          <a href={`mailto:${supportEmails.claims}`} className="text-brand underline">
            {supportEmails.claims}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Mileage">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Standard package: <strong>{p.includedMilesPerDay} miles</strong>{" "}
            included per hire day.
          </li>
          <li>
            Unlimited mileage option: {money(p.unlimitedMilesPerDayMinor)} per
            day (where selected).
          </li>
          <li>
            Excess mileage (if applicable): approximately{" "}
            <strong>{money(p.excessMileagePencePerMile)} per mile</strong> over
            your allowance.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Fuel policy">
        <p>
          The vehicle is supplied with fuel and must be returned with the same
          fuel level. If returned with less fuel, a refuelling charge applies at
          market rate plus an administration fee of approximately{" "}
          {money(p.refuelAdminFeeMinor)}. Misfuelling may incur charges up to{" "}
          {money(p.misfuelChargeMinor)} plus recovery costs.
        </p>
      </LegalSection>

      <LegalSection title="8. Late return">
        <p>
          Please contact us as soon as possible if you will be late. A grace
          period of {p.lateReturnGraceMinutes} minutes may apply. After that,
          late return charges of approximately {money(p.lateReturnPencePerHour)}{" "}
          per hour (or a full additional day&apos;s rental, whichever is
          greater) may apply. Failure to return the vehicle on time may be
          treated as a serious breach and reported to the police.
        </p>
      </LegalSection>

      <LegalSection title="9. Cleaning, smoking and pets">
        <p>
          Return the vehicle in a reasonably clean condition. Excessive cleaning
          charges may apply. Smoking in the vehicle is prohibited — charge
          approximately {money(p.smokingChargeMinor)}. Pet cleaning charges may
          apply (approximately {money(p.petCleaningChargeMinor)}).
        </p>
      </LegalSection>

      <LegalSection title="10. Fines, tolls and charges">
        <p>
          You are responsible for all parking fines, speeding tickets,
          congestion charges, ULEZ/LEZ charges, tolls, and other traffic
          offences incurred during the hire. We may pass these to you with an
          administration fee and charge your card or deduct from your deposit.
        </p>
      </LegalSection>

      <LegalSection title="11. Cancellation and refunds">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>More than 48 hours before pick-up:</strong>{" "}
            {p.cancellation.moreThan48h}
          </li>
          <li>
            <strong>24–48 hours before pick-up:</strong>{" "}
            {p.cancellation.between24And48h}
          </li>
          <li>
            <strong>Less than 24 hours before pick-up:</strong>{" "}
            {p.cancellation.lessThan24h}
          </li>
          <li>
            <strong>No-show:</strong> {p.cancellation.noShow}
          </li>
          <li>
            <strong>Failed licence or insurance checks:</strong> We may cancel
            the hire. Deposit handling depends on the reason and timing — we
            will explain at the time.
          </li>
          <li>
            <strong>If we cancel:</strong> Full refund of any amount paid online.
          </li>
        </ul>
        <p>
          Deposit refunds are processed within {p.depositRefundDays}. Account
          holders may cancel online when pick-up is more than 48 hours away via{" "}
          <Link href="/manage" className="text-brand underline">
            Manage bookings
          </Link>
          . Guests should contact us with their booking reference.
        </p>
      </LegalSection>

      <LegalSection title="12. Breakdown and accidents">
        <p>
          Contact us immediately in the event of a breakdown or accident. Do not
          admit liability. Obtain details of other parties and witnesses. For
          emergencies during an active rental, call us — 24/7 support is
          available for breakdown and roadside issues.
        </p>
      </LegalSection>

      <LegalSection title="13. Data protection">
        <p>
          We process personal data (including driving licence and identity
          information) in accordance with our{" "}
          <Link href="/privacy" className="text-brand underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="14. General">
        <p>
          These terms are governed by the laws of {companyConfig.jurisdiction}.
          If any provision is invalid, the remainder continues in effect. We may
          update these terms; the version in force at the time of your booking
          applies to that hire.
        </p>
        <p className="text-xs italic">
          Figures marked as estimates may be updated. Always refer to your
          booking confirmation and hire agreement for the amounts that apply to
          your rental.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
