import { NextRequest, NextResponse } from "next/server";
import { getBookingByReferenceAndEmail } from "@/lib/bookings";
import { getVanById } from "@/lib/inventory";

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
      return NextResponse.json(
        { error: "No booking found for that reference and email." },
        { status: 404 },
      );
    }
    const van = booking.vanId ? await getVanById(booking.vanId) : null;
    return NextResponse.json({
      booking: {
        reference: booking.reference,
        vanName: van?.name ?? "Van",
        startAt: booking.startAt,
        endAt: booking.endAt,
        paymentStatus: booking.paymentStatus,
        totalAmountMinor: booking.totalAmountMinor,
        currency: booking.currency,
        customerName: booking.customerName,
        pickupLocation: booking.pickupLocation,
        dropoffLocation: booking.dropoffLocation,
      },
    });
  } catch (error) {
    console.error("[bookings/lookup]", error);
    return NextResponse.json(
      { error: "Could not look up booking." },
      { status: 500 },
    );
  }
}
