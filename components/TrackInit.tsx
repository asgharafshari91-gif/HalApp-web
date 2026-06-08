"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  initTrackingAutoSync,
  trackPageView,
  isAnalyticsAllowed,
} from "@/lib/track";

function TrackInitInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    try {
      if (!isAnalyticsAllowed()) return;

      const qs = searchParams?.toString();
      const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ""}`;
      trackPageView(url);
    } catch {
      // no-op
    }
  }, [pathname, searchParams]);

  return null;
}

export default function TrackInit() {
  return (
    <Suspense fallback={null}>
      <TrackInitInner />
    </Suspense>
  );
}