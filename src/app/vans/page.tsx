import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VanResults from "@/components/VanResults";

export default function VansPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
        <h1 className="mb-6 text-2xl font-bold text-brand">Available vans</h1>
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <VanResults />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
