import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VanResults from "@/components/VanResults";

export default function VansPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:py-10">
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <VanResults />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
