import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-white"
        >
          VANTURA<span className="text-[#ff5f00]">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold text-white">
          <Link href="/faq" className="transition-colors hover:text-[#ff5f00]">
            FAQ
          </Link>
        </nav>
      </div>
    </header>
  );
}
