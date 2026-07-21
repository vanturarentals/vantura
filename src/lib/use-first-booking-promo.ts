"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { FirstBookingPromoStatus } from "@/lib/first-booking-promo";

const DEFAULT: FirstBookingPromoStatus = {
  eligible: false,
  discountPercent: 20,
  reason: "not_signed_in",
};

export function useFirstBookingPromo(): FirstBookingPromoStatus & {
  loading: boolean;
  refresh: () => void;
} {
  const [status, setStatus] = useState<FirstBookingPromoStatus>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promo/first-booking");
      const data = (await res.json()) as FirstBookingPromoStatus;
      setStatus(data);
    } catch {
      setStatus(DEFAULT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return { ...status, loading, refresh };
}
