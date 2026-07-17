import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header />

      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-1 items-start overflow-hidden">
        {/* Cinematic van footage background */}
        <div className="absolute inset-0 bg-black">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-van-poster.jpg"
            className="h-full w-full object-cover"
          >
            <source src="/hero-van.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/70" />
        </div>

        {/* Floating search card */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-28 pb-16 sm:pt-32">
          <SearchForm />
        </div>
      </section>

      {/* Orange tagline band */}
      <section className="bg-[#ff5f00] px-6 py-14 text-center sm:py-16">
        <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-black sm:text-5xl md:text-6xl">
          Big moves
          <br />
          made easy.
        </h1>
        <p className="mt-5 text-base font-semibold text-black/80 sm:text-lg">
          Premium van hire at affordable rates in London
        </p>
      </section>
    </div>
  );
}
