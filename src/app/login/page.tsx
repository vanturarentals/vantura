import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-3xl font-bold text-brand">Login / Sign up</h1>
        <p className="mt-2 text-muted">
          Account access is coming soon. You&apos;ll be able to manage bookings
          and save driver details here.
        </p>

        <div className="mt-8 space-y-3 rounded-md border border-border bg-surface p-6">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded bg-brand/40 px-5 py-3 text-sm font-semibold text-white"
          >
            Log in — coming soon
          </button>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded border border-border bg-white px-5 py-3 text-sm font-semibold text-muted"
          >
            Create account — coming soon
          </button>
        </div>

        <Link
          href="/"
          className="mt-8 text-center text-sm font-semibold text-brand hover:underline"
        >
          ← Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
