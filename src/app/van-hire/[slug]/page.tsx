import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import {
  allSeoLocationSlugs,
  getSeoLocation,
} from "@/lib/seo-locations";
import { hirePolicy } from "@/lib/company";
import { vanPricingSummary } from "@/lib/van-catalog";
import { excessMileageLabel } from "@/lib/mileage";
import { formatMoney } from "@/lib/pricing";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allSeoLocationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) return {};
  return {
    title: `${location.title} | Vantura Rentals`,
    description: location.metaDescription,
  };
}

export default async function VanHireLocationPage({ params }: PageProps) {
  const { slug } = await params;
  const location = getSeoLocation(slug);
  if (!location) notFound();

  const pricing = vanPricingSummary("gbp");
  const p = hirePolicy;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main>
        <section className="bg-brand px-5 py-12 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Van hire · {location.name}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {location.headline}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/90">{location.intro}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6 text-muted leading-relaxed">
              {location.paragraphs.map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}

              <div className="panel bg-surface p-5">
                <h2 className="text-lg font-bold text-foreground">
                  Why hire with Vantura
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {location.highlights.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-brand" aria-hidden>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-sm">
                <p className="font-semibold text-foreground">Also serving</p>
                <p className="mt-2 flex flex-wrap gap-2">
                  {location.nearbyAreas.map((area) => {
                    const slugMatch = getSeoLocation(
                      area.toLowerCase().replace(/\s+/g, "-"),
                    );
                    if (slugMatch && slugMatch.slug !== location.slug) {
                      return (
                        <Link
                          key={area}
                          href={`/van-hire/${slugMatch.slug}`}
                          className="rounded-full border border-border px-3 py-1 font-medium text-brand hover:bg-surface"
                        >
                          {area}
                        </Link>
                      );
                    }
                    return (
                      <span
                        key={area}
                        className="rounded-full border border-border px-3 py-1 text-muted"
                      >
                        {area}
                      </span>
                    );
                  })}
                </p>
              </div>

              <p className="text-sm">
                <Link href="/van-hire" className="font-semibold text-brand underline">
                  All van hire locations
                </Link>
                {" · "}
                <Link href="/faq" className="font-semibold text-brand underline">
                  FAQ
                </Link>
                {" · "}
                <Link
                  href="/driver-requirements"
                  className="font-semibold text-brand underline"
                >
                  Driver requirements
                </Link>
              </p>
            </div>

            <aside className="space-y-6">
              <div className="panel p-5">
                <h2 className="text-lg font-bold text-brand">Check availability</h2>
                <p className="mt-2 text-sm text-muted">
                  Search dates to see vans available for collection.
                </p>
                <div className="mt-4">
                  <SearchForm variant="inline" />
                </div>
              </div>

              <div className="panel bg-surface p-5 text-sm">
                <h2 className="font-bold text-foreground">Typical pricing</h2>
                <dl className="mt-3 space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">From</dt>
                    <dd className="font-semibold">{pricing.dailyFrom}/day inc. VAT</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Deposit</dt>
                    <dd className="font-semibold">
                      {formatMoney(p.depositMinor, "gbp")} online
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Mileage</dt>
                    <dd className="text-right font-medium">
                      {p.includedMilesPerDay} miles/day included
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Excess mileage</dt>
                    <dd className="font-semibold">{excessMileageLabel("gbp")}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
