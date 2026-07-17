import { Suspense } from "react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import VanResults from "@/components/VanResults";

type SearchParams = Promise<{
  location?: string;
  pickupAt?: string;
  dropoffAt?: string;
}>;

export default async function VansPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { location = "", pickupAt = "", dropoffAt = "" } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-zinc-500 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Available vans</h1>
        <span className="w-12" />
      </div>

      <SearchForm defaults={{ location, pickupAt, dropoffAt }} />

      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <VanResults />
      </Suspense>
    </main>
  );
}
