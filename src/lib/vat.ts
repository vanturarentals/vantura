/** UK VAT helpers — prices on site are gross (inc. VAT) when configured. */

import { companyConfig } from "@/lib/company";

export const UK_VAT_RATE = 0.2;

export interface VatSplit {
  grossMinor: number;
  netMinor: number;
  vatMinor: number;
}

/** Split a VAT-inclusive amount into net + VAT at 20%. */
export function splitVatFromGross(grossMinor: number): VatSplit {
  if (!companyConfig.vatRegistered || !companyConfig.pricesIncludeVat) {
    return { grossMinor, netMinor: grossMinor, vatMinor: 0 };
  }
  const netMinor = Math.round(grossMinor / (1 + UK_VAT_RATE));
  const vatMinor = grossMinor - netMinor;
  return { grossMinor, netMinor, vatMinor };
}
