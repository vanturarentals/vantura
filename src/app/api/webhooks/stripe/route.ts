import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { getBookingById, setPaymentStatus } from "@/lib/bookings";
import { getVanById, isVanAvailable } from "@/lib/inventory";
import { sendBookingConfirmationEmail, sendNewBookingNotifyEmail } from "@/lib/email";

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
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object, stripe);
        break;
      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object);
        break;
      // Keep legacy Checkout Session handlers during any in-flight sessions.
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, stripe);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`[webhook] error handling ${event.type}:`, error);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function confirmBooking(
  bookingId: string,
  stripe: Stripe,
  paymentIntentId: string | null,
) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    console.warn(`[webhook] booking ${bookingId} not found`);
    return;
  }

  if (booking.paymentStatus === "Paid") return;

  const stillFree = booking.vanId
    ? await isVanAvailable(
        booking.vanId,
        booking.startAt,
        booking.endAt,
        booking.id,
      )
    : true;

  if (!stillFree) {
    console.warn(
      `[webhook] double-booking detected for booking ${booking.id}; refunding`,
    );
    if (paymentIntentId) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    }
    await setPaymentStatus(booking.id, "Cancelled");
    return;
  }

  const confirmed = await setPaymentStatus(booking.id, "Paid");
  const van = confirmed.vanId ? await getVanById(confirmed.vanId) : null;
  const vanName = van?.name ?? "Your van";
  await sendBookingConfirmationEmail(confirmed, vanName);
  await sendNewBookingNotifyEmail(confirmed, vanName);
}

async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  stripe: Stripe,
) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId) {
    console.warn("[webhook] payment_intent.succeeded without bookingId");
    return;
  }
  await confirmBooking(bookingId, stripe, paymentIntent.id);
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  if (!bookingId) return;

  const booking = await getBookingById(bookingId);
  if (booking && booking.paymentStatus === "Pending") {
    await setPaymentStatus(booking.id, "Cancelled");
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId) {
    console.warn("[webhook] completed session without bookingId");
    return;
  }
  const pi =
    typeof session.payment_intent === "string" ? session.payment_intent : null;
  await confirmBooking(bookingId, stripe, pi);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId ?? session.client_reference_id;
  if (!bookingId) return;

  const booking = await getBookingById(bookingId);
  if (booking && booking.paymentStatus === "Pending") {
    await setPaymentStatus(booking.id, "Cancelled");
  }
}
