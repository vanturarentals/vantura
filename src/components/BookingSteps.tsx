"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { slug: "", label: "Vehicle" },
  { slug: "extras", label: "Extras" },
  { slug: "driver", label: "Driver" },
  { slug: "review", label: "Payment" },
];

export default function BookingSteps({ vanId }: { vanId: string }) {
  const pathname = usePathname();
  const base = `/book/${vanId}`;

  function isActive(slug: string) {
    if (slug === "") return pathname === base;
    return pathname.endsWith(`/${slug}`);
  }

  return (
    <ol className="mb-8 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
      {STEPS.map((step, i) => {
        const href = step.slug ? `${base}/${step.slug}` : base;
        const active = isActive(step.slug);
        return (
          <li key={step.slug || "vehicle"} className="flex items-center gap-2">
            {i > 0 && <span className="text-border">/</span>}
            <Link
              href={href}
              className={active ? "text-brand" : "text-muted hover:text-brand"}
            >
              {step.label}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
