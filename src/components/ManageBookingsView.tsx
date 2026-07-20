"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CancelBookingButton from "@/components/CancelBookingButton";
import { formatBookingReference } from "@/lib/booking-reference";
import { formatMoney } from "@/lib/pricing";
import { supportConfig } from "@/lib/support";
import type { Booking, PaymentStatus } from "@/lib/types";

export type ManageBookingRow = {
  booking: Booking;
  vanName: string;
  imageUrl: string | null;
};

type Tab = "upcoming" | "past";

interface Props {
  email: string;
  rows: ManageBookingRow[];
}

function isUpcoming(booking: Booking, now = Date.now()): boolean {
  return (
    booking.paymentStatus !== "Cancelled" &&
    new Date(booking.startAt).getTime() > now
  );
}

function statusLabel(status: PaymentStatus): string {
  if (status === "Paid") return "Confirmed";
  return status;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function referenceOf(booking: Booking): string {
  return booking.reference
    ? formatBookingReference(booking.reference)
    : booking.id.slice(0, 8).toUpperCase();
}

export default function ManageBookingsView({ email, rows }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingParam = searchParams.get("booking");

  const upcoming = useMemo(
    () => rows.filter((r) => isUpcoming(r.booking)),
    [rows],
  );
  const past = useMemo(
    () => rows.filter((r) => !isUpcoming(r.booking)),
    [rows],
  );

  const initialFromQuery = useMemo(() => {
    if (!bookingParam) return null;
    return rows.find((r) => r.booking.id === bookingParam) ?? null;
  }, [bookingParam, rows]);

  const [tab, setTab] = useState<Tab>(() => {
    if (initialFromQuery) {
      return isUpcoming(initialFromQuery.booking) ? "upcoming" : "past";
    }
    return upcoming.length > 0 ? "upcoming" : "past";
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    () =>
      initialFromQuery?.booking.id ??
      upcoming[0]?.booking.id ??
      past[0]?.booking.id ??
      null,
  );

  useEffect(() => {
    if (!bookingParam) return;
    const match = rows.find((r) => r.booking.id === bookingParam);
    if (!match) return;
    setSelectedId(match.booking.id);
    setTab(isUpcoming(match.booking) ? "upcoming" : "past");
  }, [bookingParam, rows]);

  const list = tab === "upcoming" ? upcoming : past;
  const selected = selectedId
    ? (rows.find((r) => r.booking.id === selectedId) ?? null)
    : null;

  function selectBooking(id: string) {
    setSelectedId(id);
    router.replace(`/manage?booking=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  }

  function switchTab(next: Tab) {
    setTab(next);
    const nextList = next === "upcoming" ? upcoming : past;
    const stillVisible = nextList.some((r) => r.booking.id === selectedId);
    if (!stillVisible) {
      const first = nextList[0]?.booking.id ?? null;
      setSelectedId(first);
      if (first) {
        router.replace(`/manage?booking=${encodeURIComponent(first)}`, {
          scroll: false,
        });
      } else {
        router.replace("/manage", { scroll: false });
      }
    }
  }

  if (rows.length === 0) {
    return (
      <>
        <Header email={email} />
        <p className="mt-10 text-muted">
          No bookings yet.{" "}
          <Link href="/" className="font-semibold text-brand underline">
            Search vans
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Header email={email} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div>
          <div className="flex gap-6 border-b border-border">
            <TabButton
              active={tab === "upcoming"}
              onClick={() => switchTab("upcoming")}
              count={upcoming.length}
            >
              Upcoming
            </TabButton>
            <TabButton
              active={tab === "past"}
              onClick={() => switchTab("past")}
              count={past.length}
            >
              Past
            </TabButton>
          </div>

          {list.length === 0 ? (
            <p className="mt-8 text-sm text-muted">
              {tab === "upcoming"
                ? "No upcoming bookings."
                : "No past bookings yet."}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.map((row) => {
                const active = selected?.booking.id === row.booking.id;
                const ref = referenceOf(row.booking);
                return (
                  <li key={row.booking.id}>
                    <button
                      type="button"
                      onClick={() => selectBooking(row.booking.id)}
                      className={`flex w-full items-stretch gap-3 rounded-xl border bg-white p-3 text-left transition-colors outline outline-2 outline-transparent outline-offset-2 hover:outline-brand ${
                        active
                          ? "border-brand"
                          : "border-border hover:border-brand/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1 py-1 pl-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-sm font-bold text-foreground">
                            {ref}
                          </p>
                          <StatusBadge status={row.booking.paymentStatus} />
                        </div>
                        <p className="mt-2 text-sm text-muted">
                          {formatShort(row.booking.startAt)}
                        </p>
                        <p className="text-sm text-muted">
                          → {formatShort(row.booking.endAt)}
                        </p>
                        {(row.booking.pickupLocation ||
                          row.booking.dropoffLocation) && (
                          <p className="mt-2 truncate text-sm font-medium text-foreground">
                            {row.booking.pickupLocation ||
                              row.booking.dropoffLocation}
                          </p>
                        )}
                      </div>
                      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface sm:h-24 sm:w-32">
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.imageUrl}
                            alt={row.vanName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
                            {row.vanName}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="panel-aside h-fit p-5 lg:sticky lg:top-6">
          {selected ? (
            <BookingDetail row={selected} />
          ) : (
            <p className="text-sm text-muted">
              Select a booking to see the details.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}

function Header({ email }: { email: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold text-brand">My bookings</h1>
        <p className="mt-2 text-muted">
          Signed in as{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg px-2 py-1 text-sm font-semibold text-brand outline outline-2 outline-transparent outline-offset-2 transition-[outline-color] hover:outline-brand"
      >
        Book another van →
      </Link>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors outline outline-2 outline-transparent outline-offset-2 hover:outline-brand ${
        active
          ? "border-brand text-brand"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
      <span className="ml-1.5 text-xs font-medium opacity-70">({count})</span>
    </button>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cancelled = status === "Cancelled";
  return (
    <span
      className={
        cancelled
          ? "rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted"
          : "rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-semibold text-brand"
      }
    >
      {statusLabel(status)}
    </span>
  );
}

function BookingDetail({ row }: { row: ManageBookingRow }) {
  const { booking, vanName } = row;
  const ref = referenceOf(booking);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Booking details</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm font-semibold text-muted">{ref}</p>
          <StatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      <div>
        <p className="text-base font-semibold text-foreground">{vanName}</p>
        {row.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-lg bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.imageUrl}
              alt={vanName}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        )}
      </div>

      <dl className="space-y-3 text-sm">
        <DetailRow label="Pick-up" value={formatDate(booking.startAt)} />
        <DetailRow label="Return" value={formatDate(booking.endAt)} />
        <DetailRow
          label="Pick-up location"
          value={booking.pickupLocation || "—"}
        />
        <DetailRow
          label="Drop-off location"
          value={booking.dropoffLocation || "—"}
        />
        <div className="flex justify-between gap-3 border-t border-border pt-3">
          <dt className="font-bold text-foreground">Hire total</dt>
          <dd className="font-bold text-foreground">
            {formatMoney(booking.totalAmountMinor, booking.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Deposit paid</dt>
          <dd className="font-medium">
            {formatMoney(booking.depositAmountMinor, booking.currency)}
          </dd>
        </div>
        {booking.totalAmountMinor > booking.depositAmountMinor && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Balance due in person</dt>
            <dd className="font-medium">
              {formatMoney(
                booking.totalAmountMinor - booking.depositAmountMinor,
                booking.currency,
              )}
            </dd>
          </div>
        )}
        {booking.refundStatus && (
          <DetailRow label="Refund" value={booking.refundStatus} />
        )}
      </dl>

      <CancelBookingButton
        bookingId={booking.id}
        paymentStatus={booking.paymentStatus}
        startAt={booking.startAt}
        refundStatus={booking.refundStatus}
      />

      <div className="rounded-lg bg-surface p-4 text-sm">
        <p className="font-semibold text-foreground">Need a change?</p>
        <p className="mt-1 text-muted">
          Date or location changes aren&apos;t available online yet. Email{" "}
          <a
            href={`mailto:${supportConfig.email}?subject=Change%20booking%20${encodeURIComponent(ref)}`}
            className="font-semibold text-brand underline"
          >
            {supportConfig.email}
          </a>{" "}
          with your reference.
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
