import { NextResponse } from "next/server";
import { evaluateFirstBookingPromo } from "@/lib/first-booking-promo";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const status = await evaluateFirstBookingPromo({
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });
    return NextResponse.json(status);
  } catch (error) {
    console.error("[promo/first-booking] error:", error);
    return NextResponse.json({
      eligible: false,
      discountPercent: 20,
      reason: "not_signed_in",
    });
  }
}
