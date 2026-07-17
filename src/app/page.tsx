import SearchForm from "@/components/SearchForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col items-center justify-center gap-10 bg-gradient-to-b from-zinc-50 to-zinc-100 px-6 py-24 dark:from-black dark:to-zinc-950">
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-zinc-900">
            Van rental, made simple
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Rent a van, your way
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            Choose your pickup and drop-off, pick from our fleet, and pay
            securely. Your booking is confirmed the moment you pay.
          </p>
        </div>

        <SearchForm />
      </section>
    </main>
  );
}
