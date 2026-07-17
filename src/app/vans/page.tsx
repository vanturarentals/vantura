import { Suspense } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import VanResults from "@/components/VanResults";

type SearchParams = Promise<{
  pickupAt?: string;
  dropoffAt?: string;
}>;

export default async function VansPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { pickupAt = "", dropoffAt = "" } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pt-28 pb-14">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 hover:underline"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Available vans
          </h1>
          <span className="w-12" />
        </div>

        <SearchForm defaults={{ pickupAt, dropoffAt }} />

        <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
          <VanResults />
        </Suspense>
      </main>
    </div>
  );
}
