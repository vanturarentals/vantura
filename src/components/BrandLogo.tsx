import Link from "next/link";

interface Props {
  /** Tailwind height classes for the image. */
  className?: string;
  /** Wrap in a home link (default true). */
  link?: boolean;
  priority?: boolean;
}

export default function BrandLogo({
  className = "h-11 w-auto sm:h-12",
  link = true,
  priority = false,
}: Props) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Vantura Rentals"
      className={className}
      width={240}
      height={105}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );

  if (!link) return img;

  return (
    <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Vantura Rentals home">
      {img}
    </Link>
  );
}
