import Link from "next/link";

const NAV = [
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/login", label: "Login / Sign up" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-brand text-sm font-bold text-white">
            V
          </span>
          <span className="text-base font-bold tracking-tight text-brand">
            vantura <span className="font-medium">rentals</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-foreground md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="text-sm font-medium text-muted hover:text-brand md:hidden"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
