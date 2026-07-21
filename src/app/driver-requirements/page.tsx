import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { companyConfig, hirePolicy } from "@/lib/company";
import { formatMoney } from "@/lib/pricing";

export const metadata = {
  title: "Driver requirements — Vantura Rentals",
  description: "Who can drive a Vantura hire van and what documents you need.",
};

export default function DriverRequirementsPage() {
  const p = hirePolicy;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-bold text-brand">Driver requirements</h1>
        <p className="mt-2 text-muted">
          Make sure you meet these requirements before booking. Full details are in
          our{" "}
          <Link href="/terms" className="font-medium text-brand underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>

        <div className="panel mt-8 space-y-8 p-6 sm:p-8">
          <section>
            <h2 className="text-lg font-bold text-foreground">Age &amp; licence</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>
                Minimum age {p.minDriverAge}, maximum {p.maxDriverAge} (subject
                to insurer approval).
              </li>
              <li>
                Full valid UK photocard driving licence held for at least{" "}
                {p.minLicenceYears} year.
              </li>
              <li>
                Category B (or equivalent) required. Other categories must be
                declared at booking.
              </li>
              <li>
                Drivers from age {p.minDriverAge} may be accepted subject to
                licence checks, insurer approval, and eligibility requirements.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">
              Points, convictions &amp; insurance
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>
                You must declare all driving convictions in the last 5 years and
                any accidents or insurance claims.
              </li>
              <li>
                Certain serious convictions may mean we cannot hire to you — we
                will confirm after checks.
              </li>
              <li>
                You must not have been refused motor insurance unless declared and
                approved in advance.
              </li>
              <li>
                You must disclose any medical conditions affecting your ability to
                drive.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">
              Documents &amp; payment
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>
                Driving licence (photo card) and proof of address (dated within 3
                months).
              </li>
              <li>
                We may request a DVLA share code for online licence verification.
              </li>
              <li>
                Non-UK licences: contact us before booking — additional checks may
                apply.
              </li>
              <li>
                Debit or credit card in the main driver&apos;s name for deposit
                and balance payment.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">At collection</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>Collect from {companyConfig.collectionArea}.</li>
              <li>
                Reservation deposit: {formatMoney(p.depositMinor, "gbp")}{" "}
                (paid online).
              </li>
              <li>
                Basic insurance excess from{" "}
                {formatMoney(p.protection.basic.excessMinor, "gbp")} — optional
                excess reduction available at booking.
              </li>
              <li>{p.includedMilesPerDay} miles per day included (standard package).</li>
            </ul>
          </section>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block font-semibold text-brand hover:underline"
        >
          ← Search available vans
        </Link>
      </main>
      <Footer />
    </div>
  );
}
