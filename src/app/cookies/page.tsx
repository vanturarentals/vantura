import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/LegalPageLayout";
import { companyConfig, supportEmails } from "@/lib/company";

export const metadata = {
  title: "Cookie Policy — Vantura Rentals",
  description: "How Vantura Rentals uses cookies on this website.",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="This policy explains what cookies are, how we use them, and how you can control your preferences."
    >
      <LegalSection title="1. What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help the site work properly and can remember preferences.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use cookies">
        <p>
          <strong>Essential cookies</strong> — required for the website to
          function. These include session and authentication cookies (e.g. when
          you sign in), security cookies, and cookies needed to complete a
          booking. You cannot opt out of these if you want to use the site.
        </p>
        <p>
          <strong>Analytics cookies</strong> — optional. If you accept all
          cookies, we may use analytics tools to understand how visitors use the
          site (e.g. which pages are popular). This helps us improve the service.
          We only load these if you choose &quot;Accept all&quot; on the cookie
          banner.
        </p>
      </LegalSection>

      <LegalSection title="3. Managing your preferences">
        <p>
          When you first visit our site, a banner lets you <strong>accept all</strong>,{" "}
          <strong>reject non-essential</strong>, or <strong>manage</strong>{" "}
          cookies. Your choice is stored in your browser. You can change your
          mind by clearing site data or contacting us.
        </p>
        <p>
          You can also control cookies through your browser settings. Blocking
          all cookies may prevent some features (such as signing in or
          completing checkout) from working.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-party cookies">
        <p>
          Stripe (payment processing) may set cookies when you enter card
          details. These are necessary to complete payment securely. See{" "}
          <a
            href="https://stripe.com/gb/privacy"
            className="text-brand underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stripe&apos;s privacy policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="5. More information">
        <p>
          For how we use personal data, see our{" "}
          <Link href="/privacy" className="text-brand underline">
            Privacy Policy
          </Link>
          . Questions:{" "}
          <a href={`mailto:${supportEmails.support}`} className="text-brand underline">
            {supportEmails.support}
          </a>
          .
        </p>
        <p className="text-xs">
          {companyConfig.legalName} — {companyConfig.tradingName}
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
