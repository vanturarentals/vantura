import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";

const TRUST = [
  { title: "Wide range of vans", body: "From compact to Luton — the right size for every job." },
  { title: "Flexible pick-up", body: "Collect and return 24/7, seven days a week." },
  { title: "Simple & transparent", body: "Clear daily rates. No surprises at the counter." },
  { title: "Support 24/7", body: "Help whenever you need it during your hire." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <section className="relative">
        <div className="relative h-[52vh] min-h-[360px] w-full overflow-hidden sm:h-[58vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-coastal.jpg"
            alt="Van on the road"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-28 pt-20 sm:pb-32">
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Space to move your world.
            </h1>
            <p className="mt-3 max-w-md text-base text-white/85 sm:text-lg">
              Premium van hire at affordable rates in London.
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-5 pb-10">
          <SearchForm />
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand">
                <TrustIcon />
              </div>
              <h2 className="text-sm font-bold text-foreground">{item.title}</h2>
              <p className="text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="locations" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-bold text-brand">Locations</h2>
        <p className="mt-2 max-w-xl text-muted">
          Serving London and the surrounding area. Tell us where you want to
          pick up — we&apos;ll confirm your depot at booking.
        </p>
      </section>

      <section id="business" className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="text-2xl font-bold text-brand">Business</h2>
          <p className="mt-2 max-w-xl text-muted">
            Need vans for your team? Get in touch for flexible business hire —
            coming soon.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TrustIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
