import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

const PLACEHOLDER_FAQS = [
  {
    q: "What do I need to hire a van?",
    a: "A full UK driving licence, proof of address, and a debit/credit card in the driver’s name. Drivers must be 21 or over.",
  },
  {
    q: "What is the minimum driver age?",
    a: "Drivers must be 21 or over.",
  },
  {
    q: "Can I pick up and drop off at any time?",
    a: "Yes — pick-ups and returns are available 24/7, 7 days a week.",
  },
  {
    q: "What is your fuel and mileage policy?",
    a: "Placeholder — we’ll publish the full fuel and mileage policy here shortly.",
  },
];

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-bold text-brand">FAQ</h1>
        <p className="mt-2 text-muted">
          Answers to common questions. You can update these anytime.
        </p>

        <div className="mt-10 divide-y divide-border">
          {PLACEHOLDER_FAQS.map((item) => (
            <div key={item.q} className="py-5">
              <h2 className="text-lg font-semibold text-foreground">{item.q}</h2>
              <p className="mt-2 text-muted">{item.a}</p>
            </div>
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
