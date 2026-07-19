"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthModal from "@/components/AuthModal";
import ProfileCompleteModal from "@/components/ProfileCompleteModal";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
];

interface HeaderProps {
  /** Transparent over a photo hero; solidifies after scroll. */
  variant?: "solid" | "transparent";
}

export default function Header({ variant = "solid" }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const overHero = variant === "transparent" && !scrolled;
  const linkClass = overHero
    ? "text-white/90 hover:text-white"
    : "text-foreground hover:text-brand";
  const mutedLinkClass = overHero
    ? "text-white/80 hover:text-white"
    : "text-muted hover:text-brand";

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

  useEffect(() => {
    if (variant !== "transparent") return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  async function refreshUser() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  }

  return (
    <>
      <header
        className={
          overHero
            ? "absolute inset-x-0 top-0 z-30 border-b border-transparent bg-transparent"
            : "sticky top-0 z-30 border-b border-border bg-white"
        }
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="shrink-0">
            <span className={`wordmark text-lg ${overHero ? "wordmark-on-dark" : ""}`}>
              vantura <span>rentals</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
            <Link href="/manage" className={linkClass}>
              Manage bookings
            </Link>
            {user ? (
              <button type="button" onClick={signOut} className={linkClass}>
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className={linkClass}
              >
                Log in
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <Link href="/manage" className={`text-sm font-medium ${mutedLinkClass}`}>
              Manage
            </Link>
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className={`text-sm font-medium ${mutedLinkClass}`}
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className={`text-sm font-medium ${mutedLinkClass}`}
              >
                Log in
              </button>
            )}
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex h-9 w-9 items-center justify-center rounded ${overHero ? "text-white" : "text-brand"}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-white px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium text-foreground">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-brand"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/manage"
                onClick={() => setMenuOpen(false)}
                className="hover:text-brand"
              >
                Manage bookings
              </Link>
            </nav>
          </div>
        )}
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        nextPath="/manage"
      />
      <ProfileCompleteModal user={user} onSaved={refreshUser} />
    </>
  );
}
