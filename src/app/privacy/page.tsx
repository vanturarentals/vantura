import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import { companyConfig, supportEmails } from "@/lib/company";

export const metadata = {
  title: "Privacy Policy — Vantura Rentals",
  description: "How Vantura Rentals Ltd collects and uses your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description={`${companyConfig.legalName} ("we", "us") explains how we collect, use, and protect your personal information when you use our website and hire a van.`}
    >
      <LegalSection title="1. Who we are">
        <p>
          Data controller: <strong>{companyConfig.legalName}</strong> (trading as{" "}
          {companyConfig.tradingName}), company number {companyConfig.companyNumber},
          registered office {companyConfig.registeredOffice}.
        </p>
        <p>
          Privacy enquiries:{" "}
          <a href={`mailto:${supportEmails.support}`} className="text-brand underline">
            {supportEmails.support}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Identity and contact details (name, email, phone, address)</li>
          <li>Driving licence information and photographs</li>
          <li>Proof of address and other documents for insurance verification</li>
          <li>Booking details (dates, vehicle, extras, protection, mileage)</li>
          <li>Payment information (processed by Stripe — we do not store full card numbers)</li>
          <li>Account credentials if you create an online account</li>
          <li>Communications with us (email, phone, contact form, WhatsApp)</li>
          <li>Technical data (IP address, browser type, cookies — see our Cookie Policy)</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Why we use your data">
        <ul className="list-disc space-y-2 pl-5">
          <li>To process and administer your van hire booking</li>
          <li>To verify driver eligibility and insurance requirements</li>
          <li>To take payments and manage deposits and refunds</li>
          <li>To communicate about your booking (confirmations, reminders, changes)</li>
          <li>To handle accidents, damage claims, fines, and disputes</li>
          <li>To comply with legal obligations (tax, insurance, road traffic law)</li>
          <li>To improve our website and services (with your consent where required)</li>
        </ul>
        <p>
          Legal bases under UK GDPR: contract performance, legal obligation,
          legitimate interests (e.g. fraud prevention, business records), and
          consent where applicable (e.g. marketing, non-essential cookies).
        </p>
      </LegalSection>

      <LegalSection title="4. Who we share data with">
        <ul className="list-disc space-y-2 pl-5">
          <li>Payment processor (Stripe)</li>
          <li>Email and communication providers</li>
          <li>Insurance and breakdown assistance partners</li>
          <li>IT and booking systems (including Airtable for booking records)</li>
          <li>Professional advisers (lawyers, accountants) where necessary</li>
          <li>Police, insurers, or regulators when required by law or after an incident</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection title="5. How long we keep data">
        <p>
          We keep booking and hire records for as long as needed to administer
          the hire, handle claims, and meet legal and insurance requirements —
          typically up to 7 years after the hire ends. Licence images and
          identity documents are retained for the hire period and a reasonable
          period afterwards for dispute resolution, then securely deleted unless
          we must keep them longer by law.
        </p>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <p>You have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request erasure in certain circumstances</li>
          <li>Restrict or object to processing in certain circumstances</li>
          <li>Data portability where applicable</li>
          <li>Withdraw consent where processing is based on consent</li>
          <li>Lodge a complaint with the ICO (ico.org.uk)</li>
        </ul>
        <p>
          To exercise your rights, email{" "}
          <a href={`mailto:${supportEmails.support}`} className="text-brand underline">
            {supportEmails.support}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use appropriate technical and organisational measures to protect
          your data, including encrypted connections (HTTPS), secure payment
          processing, and access controls. No system is 100% secure — please use
          strong passwords for your account.
        </p>
      </LegalSection>

      <LegalSection title="8. International transfers">
        <p>
          Some service providers may process data outside the UK. Where this
          happens, we ensure appropriate safeguards are in place (e.g. UK
          adequacy decisions or standard contractual clauses).
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          See our{" "}
          <Link href="/cookies" className="text-brand underline">
            Cookie Policy
          </Link>{" "}
          for details on cookies and how to manage your preferences.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update this policy from time to time. The date at the top of
          this page shows when it was last revised.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
