import { Suspense } from "react";
import VanDetailsClient from "./van-details-client";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-muted">Loading van…</p>}>
      <VanDetailsClient />
    </Suspense>
  );
}
