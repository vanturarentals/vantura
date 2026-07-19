import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="shrink-0">
          <span className="wordmark text-lg">
            vantura <span>rentals</span>
          </span>
        </Link>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted">
          <Link href="/contact" className="hover:text-brand">
            Contact Us
          </Link>
          <Link href="/faq" className="hover:text-brand">
            FAQ
          </Link>
          <Link href="/manage" className="hover:text-brand">
            Manage bookings
          </Link>
          <Link href="/login" className="hover:text-brand">
            Login / Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
