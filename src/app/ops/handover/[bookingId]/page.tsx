import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PaperworkForm from "@/components/PaperworkForm";
import { getBookingById } from "@/lib/bookings";
import { formatBookingReference } from "@/lib/booking-reference";
import { FIELDS, getRecord } from "@/lib/airtable";
import { airtableConfig } from "@/lib/config";
import { getVanById } from "@/lib/inventory";
import { isOpsAuthenticated } from "@/lib/ops-auth";
import { ageFromDob } from "@/lib/paperwork";
import { formatMoney, rentalDays } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function OpsPaperworkPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  if (!(await isOpsAuthenticated())) {
    redirect("/ops/handover");
  }

  const { bookingId } = await params;
  const booking = await getBookingById(bookingId);
  if (!booking) notFound();

  const van = booking.vanId ? await getVanById(booking.vanId) : null;
  let dateOfBirth = "";
  let mileageOption = "";
  try {
    const raw = await getRecord(airtableConfig.bookingsTable, booking.id);
    dateOfBirth = String(raw.fields[FIELDS.booking.dateOfBirth] ?? "");
    mileageOption = String(raw.fields[FIELDS.booking.mileageOption] ?? "");
  } catch {
    /* optional */
  }

  const days = rentalDays(booking.startAt, booking.endAt);
  const daily =
    days > 0
      ? Math.round(booking.totalAmountMinor / days)
      : booking.totalAmountMinor;
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const ref = booking.reference
    ? formatBookingReference(booking.reference)
    : booking.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-2xl px-5 py-8">
        <Link
          href="/ops/handover"
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← All lookups
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-brand">
          Collection paperwork
        </h1>
        <p className="mt-1 text-sm text-muted">
          Complete with the customer present, then both of you receive a PDF by
          email.
        </p>

        <div className="mt-8">
          <PaperworkForm
            prefill={{
              id: booking.id,
              reference: ref,
              customerName: booking.customerName,
              email: booking.email,
              phone: booking.customerPhone,
              dateOfBirth,
              age: dateOfBirth ? ageFromDob(dateOfBirth) : "",
              vanName: van?.name ?? "Van",
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
              mileageOption,
            }}
          />
        </div>
      </div>
    </div>
  );
}
