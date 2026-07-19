import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";

const TRUST = [
  {
    title: "Quality vans",
    body: "to get the job done",
    icon: "van" as const,
  },
  {
    title: "Fair fuel policy",
    body: "Full to full",
    icon: "fuel" as const,
  },
  {
    title: "Flexible hire",
    body: "Daily, weekly, weekend",
    icon: "clock" as const,
  },
  {
    title: "Trusted locally",
    body: "Rated excellent",
    icon: "pin" as const,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <section className="relative">
        <div className="relative h-[52vh] min-h-[360px] w-full overflow-hidden sm:h-[58vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-van-right.jpg"
            alt="White hire van on a London street"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-32 pt-20 sm:pb-36">
            <div className="max-w-2xl animate-fade-rise">
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
                Hire the right van, without the hassle.
              </h1>
              <p className="mt-4 max-w-xl text-lg italic text-white/90 sm:text-xl">
                Flexible van hire across the UK for moving, work and weekends.
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
    className: "mt-0.5 shrink-0 text-white/90",
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
