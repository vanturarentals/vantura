"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  function openAuth(mode: "login" | "signup") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-brand text-sm font-bold text-white">
              V
            </span>
            <span className="text-base font-bold tracking-tight text-brand">
              vantura <span className="font-medium">rentals</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-foreground md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-brand">
                {item.label}
              </Link>
            ))}
            <Link href="/manage" className="hover:text-brand">
              Manage bookings
            </Link>
            {user ? (
              <button type="button" onClick={signOut} className="hover:text-brand">
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="hover:text-brand"
              >
                Log in | Register
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/manage"
              className="text-sm font-medium text-muted hover:text-brand"
            >
              Manage
            </Link>
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="text-sm font-medium text-muted hover:text-brand"
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="text-sm font-medium text-muted hover:text-brand"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        nextPath="/manage"
      />
    </>
  );
}
