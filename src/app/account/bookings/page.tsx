import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  claimBookingsForEmail,
  listBookingsForUser,
} from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { formatMoney } from "@/lib/pricing";
import { formatBookingReference } from "@/lib/booking-reference";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AccountBookingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <h1 className="text-3xl font-bold text-brand">My bookings</h1>
        <p className="mt-2 text-muted">
          Accounts are not configured yet. Add Supabase keys to enable login,
          or{" "}
          <Link href="/manage" className="font-semibold text-brand underline">
            look up a booking as a guest
          </Link>
          .
        </p>
      </Shell>
    );
  }

  const user = await getCurrentUser();
  if (!user?.email) {
    redirect("/login?next=/account/bookings");
  }

  await claimBookingsForEmail(user.id, user.email);
  const bookings = await listBookingsForUser({
    userId: user.id,
    email: user.email,
  });

  const rows = await Promise.all(
    bookings.map(async (b) => {
      const van = b.vanId ? await getVanById(b.vanId) : null;
      return { booking: b, vanName: van?.name ?? "Van" };
    }),
  );

  return (
    <Shell>
      <h1 className="text-3xl font-bold text-brand">My bookings</h1>
      <p className="mt-2 text-muted">
        Signed in as <span className="font-medium text-foreground">{user.email}</span>
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-muted">
          No bookings yet.{" "}
          <Link href="/" className="font-semibold text-brand underline">
            Search vans
          </Link>
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-md border border-border bg-white">
          {rows.map(({ booking, vanName }) => (
            <li key={booking.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-brand">
                    {booking.reference
                      ? formatBookingReference(booking.reference)
                      : booking.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">{vanName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(booking.startAt)} → {formatDate(booking.endAt)}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-foreground">
                    {formatMoney(booking.totalAmountMinor, booking.currency)}
                  </p>
                  <p className="mt-1 text-muted">{booking.paymentStatus}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">{children}</main>
      <Footer />
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}
