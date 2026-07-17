import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { getBookingById, setPaymentStatus } from "@/lib/bookings";
import { getVanById, isVanAvailable } from "@/lib/inventory";
import { sendBookingConfirmationEmail } from "@/lib/email";

// Stripe signature verification needs the raw body + Node crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      stripeConfig.webhookSecret,
    );
  } catch (error) {
    console.error("[webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCompleted(event.data.object, stripe);
        break;
      case "checkout.session.expired":
        await handleExpired(event.data.object);
        break;
      default:
        // Ignore unrelated events.
        break;
    }
  } catch (error) {
    // Returning 500 makes Stripe retry, which is what we want on transient errors.
    console.error(`[webhook] error handling ${event.type}:`, error);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId) {
    console.warn("[webhook] completed session without bookingId");
    return;
  }

  const booking = await getBookingById(bookingId);
  if (!booking) {
    console.warn(`[webhook] booking ${bookingId} not found`);
    return;
  }

  // Idempotency: Stripe may deliver the same event more than once.
  if (booking.paymentStatus === "Paid") return;

  // Final guard against a race where another payment confirmed first.
  const stillFree = booking.vanId
    ? await isVanAvailable(booking.vanId, booking.startAt, booking.endAt, booking.id)
    : true;

  if (!stillFree) {
    console.warn(`[webhook] double-booking detected for booking ${booking.id}; refunding`);
    if (typeof session.payment_intent === "string") {
      await stripe.refunds.create({ payment_intent: session.payment_intent });
    }
    await setPaymentStatus(booking.id, "Cancelled");
    return;
  }

  const confirmed = await setPaymentStatus(booking.id, "Paid");
  const van = confirmed.vanId ? await getVanById(confirmed.vanId) : null;
  await sendBookingConfirmationEmail(confirmed, van?.name ?? "Your van");
}

async function handleExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId) return;

  const booking = await getBookingById(bookingId);
  // Only release holds that never got paid.
  if (booking && booking.paymentStatus === "Pending") {
    await setPaymentStatus(booking.id, "Cancelled");
  }
}
