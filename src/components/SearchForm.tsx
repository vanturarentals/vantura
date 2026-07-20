"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import SearchDateRangeCalendar, {
  parseIso,
  startOfMonth,
} from "@/components/SearchDateRangeCalendar";
import { formatShortDate } from "@/lib/format-datetime";

/** 30-minute time slots, 24/7 (00:00 … 23:30). */
export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function splitDateTime(value?: string): { date: string; time: string } {
  if (value && value.includes("T")) {
    const [date, time] = value.split("T");
    return { date, time: (time ?? "").slice(0, 5) };
  }
  return { date: "", time: "" };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toTimeInput(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Round up to the next 30-minute slot (keep if already on :00 / :30). */
function nearestHalfHour(from = new Date()): Date {
  const d = new Date(from);
  d.setSeconds(0, 0);
  const minutes = d.getMinutes();
  if (minutes === 0 || minutes === 30) return d;
  if (minutes < 30) {
    d.setMinutes(30);
  } else {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  }
  return d;
}

/** Default hire window: nearest half-hour now → +6 hours. */
function defaultHireWindow(): {
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
} {
  const pickup = nearestHalfHour();
  const dropoff = new Date(pickup.getTime() + 6 * 60 * 60 * 1000);
  return {
    pickupDate: toDateInput(pickup),
    pickupTime: toTimeInput(pickup),
    dropoffDate: toDateInput(dropoff),
    dropoffTime: toTimeInput(dropoff),
  };
}

interface Props {
  defaults?: {
    pickupAt?: string;
    dropoffAt?: string;
  };
  variant?: "hero" | "inline";
}

export default function SearchForm({ defaults, variant = "hero" }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fromUrl = useMemo(() => {
    const p = splitDateTime(defaults?.pickupAt);
    const d = splitDateTime(defaults?.dropoffAt);
    if (p.date && d.date) {
      return {
        pickupDate: p.date,
        pickupTime: p.time || "10:00",
        dropoffDate: d.date,
        dropoffTime: d.time || "10:00",
      };
    }
    return null;
  }, [defaults?.pickupAt, defaults?.dropoffAt]);

  const [pickupDate, setPickupDate] = useState(fromUrl?.pickupDate ?? "");
  const [pickupTime, setPickupTime] = useState(fromUrl?.pickupTime ?? "10:00");
  const [dropoffDate, setDropoffDate] = useState(fromUrl?.dropoffDate ?? "");
  const [dropoffTime, setDropoffTime] = useState(fromUrl?.dropoffTime ?? "10:00");
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [rangeDraftStart, setRangeDraftStart] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  // Fill "now → +6h" on the client so SSR/hydration stay in sync.
  useEffect(() => {
    if (fromUrl) return;
    const w = defaultHireWindow();
    setPickupDate(w.pickupDate);
    setPickupTime(w.pickupTime);
    setDropoffDate(w.dropoffDate);
    setDropoffTime(w.dropoffTime);
  }, [fromUrl]);

  useEffect(() => {
    if (!calendarOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (formRef.current?.contains(target)) return;
      setCalendarOpen(false);
      setRangeDraftStart(null);
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [calendarOpen]);

  function openCalendar() {
    setRangeDraftStart(null);
    if (pickupDate) {
      setViewMonth(startOfMonth(parseIso(pickupDate)));
    } else {
      setViewMonth(startOfMonth(new Date()));
    }
    setCalendarOpen(true);
  }

  function onRangeChange(start: string, end: string) {
    setPickupDate(start);
    setDropoffDate(end);
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pickupDate || !dropoffDate) {
      setError("Please choose pick-up and return dates.");
      return;
    }
    const pickupAt = `${pickupDate}T${pickupTime}`;
    const dropoffAt = `${dropoffDate}T${dropoffTime}`;
    if (new Date(dropoffAt) <= new Date(pickupAt)) {
      setError("Return must be after pick-up.");
      return;
    }
    router.push(
      `/vans?${new URLSearchParams({ pickupAt, dropoffAt }).toString()}`,
    );
  }

  const isHero = variant === "hero";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={
        isHero
          ? "relative w-full rounded-2xl border border-border bg-white p-5 shadow-md sm:p-6 md:p-7"
          : "panel relative w-full p-4"
      }
    >
      <div
        className={
          isHero
            ? "grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-start lg:gap-5"
            : "grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-start"
        }
      >
        <DateTimeField
          label="Pickup date"
          date={pickupDate}
          time={pickupTime}
          onOpenCalendar={openCalendar}
          onTimeChange={setPickupTime}
          timeAriaLabel="Pickup time"
          large={isHero}
          calendarOpen={calendarOpen}
        />
        <DateTimeField
          label="Return date"
          date={dropoffDate}
          time={dropoffTime}
          onOpenCalendar={openCalendar}
          onTimeChange={setDropoffTime}
          timeAriaLabel="Return time"
          large={isHero}
          calendarOpen={calendarOpen}
        />

        <div
          className={`flex flex-col ${isHero ? "gap-2" : "gap-1.5"}`}
        >
          <span
            className={`hidden font-semibold text-foreground opacity-0 lg:block ${
              isHero ? "text-sm" : "text-xs"
            }`}
            aria-hidden
          >
            Search
          </span>
          <button
            type="submit"
            className={
              isHero
                ? "btn-primary min-h-12 w-full gap-2 !rounded-full px-8 text-base lg:w-auto lg:translate-y-0.5"
                : "btn-primary min-h-[2.625rem] w-full gap-2 !rounded-full lg:w-auto lg:translate-y-0.5"
            }
          >
            Search
            <svg width={isHero ? 18 : 16} height={isHero ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {calendarOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 px-0 sm:px-0">
          <SearchDateRangeCalendar
            startDate={pickupDate}
            endDate={dropoffDate}
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            onRangeChange={onRangeChange}
            onClose={() => {
              setCalendarOpen(false);
              setRangeDraftStart(null);
            }}
            rangeDraftStart={rangeDraftStart}
            onRangeDraftStart={setRangeDraftStart}
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function formatDisplayDate(isoDate: string): string {
  return formatShortDate(isoDate);
}

function DateTimeField({
  label,
  date,
  time,
  onOpenCalendar,
  onTimeChange,
  timeAriaLabel,
  large = false,
  calendarOpen = false,
}: {
  label: string;
  date: string;
  time: string;
  onOpenCalendar: () => void;
  onTimeChange: (value: string) => void;
  timeAriaLabel: string;
  large?: boolean;
  calendarOpen?: boolean;
}) {
  return (
    <div className={`flex min-w-0 flex-col ${large ? "gap-2" : "gap-1.5"}`}>
      <span
        className={`font-semibold text-foreground ${large ? "text-sm" : "text-xs"}`}
      >
        {label}
      </span>
      <div
        className={`flex min-w-0 overflow-hidden rounded-full border bg-white transition-[border-color,box-shadow] ${
          calendarOpen ? "border-brand ring-2 ring-brand/15" : "border-border"
        } ${large ? "min-h-12" : "min-h-[2.625rem]"}`}
      >
        <button
          type="button"
          onClick={onOpenCalendar}
          className="flex min-w-0 flex-[1.4] cursor-pointer items-center gap-2 border-r border-border px-3 text-left sm:px-4"
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
        >
          <CalendarIcon size={large ? 16 : 14} />
          <span
            className={`truncate font-normal text-foreground ${large ? "text-base" : "text-sm"}`}
          >
            {formatDisplayDate(date)}
          </span>
        </button>
        <div className="relative flex shrink-0 items-center pr-3 sm:pr-4">
          <select
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className={`cursor-pointer appearance-none border-0 bg-transparent pl-3 outline-none sm:pl-4 ${
              large ? "min-h-12 text-base" : "min-h-[2.625rem] text-sm"
            }`}
            aria-label={timeAriaLabel}
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-muted"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
