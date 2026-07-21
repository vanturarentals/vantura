import { hirePolicy } from "@/lib/company";
import { formatMoney } from "@/lib/pricing";
import {
  formatLoadVolume,
  getVanSpecs,
  type VanSpecs,
} from "@/lib/van-catalog";

interface Props {
  vanName: string;
  dailyRateMinor: number;
  currency: string;
  compact?: boolean;
}

export default function VanSpecsList({
  vanName,
  dailyRateMinor,
  currency,
  compact = false,
}: Props) {
  const specs = getVanSpecs(vanName);
  const p = hirePolicy;

  if (compact) {
    return (
      <ul className="mt-3 space-y-1 text-sm text-muted">
        <SpecRow label="Size" value={specs.size} />
        <SpecRow label="Seats" value={String(specs.seats)} />
        <SpecRow label="Transmission" value={specs.transmission} />
        <SpecRow label="Fuel" value={specs.fuel} />
        <SpecRow label="Load space" value={formatLoadVolume(specs)} />
        <SpecRow label="Payload" value={`${specs.payloadKg} kg`} />
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{specs.suitableFor}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <SpecRow label="Category" value={specs.category} />
        <SpecRow label="Seats" value={String(specs.seats)} />
        <SpecRow label="Transmission" value={specs.transmission} />
        <SpecRow label="Fuel" value={specs.fuel} />
        <SpecRow label="Load length" value={`${specs.loadLengthM} m`} />
        <SpecRow label="Load width" value={`${specs.loadWidthM} m`} />
        <SpecRow label="Load height" value={`${specs.loadHeightM} m`} />
        <SpecRow label="Max payload" value={`${specs.payloadKg} kg`} />
        <SpecRow
          label="Daily price"
          value={`${formatMoney(dailyRateMinor, currency)} inc. VAT`}
        />
        <SpecRow
          label="Mileage"
          value={`${p.includedMilesPerDay} miles/day included`}
        />
        <SpecRow label="Deposit" value={formatMoney(p.depositMinor, currency)} />
        <SpecRow
          label="Insurance excess (Basic)"
          value={formatMoney(p.protection.basic.excessMinor, currency)}
        />
      </dl>
      <p className="text-xs text-muted">
        Vehicle shown is representative — you may receive a similar model in the
        same category (&quot;or similar&quot;).
      </p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </>
  );
}

export function vanSpecsShort(specs: VanSpecs): string {
  return `${specs.seats} seats · ${specs.transmission} · ${specs.fuel}`;
}
