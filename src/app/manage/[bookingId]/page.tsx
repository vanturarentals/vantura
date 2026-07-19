import { notFound, redirect } from "next/navigation";
import {
  getBookingById,
  userOwnsBooking,
} from "@/lib/bookings";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isEmailVerified } from "@/lib/user-profile";

export const dynamic = "force-dynamic";

/** Deep links land on the split manage view with this booking selected. */
export default async function ManageBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  if (!isSupabaseConfigured()) {
    redirect("/manage");
  }

  const user = await getCurrentUser();
  if (!user?.email) {
    redirect(`/login?next=/manage/${bookingId}`);
  }
  if (!isEmailVerified(user)) {
    redirect("/manage");
  }

  const booking = await getBookingById(bookingId);
  if (!booking || !userOwnsBooking(booking, user)) {
    notFound();
  }

  redirect(`/manage?booking=${encodeURIComponent(bookingId)}`);
}
