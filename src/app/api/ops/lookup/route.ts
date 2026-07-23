import { NextRequest, NextResponse } from "next/server";
import { getBookingByReference } from "@/lib/bookings";
import { formatBookingReference } from "@/lib/booking-reference";
import { getVanById } from "@/lib/inventory";
import { isOpsAuthenticated } from "@/lib/ops-auth";
import { formatMoney, rentalDays } from "@/lib/pricing";
import { FIELDS, getRecord } from "@/lib/airtable";
import { airtableConfig } from "@/lib/config";
import { ageFromDob } from "@/lib/paperwork";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isOpsAuthenticated())) {
    return NextResponse.json({ error: "Staff login required." }, { status: 401 });
  }

  const ref = request.nextUrl.searchParams.get("reference")?.trim() ?? "";
  if (!ref) {
    return NextResponse.json(
      { error: "Enter a booking reference." },
      { status: 400 },
    );
  }

  try {
    const booking = await getBookingByReference(ref);
    if (!booking) {
      return NextResponse.json(
        { error: "No booking found for that reference." },
        { status: 404 },
      );
    }

    const van = booking.vanId ? await getVanById(booking.vanId) : null;
    let dateOfBirth = "";
    let mileageOption = "";
    try {
      const raw = await getRecord(airtableConfig.bookingsTable, booking.id);
      dateOfBirth = String(raw.fields[FIELDS.booking.dateOfBirth] ?? "");
      mileageOption = String(raw.fields[FIELDS.booking.mileageOption] ?? "");
    } catch {
      /* optional fields */
    }

    const days = rentalDays(booking.startAt, booking.endAt);
    const daily =
      days > 0 ? Math.round(booking.totalAmountMinor / days) : booking.totalAmountMinor;
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    const refDisplay = booking.reference
      ? formatBookingReference(booking.reference)
      : booking.id.slice(0, 8).toUpperCase();

    return NextResponse.json({
      booking: {
        id: booking.id,
        reference: refDisplay,
        customerName: booking.customerName,
        email: booking.email,
        phone: booking.customerPhone,
        dateOfBirth,
        age: dateOfBirth ? ageFromDob(dateOfBirth) : "",
        vanName: van?.name ?? "Van",
        dailyRateMinor: van?.dailyRateMinor ?? daily,
        startAt: booking.startAt,
        endAt: booking.endAt,
        collectionDate: Number.isNaN(start.getTime())
          ? ""
          : start.toISOString().slice(0, 10),
        collectionTime: Number.isNaN(start.getTime())
          ? ""
          : start.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
        returnDate: Number.isNaN(end.getTime())
          ? ""
          : end.toISOString().slice(0, 10),
        returnTime: Number.isNaN(end.getTime())
          ? ""
          : end.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
        durationLabel: `${days} day${days === 1 ? "" : "s"}`,
        depositAmountMinor: booking.depositAmountMinor,
        totalAmountMinor: booking.totalAmountMinor,
        currency: booking.currency || "gbp",
        mileageOption,
        depositLabel: formatMoney(
          booking.depositAmountMinor,
          booking.currency || "gbp",
        ),
        totalLabel: formatMoney(
          booking.totalAmountMinor,
          booking.currency || "gbp",
        ),
        dailyRateLabel: formatMoney(
          van?.dailyRateMinor ?? daily,
          booking.currency || "gbp",
        ),
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    console.error("[ops/lookup]", error);
    return NextResponse.json(
      { error: "Could not look up booking." },
      { status: 500 },
    );
  }
}
