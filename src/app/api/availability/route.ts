import { NextRequest, NextResponse } from "next/server";
import { stripeConfig } from "@/lib/config";
import { getAvailableVans } from "@/lib/inventory";
import { computeTotalMinor, isValidRange, rentalDays } from "@/lib/pricing";

// Availability depends on request-time query data, so always run dynamically.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const location = params.get("location") ?? "";
  const pickupAt = params.get("pickupAt") ?? "";
  const dropoffAt = params.get("dropoffAt") ?? "";

  if (!pickupAt || !dropoffAt || !isValidRange(pickupAt, dropoffAt)) {
    return NextResponse.json(
      { error: "Provide a valid pickupAt and dropoffAt (dropoff after pickup)." },
      { status: 400 },
    );
  }

  try {
    const vans = await getAvailableVans(location, pickupAt, dropoffAt);
    const days = rentalDays(pickupAt, dropoffAt);

    const results = vans.map((van) => ({
      ...van,
      days,
      totalMinor: computeTotalMinor(van.dailyRateMinor, pickupAt, dropoffAt),
      currency: stripeConfig.currency,
    }));

    return NextResponse.json({ days, vans: results });
  } catch (error) {
    console.error("[availability] error:", error);
    return NextResponse.json(
      { error: "Could not load availability." },
      { status: 500 },
    );
  }
}
