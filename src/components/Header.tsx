"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthModal from "@/components/AuthModal";
import BrandLogo from "@/components/BrandLogo";
import ProfileCompleteModal from "@/components/ProfileCompleteModal";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

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
    if (!accountOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!accountRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    setAccountOpen(false);
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

  const initial =
    user?.user_metadata?.first_name?.[0] ||
    user?.email?.[0]?.toUpperCase() ||
    null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-[5.5rem] max-w-6xl items-center justify-between gap-4 pl-3 pr-5 sm:pl-4 sm:pr-5">
          <BrandLogo priority className="h-12 w-auto sm:h-14" />

          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-7 text-sm font-semibold text-brand md:flex">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-brand-hover">
                  {item.label}
                </Link>
              ))}
              <Link href="/manage" className="hover:text-brand-hover">
                Manage bookings
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  aria-label={user ? "Account menu" : "Log in"}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  onClick={() => setAccountOpen((o) => !o)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    user
                      ? "border-brand bg-brand text-sm font-bold text-white hover:bg-brand-hover"
                      : "border-brand bg-brand-muted text-brand hover:bg-brand hover:text-white"
                  }`}
                >
                  {user && initial ? (
                    <span aria-hidden>{initial}</span>
                  ) : (
                    <ProfileIcon />
                  )}
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="panel absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden py-1 shadow-sm"
                  >
                    {user ? (
                      <>
                        <p className="truncate border-b border-border px-3 py-2 text-xs text-muted">
                          {user.email}
                        </p>
                        <Link
                          href="/manage"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
                        >
                          Manage bookings
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={signOut}
                          className="block w-full px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-surface"
                        >
                          Log out
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountOpen(false);
                          setAuthOpen(true);
                        }}
                        className="block w-full px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-surface"
                      >
                        Log in
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded text-brand md:hidden"
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
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-white px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm font-semibold text-brand">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-brand-hover"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/manage"
                onClick={() => setMenuOpen(false)}
                className="hover:text-brand-hover"
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

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 19.5c1.6-3 4-4.5 6.5-4.5s4.9 1.5 6.5 4.5" />
    </svg>
  );
}
