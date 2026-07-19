import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";

const TRUST = [
  {
    title: "Quality vans",
    body: "Well-maintained commercial vans ready for the job.",
    icon: "van" as const,
  },
  {
    title: "Fair fuel policy",
    body: "Clear fuel terms — no surprises at return.",
    icon: "fuel" as const,
  },
  {
    title: "Flexible hire",
    body: "Collect and return on your schedule, 24/7.",
    icon: "clock" as const,
  },
  {
    title: "Trusted locally",
    body: "London hire with support when you need it.",
    icon: "pin" as const,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header variant="transparent" />

      <section className="relative">
        <div className="relative min-h-[88vh] w-full overflow-hidden sm:min-h-[92vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-van-poster.jpg"
            alt="White hire van on a London street"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25" />

          <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-10 pt-28 sm:min-h-[92vh] sm:pb-14 sm:pt-32">
            <div className="max-w-2xl animate-fade-rise">
              <p className="wordmark wordmark-on-dark mb-4 text-2xl sm:text-3xl">
                vantura <span>rentals</span>
              </p>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Hire the right van, without the hassle.
              </h1>
              <p className="mt-3 max-w-lg text-base text-white/85 sm:text-lg">
                Premium van hire across London — clear rates, flexible pick-up,
                ready when you are.
              </p>
            </div>

            <div className="mt-8 w-full animate-fade-rise animate-delay-1">
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item, i) => (
            <div
              key={item.title}
              className={`flex flex-col gap-2 animate-fade-rise animate-delay-${i === 0 ? "1" : i === 1 ? "2" : "3"}`}
            >
              <TrustIcon kind={item.icon} />
              <h2 className="text-sm font-bold text-foreground">{item.title}</h2>
              <p className="text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TrustIcon({ kind }: { kind: "van" | "fuel" | "clock" | "pin" }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    className: "text-brand",
  } as const;

  if (kind === "fuel") {
    return (
      <svg {...common} aria-hidden>
        <path d="M3 22V8l7-5 7 5v14" />
        <path d="M14 22V12h4a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0V9l-3-3" />
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
