import Header from "@/components/Header";
import Link from "next/link";

const PLACEHOLDER_FAQS = [
  {
    q: "What do I need to hire a van?",
    a: "Placeholder answer — add your real requirements (licence, age, deposit) here.",
  },
  {
    q: "What is the minimum driver age?",
    a: "Drivers must be 21 or over. Placeholder — confirm your policy.",
  },
  {
    q: "Can I pick up and drop off at any time?",
    a: "Yes — pickups and drop-offs are available 24/7, 7 days a week.",
  },
  {
    q: "What is your fuel and mileage policy?",
    a: "Placeholder answer — describe fuel, mileage limits and any extra charges.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-32 pb-20">
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900">
          Frequently asked questions
        </h1>
        <p className="mt-2 text-zinc-500">
          Placeholder content — we&apos;ll fill these in properly later.
        </p>

        <div className="mt-10 divide-y divide-zinc-200">
          {PLACEHOLDER_FAQS.map((item) => (
            <div key={item.q} className="py-5">
              <h2 className="text-lg font-semibold text-zinc-900">{item.q}</h2>
              <p className="mt-2 text-zinc-600">{item.a}</p>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="mt-10 inline-block font-semibold text-[#ff5f00] hover:underline"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
