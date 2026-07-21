import { NextRequest, NextResponse } from "next/server";
import {
  getBookingByReferenceAndEmail,
  issueGuestCancelCode,
} from "@/lib/bookings";
import { sendGuestCancelCodeEmail } from "@/lib/email";
import { canSelfCancelOnline } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { reference?: string; email?: string };
  try {
    body = (await request.json()) as { reference?: string; email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const reference = body.reference?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  if (!reference || !email) {
    return NextResponse.json(
      { error: "Reference and email are required." },
      { status: 400 },
    );
  }

  try {
    const booking = await getBookingByReferenceAndEmail(reference, email);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (booking.paymentStatus === "Cancelled") {
      return NextResponse.json(
        { error: "This booking is already cancelled." },
        { status: 400 },
      );
    }
    if (!canSelfCancelOnline(booking.startAt)) {
      return NextResponse.json(
        {
          error:
            "Online cancellation is only available when pick-up is at least 48 hours away.",
        },
        { status: 400 },
      );
    }

    const { code } = await issueGuestCancelCode(reference, email);
    await sendGuestCancelCodeEmail(booking, code);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send verification code.";
    console.error("[guest-cancel/send-code]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
