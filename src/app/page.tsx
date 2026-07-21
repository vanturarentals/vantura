import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import { companyConfig, firstBookingPromo } from "@/lib/company";
import { vanPricingSummary } from "@/lib/van-catalog";

const TRUST = [
  {
    title: "Quality vans",
    body: "Well-maintained fleet for work and moves",
    icon: "van" as const,
  },
  {
    title: "Clear pricing",
    body: "See your full breakdown before you pay",
    icon: "tag" as const,
  },
  {
    title: "Flexible hire",
    body: "Book online, collect when it suits you",
    icon: "clock" as const,
  },
  {
    title: "London-based support",
    body: "Friendly team, 9 am–5 pm weekdays",
    icon: "pin" as const,
  },
];

export default function Home() {
  const promo = firstBookingPromo;
  const pricing = vanPricingSummary("gbp");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <div className="bg-brand px-5 py-2.5 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold tracking-wide text-white">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="shrink-0"
          >
            <path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0L3 15V4h11l6.6 6.6a2 2 0 0 1 0 2.8z" />
            <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
          </svg>
          {promo.discountPercent}% off your first booking when signed in — no code needed
          <Link
            href="/promotions"
            className="underline decoration-white/50 underline-offset-2 hover:decoration-white"
          >
            Terms
          </Link>
          <span className="text-white/70">· ends {promo.endDateLabel}</span>
        </p>
      </div>

      <section className="relative">
        <div className="relative h-[48vh] min-h-[380px] w-full overflow-hidden sm:h-[54vh] sm:min-h-[440px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-van-branded.jpg"
            alt="White hire van on a residential UK street"
            className="h-full w-full object-cover object-[center_42%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-32 pt-20 sm:pb-36">
            <div className="max-w-2xl animate-fade-rise">
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
                Driven to deliver.
              </h1>
              <p className="mt-4 max-w-xl text-lg font-medium text-white/90 sm:text-xl">
                Collect from {companyConfig.collectionArea} and drive anywhere in
                mainland Great Britain.
              </p>
              <p className="mt-2 text-sm font-medium text-white/75">
                All prices include VAT · {companyConfig.tradingName}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-5 pb-10 animate-fade-rise animate-delay-1">
          <SearchForm />
        </div>
      </section>

      <section className="bg-white px-5 pb-10 pt-2">
        <div className="mx-auto max-w-6xl rounded-3xl bg-brand px-6 py-10 sm:px-8 sm:py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {TRUST.map((item, i) => (
              <div
                key={item.title}
                className={`flex items-start gap-3 animate-fade-rise animate-delay-${i === 0 ? "1" : i === 1 ? "2" : "3"}`}
              >
                <TrustIcon kind={item.icon} />
                <div>
                  <h2 className="text-sm font-bold text-white">{item.title}</h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/75">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-white px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">
            Transparent pricing
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted">
            All prices include VAT. Pay a {pricing.deposit} deposit online — balance
            due at collection from {companyConfig.collectionArea}.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <PriceTile label="From" value={`${pricing.dailyFrom} / day`} />
            <PriceTile label="Deposit" value={pricing.deposit} />
            <PriceTile label="Excess (Basic)" value={pricing.excessBasic} />
            <PriceTile
              label="Mileage"
              value={`${pricing.milesIncluded} miles/day`}
            />
          </dl>
          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/driver-requirements" className="font-semibold text-brand underline">
              Driver requirements
            </Link>
            {" · "}
            <Link href="/terms" className="font-semibold text-brand underline">
              Full terms
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PriceTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4 text-center">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-base font-bold text-brand">{value}</dd>
    </div>
  );
}

function TrustIcon({ kind }: { kind: "van" | "tag" | "clock" | "pin" }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    className: "mt-0.5 shrink-0 text-white/90",
  } as const;

  if (kind === "tag") {
    return (
      <svg {...common} aria-hidden>
        <path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0L3 15V4h11l6.6 6.6a2 2 0 0 1 0 2.8z" />
        <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === "clock") {
    return (
      <svg {...common} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (kind === "pin") {
    return (
      <svg {...common} aria-hidden>
        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <path d="M3 14h13l3-4h2v8h-2" />
      <path d="M3 14V9h10v5" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
    </svg>
  );
}
