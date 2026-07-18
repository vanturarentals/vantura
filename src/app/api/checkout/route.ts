import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, stripeConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { getVanById, isVanAvailable } from "@/lib/inventory";
import { attachStripeSession, createPendingBooking } from "@/lib/bookings";
import { computeTotalMinor, isValidRange, rentalDays } from "@/lib/pricing";
import { extrasTotalMinor, getExtra } from "@/lib/extras";
import type { CheckoutRequest } from "@/lib/types";
import type Stripe from "stripe";

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

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: vanTotal,
          product_data: {
            name: `${van.name} rental`,
            description: `${days} day${days === 1 ? "" : "s"} hire`,
          },
        },
      },
    ];

    for (const q of extras) {
      if (q.quantity <= 0) continue;
      const item = getExtra(q.id);
      if (!item) continue;
      const unit =
        item.chargeType === "per_day" ? item.priceMinor * days : item.priceMinor;
      lineItems.push({
        quantity: q.quantity,
        price_data: {
          currency,
          unit_amount: unit,
          product_data: {
            name: item.name,
            description:
              item.chargeType === "per_day"
                ? `${formatDays(days)} at ${item.priceMinor / 100}/day`
                : "Flat fee",
          },
        },
      });
    }

    const appUrl = getAppUrl();
    const stripe = getStripe();

    // Embedded Checkout keeps payment on your site (no redirect away).
    // payment_method_types omitted → dynamic payment methods from Dashboard.
    // Stripe SDK v22+ uses ui_mode: 'embedded_page' (was 'embedded').
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      metadata: { bookingId: booking.id },
      client_reference_id: booking.id,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      return_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    await attachStripeSession(booking.id, session.id);

    if (!session.client_secret) {
      throw new Error("Stripe did not return a client_secret for embedded checkout.");
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
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
