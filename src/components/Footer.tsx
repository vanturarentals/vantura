import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold text-brand">Big moves, made easy.</p>
          <p className="mt-1 text-sm text-muted">
            Premium van hire at affordable rates in London
          </p>
        </div>
        <div className="flex gap-5 text-sm font-medium text-muted">
          <Link href="/faq" className="hover:text-brand">
            Help
          </Link>
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
        </div>
      </div>
    </footer>
  );
}
