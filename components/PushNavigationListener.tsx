// components/PushNavigationListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PushNavigationListener() {
  const router = useRouter();

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e?.data;
      if (!d) return;
      if (d.type === "HALAPP_NAVIGATE" && typeof d.url === "string") {
        try {
          const u = new URL(d.url);
          // same-origin path’e çevir
          const path = u.pathname + u.search + u.hash;
          router.push(path);
        } catch {
          router.push(d.url);
        }
      }
    };

    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, [router]);

  return null;
}