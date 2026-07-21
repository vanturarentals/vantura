import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FAQS } from "@/lib/faq";

function FaqChevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-bold text-brand">FAQ</h1>
        <p className="mt-2 text-muted">
          Answers to common questions about van hire with Vantura Rentals. All
          prices include VAT. See our{" "}
          <Link href="/terms" className="font-medium text-brand underline">
            Terms &amp; Conditions
          </Link>{" "}
          for full details.
        </p>

        <div className="panel mt-10 divide-y divide-border overflow-hidden">
          {FAQS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden">
                <h2 className="text-lg font-semibold text-foreground">{item.q}</h2>
                <FaqChevron />
              </summary>
              <div className="border-t border-border px-5 pb-5 pt-4">
                {item.a && <p className="text-muted">{item.a}</p>}
                {item.bullets && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                    {item.bullets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))}
        </div>

        <Link
          href="/contact"
          className="mt-10 inline-block font-semibold text-brand hover:underline"
        >
          Still need help? Contact us →
        </Link>
      </main>
      <Footer />
    </div>
  );
}
