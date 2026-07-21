import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

interface Props {
  title: string;
  description?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  description,
  lastUpdated = "21 July 2026",
  children,
}: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Last updated: {lastUpdated}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-brand">{title}</h1>
        {description && <p className="mt-3 text-muted">{description}</p>}

        <div className="legal-prose panel mt-8 space-y-8 p-6 sm:p-8">{children}</div>

        <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-brand">
          <Link href="/terms" className="hover:underline">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="hover:underline">
            Cookie Policy
          </Link>
          <Link href="/promotions" className="hover:underline">
            Promotions
          </Link>
        </nav>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}
