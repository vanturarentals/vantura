import { NextResponse } from "next/server";
import { getLocations } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locations = await getLocations();
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("[locations] error:", error);
    return NextResponse.json({ locations: [] as string[] });
  }
}
