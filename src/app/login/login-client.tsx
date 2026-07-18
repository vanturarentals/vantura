"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account/bookings";
  const errorParam = searchParams.get("error");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(next.startsWith("/") ? next : "/account/bookings");
      }
    });
  }, [router, next]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        <h1 className="text-3xl font-bold text-brand">Login / Sign up</h1>
        <p className="mt-2 text-muted">
          Access seamless checkouts and easy trip management when you log in or
          create an account.
        </p>

        {errorParam && (
          <p className="mt-4 text-sm text-red-600">
            Sign-in failed. Please try again, or continue as a guest.
          </p>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-8 w-full rounded bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Continue
        </button>

        <div className="mt-8 rounded-md border border-border p-5">
          <h2 className="text-sm font-bold text-foreground">
            Prefer not to create an account?
          </h2>
          <p className="mt-1 text-sm text-muted">
            You can always book as a guest, or{" "}
            <Link href="/manage" className="font-semibold text-brand underline">
              look up a booking
            </Link>{" "}
            with your reference and email.
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 text-center text-sm font-semibold text-brand hover:underline"
        >
          ← Back to home
        </Link>
      </main>
      <Footer />
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
        nextPath={next.startsWith("/") ? next : "/account/bookings"}
      />
    </div>
  );
}
