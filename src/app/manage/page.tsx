import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuestManagePanel from "@/components/GuestManagePanel";
import UnverifiedAccountPanel from "@/components/UnverifiedAccountPanel";
import ManageBookingsView from "@/components/ManageBookingsView";
import {
  claimBookingsForEmail,
  listBookingsForUser,
} from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isEmailVerified } from "@/lib/user-profile";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main
        className={`mx-auto w-full flex-1 px-5 py-12 ${
          user?.email && isEmailVerified(user) ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        {user?.email && !isEmailVerified(user) ? (
          <UnverifiedAccountPanel email={user.email} />
        ) : user?.email ? (
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
      return {
        booking: b,
        vanName: van?.name ?? "Van",
        imageUrl: van?.imageUrl ?? null,
      };
    }),
  );

  return (
    <Suspense fallback={<p className="text-muted">Loading your bookings…</p>}>
      <ManageBookingsView email={email} rows={rows} />
    </Suspense>
  );
}
