import { NextRequest, NextResponse } from "next/server";
import { opsConfig } from "@/lib/config";
import {
  OPS_COOKIE,
  createOpsSessionToken,
  verifyStaffPin,
} from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!opsConfig.isConfigured) {
    return NextResponse.json(
      {
        error:
          "Staff PIN is not configured. Set OPS_STAFF_PIN in the server environment.",
      },
      { status: 503 },
    );
  }

  let body: { pin?: string };
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!verifyStaffPin(body.pin ?? "")) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const token = createOpsSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: opsConfig.sessionHours * 60 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
