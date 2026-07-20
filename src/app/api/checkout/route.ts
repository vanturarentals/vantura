import { NextRequest, NextResponse } from "next/server";
import { stripeConfig } from "@/lib/config";
import { getStripe } from "@/lib/stripe";
import { getVanById, isVanAvailable } from "@/lib/inventory";
import { attachLicencePhotos, attachStripeSession, createPendingBooking } from "@/lib/bookings";
import { attachBookingExtras } from "@/lib/booking-extras";
import { DEPOSIT_MINOR } from "@/lib/booking-totals";
import { computeTotalMinor, isValidRange, rentalDays } from "@/lib/pricing";
import { extrasTotalMinor, getExtra } from "@/lib/extras";
import { getProtection, protectionTotalMinor } from "@/lib/protections";
import { getMileageOption, mileageTotalMinor } from "@/lib/mileage";
import { getCurrentUser } from "@/lib/supabase/server";
import type { CheckoutRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isDataUrlImage(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/") && value.includes(";base64,");
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
    protectionId = "basic",
    mileageId = "included_200",
    licence,
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
  if (
    !licence ||
    !isDataUrlImage(licence.frontDataUrl) ||
    !isDataUrlImage(licence.backDataUrl)
  ) {
    return NextResponse.json(
      { error: "Driving licence photos are required." },
      { status: 400 },
    );
  }

  // Optional — guests book without an account.
  const user = await getCurrentUser();

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
    const protection = getProtection(protectionId);
    if (!protection) {
      return NextResponse.json({ error: "Invalid protection package." }, { status: 400 });
    }
    const mileage = getMileageOption(mileageId);
    if (!mileage) {
      return NextResponse.json({ error: "Invalid mileage option." }, { status: 400 });
    }
    const extrasTotal = extrasTotalMinor(extras, days);
    const protectionTotal = protectionTotalMinor(protection.id, days);
    const mileageTotal = mileageTotalMinor(mileage.id, days);
    const totalMinor = vanTotal + extrasTotal + protectionTotal + mileageTotal;
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
      depositAmountMinor: DEPOSIT_MINOR,
      currency,
      protectionName: protection.name,
      mileageName: mileage.name,
      userId: user?.id ?? null,
    });

    await attachBookingExtras({
      bookingId: booking.id,
      extras,
      startAt: startIso,
      endAt: endIso,
    });

    await attachLicencePhotos(booking.id, {
      frontDataUrl: licence.frontDataUrl,
      frontName: licence.frontName || "licence-front.jpg",
      backDataUrl: licence.backDataUrl,
      backName: licence.backName || "licence-back.jpg",
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
    descriptionParts.push(protection.name);
    if (mileage.id === "unlimited") {
      descriptionParts.push(mileage.name);
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: DEPOSIT_MINOR,
      currency,
      receipt_email: email,
      description: `Reservation deposit · ${descriptionParts.join(" · ")}`,
      metadata: {
        bookingId: booking.id,
        hireTotalMinor: String(totalMinor),
        depositMinor: String(DEPOSIT_MINOR),
      },
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
    const raw =
      error instanceof Error ? error.message : "Could not start checkout.";
    // Never echo Stripe key material back to the browser.
    const detail = raw.replace(
      /Invalid API Key provided:.*/i,
      "Invalid Stripe API key — check STRIPE_SECRET_KEY in .env.local / Vercel.",
    );
    return NextResponse.json(
      { error: `Could not start checkout. ${detail}` },
      { status: 500 },
    );
  }
}

function formatDays(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}
