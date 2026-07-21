import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO_LOCATIONS } from "@/lib/seo-locations";

export const metadata: Metadata = {
  title: "Van hire locations — West London | Vantura Rentals",
  description:
    "Van hire across West London and surrounding areas. Southall, Ealing, Hounslow, Hayes, Uxbridge and more — book online with Vantura Rentals.",
};

export default function VanHireLocationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand">
          Van hire locations
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          We serve West London and nearby boroughs. Choose your area for local
          information, then search dates to see available vans.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SEO_LOCATIONS.map((location) => (
            <li key={location.slug}>
              <Link
                href={`/van-hire/${location.slug}`}
                className="panel block h-full p-5 transition-shadow hover:shadow-md"
              >
                <p className="font-bold text-foreground">{location.name}</p>
                <p className="mt-2 text-sm text-muted line-clamp-3">
                  {location.intro}
                </p>
                <span className="mt-4 inline-block text-sm font-semibold text-brand">
                  View {location.name} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
