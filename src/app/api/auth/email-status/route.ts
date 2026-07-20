import { NextRequest, NextResponse } from "next/server";
import {
  emailIsRegistered,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Email lookup is not configured." },
      { status: 503 },
    );
  }

  try {
    const exists = await emailIsRegistered(email);
    return NextResponse.json({ exists });
  } catch (error) {
    console.error("[auth/email-status]", error);
    return NextResponse.json(
      { error: "Could not check email. Please try again." },
      { status: 500 },
    );
  }
}
