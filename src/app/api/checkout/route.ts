import { NextRequest, NextResponse } from "next/server";
import { stripeConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { getVanById, isVanAvailable } from "@/lib/inventory";
import { attachStripeSession, createPendingBooking } from "@/lib/bookings";
import { computeTotalMinor, isValidRange, rentalDays } from "@/lib/pricing";
import { extrasTotalMinor, getExtra } from "@/lib/extras";
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
    pickupLocation = "",
    dropoffLocation = "",
    startAt,
    endAt,
    customerName,
    email,
    extras = [],
  } = body;

  if (!vanId || !startAt || !endAt || !customerName || !email) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!isValidRange(startAt, endAt)) {
    return NextResponse.json({ error: "Invalid rental dates." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const startIso = new Date(startAt).toISOString();
  const endIso = new Date(endAt).toISOString();

  try {
    const van = await getVanById(vanId);
    if (!van || !van.bookable) {
      return NextResponse.json({ error: "Van not available." }, { status: 404 });
    }

    if (!(await isVanAvailable(vanId, startIso, endIso))) {
      return NextResponse.json(
        { error: "Sorry, this van was just booked for those dates." },
        { status: 409 },
      );
    }

    const days = rentalDays(startIso, endIso);
    const vanTotal = computeTotalMinor(van.dailyRateMinor, startIso, endIso);
    const extrasTotal = extrasTotalMinor(extras, days);
    const totalMinor = vanTotal + extrasTotal;
    const currency = stripeConfig.currency;

    const booking = await createPendingBooking({
      vanId: van.id,
      customerName,
      email,
      pickupLocation,
      dropoffLocation,
      startAt: startIso,
      endAt: endIso,
      totalAmountMinor: totalMinor,
      currency,
    });

    const descriptionParts = [`${van.name} · ${formatDays(days)}`];
    for (const q of extras) {
      if (q.quantity <= 0) continue;
      const item = getExtra(q.id);
      if (!item) continue;
      descriptionParts.push(
        q.quantity > 1 ? `${item.name} ×${q.quantity}` : item.name,
      );
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalMinor,
      currency,
      receipt_email: email,
      description: descriptionParts.join(" · "),
      metadata: { bookingId: booking.id },
      payment_method_types: ["card"],
    });

    // Reuse the Airtable "Stripe Session ID" field for the PaymentIntent id.
    await attachStripeSession(booking.id, paymentIntent.id);

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe did not return a client_secret.");
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[checkout] error:", error);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 500 },
    );
  }
}

function formatDays(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}
