import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/bookings";
import { formatBookingReference } from "@/lib/booking-reference";
import { emailConfig } from "@/lib/config";
import { sendPaperworkEmails } from "@/lib/email";
import { completeCollectionPaperwork } from "@/lib/hire-agreements";
import { isOpsAuthenticated } from "@/lib/ops-auth";
import {
  buildPaperworkPdf,
  type PaperworkPayload,
  type YesNo,
} from "@/lib/paperwork";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isYesNo(v: unknown): v is YesNo {
  return v === "yes" || v === "no";
}

export async function POST(request: NextRequest) {
  if (!(await isOpsAuthenticated())) {
    return NextResponse.json({ error: "Staff login required." }, { status: 401 });
  }

  let body: PaperworkPayload;
  try {
    body = (await request.json()) as PaperworkPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.bookingId || !body.primary?.fullName?.trim()) {
    return NextResponse.json(
      { error: "Primary driver name is required." },
      { status: 400 },
    );
  }
  if (!body.customerSignatureDataUrl || !body.companySignatureDataUrl) {
    return NextResponse.json(
      { error: "Customer and company signatures are required." },
      { status: 400 },
    );
  }
  if (
    !body.declarations?.infoAccurate ||
    !body.declarations?.validLicence ||
    !body.declarations?.authorisedDriversOnly ||
    !body.declarations?.acceptPenalties ||
    !body.declarations?.returnOnTime ||
    !body.declarations?.acceptTerms
  ) {
    return NextResponse.json(
      { error: "All customer declarations must be confirmed." },
      { status: 400 },
    );
  }
  if (!isYesNo(body.hasSecondDriver)) {
    return NextResponse.json(
      { error: "Say whether there is a second driver." },
      { status: 400 },
    );
  }

  const booking = await getBookingById(body.bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const ref = booking.reference
    ? formatBookingReference(booking.reference)
    : body.bookingReference || booking.id.slice(0, 8).toUpperCase();

  const payload: PaperworkPayload = {
    ...body,
    bookingId: booking.id,
    bookingReference: ref,
    signedAtIso: body.signedAtIso || new Date().toISOString(),
    staffName: (body.staffName || "Staff").trim(),
  };

  try {
    const agreementId = await completeCollectionPaperwork(booking.id, payload);
    if (!agreementId) {
      return NextResponse.json(
        {
          error:
            "Could not save hire agreement. Check Airtable Hire Agreements table.",
        },
        { status: 502 },
      );
    }

    const pdfBytes = await buildPaperworkPdf(payload);

    let emails = { customer: false, office: false };
    if (emailConfig.isConfigured) {
      emails = await sendPaperworkEmails({
        customerEmail: booking.email,
        customerName: payload.primary.fullName || booking.customerName,
        bookingReference: ref,
        pdfBytes,
      });
    }

    return NextResponse.json({
      ok: true,
      agreementId,
      emails,
      emailConfigured: emailConfig.isConfigured,
    });
  } catch (error) {
    console.error("[ops/paperwork]", error);
    return NextResponse.json(
      { error: "Could not complete paperwork. Please try again." },
      { status: 500 },
    );
  }
}
