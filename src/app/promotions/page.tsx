import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import Link from "next/link";
import { companyConfig, firstBookingPromo } from "@/lib/company";

export const metadata = {
  title: "Promotions — Vantura Rentals",
  description: "Terms for Vantura Rentals promotional offers.",
};

export default function PromotionsPage() {
  const promo = firstBookingPromo;

  return (
    <LegalPageLayout
      title="Promotions"
      description="Terms and conditions for current promotional offers."
    >
      <LegalSection title="20% off your first booking">
        <p>
          <strong>Offer:</strong> {promo.discountPercent}% off the base van
          rental price on your first booking with {companyConfig.tradingName}.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Valid until:</strong> {promo.endDateLabel}
          </li>
          <li>
            <strong>Account required:</strong> You must be{" "}
            <Link href="/login" className="font-semibold text-brand underline">
              signed in
            </Link>{" "}
            to a registered {companyConfig.tradingName} account when you book.
            Guest checkout does not qualify for this promotion.
          </li>
          <li>
            <strong>How to claim:</strong> No code required. Sign in, complete
            your first booking, and the discount is automatically applied to the{" "}
            <em>base van rental</em> on the balance you pay in person at
            collection.
          </li>
          <li>
            <strong>What it covers:</strong> Base van rental only. Does not
            apply to the online reservation deposit, optional protection
            packages, mileage upgrades, additional drivers, extras, delivery
            charges, fuel, damage, fines, or any other fees.
          </li>
          <li>
            <strong>Eligibility:</strong> One use per registered account on
            your first completed hire only. Available on standard daily hires
            unless we state otherwise. We may withdraw or amend this offer at
            any time.
          </li>
          <li>
            <strong>Minimum hire:</strong> Standard minimum hire periods apply
            as shown at booking.
          </li>
          <li>
            <strong>Cannot be combined</strong> with other offers unless we agree
            in writing.
          </li>
        </ul>
        <p className="text-xs italic">
          We reserve the right to amend or withdraw promotions without notice.
          The version published on this page at the time of your booking applies.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
