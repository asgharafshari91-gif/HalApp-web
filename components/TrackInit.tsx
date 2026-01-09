// components/TrackInit.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initTrackingAutoSync, trackPageView, isAnalyticsAllowed } from "@/lib/track";

export default function TrackInit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ Consent <-> tracking otomatik senkron (analytics kapalıysa NO-OP kalkan)
  useEffect(() => {
    try {
      const unsub = initTrackingAutoSync();
      return () => {
        try {
          unsub?.();
        } catch {
          // no-op
        }
      };
    } catch {
      return;
    }
  }, []);

  // ✅ SPA route change => page_view (analytics açıksa)
  useEffect(() => {
    try {
      if (!isAnalyticsAllowed()) return;

      const qs = searchParams?.toString();
      const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
      trackPageView(url);
    } catch {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}