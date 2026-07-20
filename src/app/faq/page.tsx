import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

type FaqItem = {
  q: string;
  a?: string;
  bullets?: string[];
};

const FAQS: FaqItem[] = [
  {
    q: "What do I need to hire a van?",
    a: "You'll need:",
    bullets: [
      "A valid UK driving licence",
      "Proof of address (dated within the last 3 months)",
      "A debit or credit card in the driver's name",
      "Any additional documents required for insurance verification",
    ],
  },
  {
    q: "Is insurance included?",
    a: "Yes, our vans are insured for eligible drivers. A standard insurance excess applies, and optional excess reduction may be available depending on your booking.",
  },
  {
    q: "Can someone else drive the van?",
    a: "Yes, additional drivers can be added to your booking, provided they meet our age, licence and insurance requirements. All additional drivers must be approved before driving the vehicle.",
  },
  {
    q: "What happens if the van breaks down?",
    a: "All of our vans come with breakdown assistance. If you experience a mechanical problem, contact our emergency number immediately and we'll arrange assistance as quickly as possible.",
  },
  {
    q: "What is your fuel policy?",
    a: "Your van will be supplied with fuel and should be returned with the same fuel level. If it's returned with less fuel, a refuelling charge may apply.",
  },
  {
    q: "Is there a mileage limit?",
    a: "Mileage allowances depend on the rental package you've booked. Any applicable limits will be confirmed before your rental begins.",
  },
  {
    q: "What happens if I return the van late?",
    a: "Please let us know as soon as possible if you're running late. Late returns may incur additional rental charges depending on the length of the delay.",
  },
  {
    q: "What happens if I damage the van?",
    a: "If the van is damaged during your rental, contact us immediately. We'll guide you through the next steps and assess the damage in accordance with your rental agreement and insurance policy.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Cancellation terms depend on how much notice is given before your booking. Please refer to our cancellation policy or contact us for assistance.",
  },
  {
    q: "Do you offer 24/7 support?",
    a: "Yes. If you experience an emergency or breakdown during your rental, our team is available to help you.",
  },
];

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
          Answers to common questions about van hire with vantura rentals.
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
