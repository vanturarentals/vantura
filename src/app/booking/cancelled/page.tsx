import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CancelledPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-5 py-20 text-center">
        <h1 className="text-3xl font-bold text-brand">Checkout cancelled</h1>
        <p className="text-muted">
          No payment was taken. Your temporary hold will be released
          automatically.
        </p>
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
      </main>
      <Footer />
    </div>
  );
}
