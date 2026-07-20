"use client";

import { useEffect, useMemo, useRef } from "react";

const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12);
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1, 12);
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Monday-first weeks; null = empty cell before day 1. */
function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

interface Props {
  startDate: string;
  endDate: string;
  viewMonth: Date;
  onViewMonthChange: (month: Date) => void;
  onRangeChange: (start: string, end: string) => void;
  onClose: () => void;
  /** After first date click, waiting for second. */
  rangeDraftStart: string | null;
  onRangeDraftStart: (iso: string | null) => void;
}

export default function SearchDateRangeCalendar({
  startDate,
  endDate,
  viewMonth,
  onViewMonthChange,
  onRangeChange,
  onClose,
  rangeDraftStart,
  onRangeDraftStart,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const currentMonthStart = useMemo(() => startOfMonth(new Date()), []);

  const months = useMemo(
    () => [0, 1, 2].map((offset) => addMonths(viewMonth, offset)),
    [viewMonth],
  );

  const rangeStart = rangeDraftStart ?? startDate;
  const rangeEnd = rangeDraftStart ? endDate : endDate;
  const hasRange = Boolean(rangeStart && rangeEnd);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function canSelect(iso: string): boolean {
    return iso >= todayIso;
  }

  function onDayClick(iso: string) {
    if (!canSelect(iso)) return;

    if (!rangeDraftStart) {
      onRangeDraftStart(iso);
      onRangeChange(iso, iso);
      return;
    }

    let start = rangeDraftStart;
    let end = iso;
    if (end < start) [start, end] = [end, start];
    onRangeChange(start, end);
    onRangeDraftStart(null);
    onClose();
  }

  function dayState(iso: string) {
    const disabled = !canSelect(iso);
    const isToday = iso === todayIso;
    if (!hasRange || !rangeStart || !rangeEnd) {
      return { disabled, isToday, isStart: false, isEnd: false, inRange: false };
    }
    const start = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const end = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
    const isStart = iso === start;
    const isEnd = iso === end;
    const inRange = iso > start && iso < end;
    return { disabled, isToday, isStart, isEnd, inRange };
  }

  function dayClass(iso: string): string {
    const { disabled, isToday, isStart, isEnd, inRange } = dayState(iso);
    const base =
      "relative flex h-9 w-9 items-center justify-center text-sm transition-colors sm:h-10 sm:w-10";

    if (disabled) {
      return `${base} cursor-not-allowed text-gray-300`;
    }

    let cls = `${base} cursor-pointer font-medium text-foreground hover:ring-2 hover:ring-gray-300 hover:ring-inset`;

    if (isStart && isEnd) {
      cls += " rounded-lg bg-foreground text-white hover:ring-0";
    } else if (isStart) {
      cls += " rounded-l-lg bg-foreground text-white hover:ring-0";
    } else if (isEnd) {
      cls += " rounded-r-lg bg-foreground text-white hover:ring-0";
    } else if (inRange) {
      cls += " rounded-none bg-gray-200 text-foreground hover:ring-0";
    }

    if (isToday && !isStart && !isEnd) {
      cls += " font-semibold text-orange-500";
    }

    return cls;
  }

  const canGoPrev = viewMonth > currentMonthStart;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Choose pick-up and return dates"
      className="overflow-hidden rounded-xl border border-border bg-white shadow-xl"
    >
      <div className="flex items-stretch">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onViewMonthChange(addMonths(viewMonth, -1))}
          className="flex w-10 shrink-0 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-25"
          aria-label="Previous months"
        >
          <ChevronLeft />
        </button>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max divide-x divide-border">
            {months.map((monthDate) => {
              const y = monthDate.getFullYear();
              const m = monthDate.getMonth();
              const weeks = buildMonthGrid(y, m);

              return (
                <div
                  key={`${y}-${m}`}
                  className="w-[240px] shrink-0 px-4 py-4 sm:w-[260px] sm:px-5 sm:py-5"
                >
                  <p className="mb-4 text-center text-base font-bold text-foreground">
                    {monthLabel(monthDate)}
                  </p>
                  <div className="mb-2 grid grid-cols-7 gap-0">
                    {WEEKDAYS.map((d) => (
                      <div
                        key={d}
                        className="pb-2 text-center text-[10px] font-semibold tracking-wide text-muted sm:text-[11px]"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 justify-items-center">
                        {week.map((day, di) => {
                          if (day === null) {
                            return <span key={di} className="h-9 w-9 sm:h-10 sm:w-10" />;
                          }
                          const iso = `${y}-${pad2(m + 1)}-${pad2(day)}`;
                          return (
                            <button
                              key={di}
                              type="button"
                              disabled={!canSelect(iso)}
                              onClick={() => onDayClick(iso)}
                              className={dayClass(iso)}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
          className="flex w-10 shrink-0 items-center justify-center border-l border-border text-foreground transition-colors hover:bg-surface"
          aria-label="Next months"
        >
          <ChevronRight />
        </button>
      </div>

      <p className="border-t border-border px-4 py-2.5 text-center text-xs text-muted">
        {rangeDraftStart
          ? "Choose your return date"
          : "Choose your pick-up date, then your return date"}
      </p>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { parseIso, startOfMonth };
