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
            src="/hero-van-poster.jpg"
            alt="White hire van on a London street"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-5 pb-28 pt-20 sm:pb-32">
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Space to move your world.
            </h1>
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
