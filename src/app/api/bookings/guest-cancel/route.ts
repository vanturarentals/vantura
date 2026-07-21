import { NextRequest, NextResponse } from "next/server";
import { requestGuestBookingCancellation } from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";
import { sendBookingCancelledEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { reference?: string; email?: string; code?: string };
  try {
    body = (await request.json()) as {
      reference?: string;
      email?: string;
      code?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const reference = body.reference?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const code = body.code?.trim() ?? "";
  if (!reference || !email || !code) {
    return NextResponse.json(
      { error: "Reference, email, and verification code are required." },
      { status: 400 },
    );
  }

  try {
    const updated = await requestGuestBookingCancellation(reference, email, code);
    const van = updated.vanId ? await getVanById(updated.vanId) : null;
    await sendBookingCancelledEmail(updated, van?.name ?? "Your van");

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
    const status =
      message.includes("Invalid") ||
      message.includes("48 hours") ||
      message.includes("not found") ||
      message.includes("already cancelled")
        ? 400
        : 500;
    if (status === 500) console.error("[guest-cancel]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
