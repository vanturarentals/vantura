import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supportConfig } from "@/lib/support";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-bold text-brand">Contact Us</h1>
        <p className="mt-2 text-muted">
          Questions about a booking or hire? Reach out and we&apos;ll get back
          to you.
        </p>

        <div className="mt-10 space-y-6 rounded-md border border-border bg-surface p-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              Email
            </h2>
            <a
              href={`mailto:${supportConfig.email}`}
              className="mt-1 block text-lg font-semibold text-brand hover:underline"
            >
              {supportConfig.email}
            </a>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              Phone
            </h2>
            {supportConfig.phone ? (
              <a
                href={`tel:${supportConfig.phone.replace(/\s+/g, "")}`}
                className="mt-1 block text-lg font-semibold text-brand hover:underline"
              >
                {supportConfig.phoneDisplay || supportConfig.phone}
              </a>
            ) : (
              <p className="mt-1 text-lg font-semibold text-foreground">
                Coming soon — email us for guest cancellations
              </p>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              Hours
            </h2>
            <p className="mt-1 text-foreground">Support available 24/7</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
