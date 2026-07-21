import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { companyConfig, legalEntityLine, supportEmails, vatLine } from "@/lib/company";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <BrandLogo className="h-10 w-auto" />
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {legalEntityLine()}
            </p>
            {companyConfig.tradingAddress !== "[Trading address]" ? (
              <p className="mt-2 text-xs text-muted">
                Trading address: {companyConfig.tradingAddress}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">{vatLine()}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-sm sm:grid-cols-3">
            <div>
              <p className="field-label uppercase tracking-wide">Company</p>
              <ul className="mt-2 space-y-2 font-medium text-muted">
                <li>
                  <Link href="/terms" className="hover:text-brand">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-brand">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-brand">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/promotions" className="hover:text-brand">
                    Promotions
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="field-label uppercase tracking-wide">Help</p>
              <ul className="mt-2 space-y-2 font-medium text-muted">
                <li>
                  <Link href="/faq" className="hover:text-brand">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/driver-requirements" className="hover:text-brand">
                    Driver requirements
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-brand">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/manage" className="hover:text-brand">
                    Manage bookings
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="field-label uppercase tracking-wide">Contact</p>
              <ul className="mt-2 space-y-2 text-sm text-muted">
                <li>
                  <a
                    href={`mailto:${supportEmails.bookings}`}
                    className="font-medium hover:text-brand"
                  >
                    {supportEmails.bookings}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${supportEmails.support}`}
                    className="font-medium hover:text-brand"
                  >
                    {supportEmails.support}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${supportEmails.claims}`}
                    className="font-medium hover:text-brand"
                  >
                    {supportEmails.claims}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-center text-xs text-muted">
          © {year} {companyConfig.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
