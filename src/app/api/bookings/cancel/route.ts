import { NextRequest, NextResponse } from "next/server";
import {
  getBookingById,
  requestBookingCancellation,
  userOwnsBooking,
} from "@/lib/bookings";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.email) {
    return NextResponse.json(
      { error: "Sign in required to cancel online." },
      { status: 401 },
    );
  }

  let body: { bookingId?: string };
  try {
    body = (await request.json()) as { bookingId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const bookingId = body.bookingId?.trim();
  if (!bookingId) {
    return NextResponse.json({ error: "Missing booking id." }, { status: 400 });
  }

  try {
    const booking = await getBookingById(bookingId);
    if (!booking || !userOwnsBooking(booking, user)) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const updated = await requestBookingCancellation(bookingId);
    return NextResponse.json({
      ok: true,
      booking: {
        id: updated.id,
        paymentStatus: updated.paymentStatus,
        refundStatus: updated.refundStatus,
        cancelRequestedAt: updated.cancelRequestedAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not cancel booking.";
    const status = message.includes("48 hours") ? 400 : 500;
    if (status === 500) console.error("[bookings/cancel]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
