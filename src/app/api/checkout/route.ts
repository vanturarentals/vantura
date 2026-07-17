import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, stripeConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { getVanById, isVanAvailable } from "@/lib/inventory";
import { attachStripeSession, createPendingBooking } from "@/lib/bookings";
import { computeTotalMinor, isValidRange } from "@/lib/pricing";
import type { CheckoutRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    vanId,
    pickupLocation,
    dropoffLocation,
    startAt,
    endAt,
    customerName,
    email,
  } = body;

  // Validate everything server-side — never trust the client.
  if (!vanId || !startAt || !endAt || !customerName || !email) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!isValidRange(startAt, endAt)) {
    return NextResponse.json({ error: "Invalid rental dates." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Normalise to ISO 8601 for Airtable's dateTime fields.
  const startIso = new Date(startAt).toISOString();
  const endIso = new Date(endAt).toISOString();

  try {
    const van = await getVanById(vanId);
    if (!van || !van.bookable) {
      return NextResponse.json({ error: "Van not available." }, { status: 404 });
    }

    // Re-check availability at booking time to reduce double-booking risk.
    if (!(await isVanAvailable(vanId, startIso, endIso))) {
      return NextResponse.json(
        { error: "Sorry, this van was just booked for those dates." },
        { status: 409 },
      );
    }

    const totalMinor = computeTotalMinor(van.dailyRateMinor, startIso, endIso);
    const currency = stripeConfig.currency;

    // Create a pending hold first, so the van is reserved during checkout.
    const booking = await createPendingBooking({
      vanId: van.id,
      customerName,
      email,
      pickupLocation: pickupLocation ?? "",
      dropoffLocation: dropoffLocation ?? "",
      startAt: startIso,
      endAt: endIso,
      totalAmountMinor: totalMinor,
      currency,
    });

    const appUrl = getAppUrl();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // NOTE: payment_method_types intentionally omitted to enable dynamic
      // payment methods (configured in the Stripe Dashboard).
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: totalMinor,
            product_data: {
              name: `${van.name} rental`,
              description: `${pickupLocation || "Pickup"} → ${dropoffLocation || "Drop-off"}`,
            },
          },
        },
      ],
      // The webhook uses this to find and confirm the booking.
      metadata: { bookingId: booking.id },
      client_reference_id: booking.id,
      // Expire the session in line with our pending hold window.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking/cancelled?booking_id=${booking.id}`,
    });

    await attachStripeSession(booking.id, session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] error:", error);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
}
