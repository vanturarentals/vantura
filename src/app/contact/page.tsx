import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { supportConfig } from "@/lib/support";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUserProfile } from "@/lib/user-profile";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  const profile = user ? getUserProfile(user) : null;
  const phoneHref = supportConfig.phone.replace(/\s+/g, "");
  const phoneLabel = supportConfig.phoneDisplay || supportConfig.phone;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-bold text-brand">Contact Us</h1>
        <p className="mt-2 text-muted">
          Questions about a booking or hire? Send us a message and we&apos;ll
          get back to you.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-[1fr_220px]">
          <ContactForm
            lockedEmail={user?.email ?? null}
            defaultName={
              profile
                ? [profile.firstName, profile.lastName]
                    .filter(Boolean)
                    .join(" ") || null
                : null
            }
          />

          <aside className="panel-aside h-fit space-y-6 p-5">
            <div>
              <h2 className="field-label uppercase tracking-wide">Email</h2>
              <a
                href={`mailto:${supportConfig.email}`}
                className="mt-1 block text-base font-semibold text-brand hover:underline"
              >
                {supportConfig.email}
              </a>
            </div>
            <div>
              <h2 className="field-label uppercase tracking-wide">Phone</h2>
              <a
                href={`tel:${phoneHref}`}
                className="mt-1 block text-base font-semibold text-brand hover:underline"
              >
                {phoneLabel}
              </a>
            </div>
            <div>
              <h2 className="field-label uppercase tracking-wide">Hours</h2>
              <p className="mt-1 text-sm text-foreground">
                Support available 24/7
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
