"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { slug: "", label: "Vehicle" },
  { slug: "extras", label: "Extras" },
  { slug: "driver", label: "Driver" },
  { slug: "licence", label: "Licence" },
  { slug: "review", label: "Payment" },
];

export default function BookingSteps({ vanId }: { vanId: string }) {
  const pathname = usePathname();
  const base = `/book/${vanId}`;

  function isActive(slug: string) {
    if (slug === "") return pathname === base;
    return pathname.endsWith(`/${slug}`);
  }

  function stepIndex(slug: string) {
    return STEPS.findIndex((s) => s.slug === slug);
  }

  const activeIdx = STEPS.findIndex((s) => isActive(s.slug));

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {STEPS.map((step, i) => {
          const href = step.slug ? `${base}/${step.slug}` : base;
          const active = isActive(step.slug);
          const done = activeIdx > stepIndex(step.slug);
          return (
            <li key={step.slug || "vehicle"} className="flex items-center gap-1">
              {i > 0 && (
                <span className="mx-1 text-border" aria-hidden>
                  →
                </span>
              )}
              <Link
                href={href}
                className={
                  active
                    ? "font-bold text-brand"
                    : done
                      ? "font-medium text-foreground hover:text-brand"
                      : "font-medium text-muted hover:text-brand"
                }
                aria-current={active ? "step" : undefined}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
