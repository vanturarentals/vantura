import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-brand text-sm font-bold text-white">
            V
          </span>
          <span className="text-base font-bold tracking-tight text-brand">
            vantura <span className="font-medium">rentals</span>
          </span>
        </Link>
        <div className="flex flex-wrap gap-5 text-sm font-medium text-muted">
          <Link href="/contact" className="hover:text-brand">
            Contact Us
          </Link>
          <Link href="/faq" className="hover:text-brand">
            FAQ
          </Link>
          <Link href="/login" className="hover:text-brand">
            Login / Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
