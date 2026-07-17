import Link from "next/link";

export default function CancelledPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-3xl dark:bg-zinc-800">
        🕓
      </div>
      <h1 className="text-3xl font-bold">Checkout cancelled</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        No payment was taken and your van hasn&apos;t been booked. Your temporary
        hold will be released automatically.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Start over
      </Link>
    </main>
  );
}
