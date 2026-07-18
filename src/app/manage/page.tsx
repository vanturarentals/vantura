import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import GuestManagePanel from "@/components/GuestManagePanel";
import {
  claimBookingsForEmail,
  listBookingsForUser,
} from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { formatMoney } from "@/lib/pricing";
import { formatBookingReference } from "@/lib/booking-reference";
import { canSelfCancelOnline } from "@/lib/support";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const user =
    isSupabaseConfigured() ? await getCurrentUser() : null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        {user?.email ? (
          <SignedInBookings userId={user.id} email={user.email} />
        ) : (
          <GuestManagePanel />
        )}
      </main>
      <Footer />
    </div>
  );
}

async function SignedInBookings({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  await claimBookingsForEmail(userId, email);
  const bookings = await listBookingsForUser({ userId, email });
  const rows = await Promise.all(
    bookings.map(async (b) => {
      const van = b.vanId ? await getVanById(b.vanId) : null;
      return { booking: b, vanName: van?.name ?? "Van" };
    }),
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-brand">Manage bookings</h1>
          <p className="mt-2 text-muted">
            Signed in as{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-brand hover:underline"
        >
          Book another van →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-muted">
          No bookings yet.{" "}
          <Link href="/" className="font-semibold text-brand underline">
            Search vans
          </Link>
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-md border border-border bg-white">
          {rows.map(({ booking, vanName }) => {
            const cancellable =
              booking.paymentStatus !== "Cancelled" &&
              canSelfCancelOnline(booking.startAt);
            return (
              <li key={booking.id}>
                <Link
                  href={`/manage/${booking.id}`}
                  className="block p-5 transition-colors hover:bg-surface"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-brand">
                        {booking.reference
                          ? formatBookingReference(booking.reference)
                          : booking.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {vanName}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(booking.startAt)} →{" "}
                        {formatDate(booking.endAt)}
                      </p>
                      {cancellable && (
                        <p className="mt-2 text-xs font-medium text-brand">
                          Online cancel available
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-foreground">
                        {formatMoney(
                          booking.totalAmountMinor,
                          booking.currency,
                        )}
                      </p>
                      <p className="mt-1 text-muted">{booking.paymentStatus}</p>
                      <p className="mt-3 text-xs font-semibold text-brand">
                        View details →
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
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
