"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  // CookieConsent’te acceptedAt var, bazı yerlerde updatedAt olabilir; ikisini de tolere edelim
  acceptedAt?: string;
  updatedAt?: string;
  version?: number;
};

const LS_KEY = "halapp-consent-v1";
const COOKIE_KEY = "halapp_consent_v1";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

function safeParse(v: string): Consent | null {
  try {
    const j = JSON.parse(v);
    if (!j) return null;
    return {
      necessary: true,
      analytics: Boolean(j.analytics),
      marketing: Boolean(j.marketing),
      acceptedAt: typeof j.acceptedAt === "string" ? j.acceptedAt : undefined,
      updatedAt: typeof j.updatedAt === "string" ? j.updatedAt : undefined,
      version: typeof j.version === "number" ? j.version : undefined,
    };
  } catch {
    return null;
  }
}

function readConsentNow(): Consent | null {
  if (typeof window === "undefined") return null;

  const ls = window.localStorage.getItem(LS_KEY);
  const fromLs = ls ? safeParse(ls) : null;
  if (fromLs) return fromLs;

  const ck = readCookie(COOKIE_KEY);
  const fromCk = ck ? safeParse(ck) : null;
  if (fromCk) return fromCk;

  return null;
}

export default function ConsentScripts() {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    // ilk yüklemede oku
    setConsent(readConsentNow());

    const onChanged = (e: any) => {
      // ✅ CookieConsent -> window.dispatchEvent(new CustomEvent("halapp-consent-changed",{detail:v}))
      const c = e?.detail ? (e.detail as Consent) : readConsentNow();
      setConsent(c ?? null);
    };

    // ✅ yeni event adı
    window.addEventListener("halapp-consent-changed", onChanged);

    // opsiyonel: bazı yerlerde basit event de atıyoruz
    const onRefresh = () => setConsent(readConsentNow());
    window.addEventListener("halapp-consent-refresh", onRefresh);

    return () => {
      window.removeEventListener("halapp-consent-changed", onChanged);
      window.removeEventListener("halapp-consent-refresh", onRefresh);
    };
  }, []);

  const analyticsAllowed = Boolean(consent?.analytics);

  // ✅ gtag güvenlik kalkanı:
  // analytics kapalıysa event gönderilmesin (track.ts zaten kontrol ediyor ama ekstra kalkan)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!analyticsAllowed) {
      // gtag hiç yoksa NO-OP oluştur
      if (typeof (window as any).gtag !== "function") {
        (window as any).gtag = function () {};
      }
      return;
    }
  }, [analyticsAllowed]);

  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const shouldLoadGA = analyticsAllowed && Boolean(GA_ID);

  // marketing altyapısı hazır (istersen sonra eklersin)
  const shouldLoadMarketing = Boolean(consent?.marketing);
  useMemo(() => shouldLoadMarketing, [shouldLoadMarketing]);

  if (!shouldLoadGA) return null;

  return (
    <>
      {/* ✅ Google tag (analytics) - sadece analytics kabul edilirse */}
      <Script
        id="ga-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;

// Consent Mode (opsiyonel ama iyi pratik):
// analytics açıldığında consent granted olsun
gtag('consent', 'update', {
  'analytics_storage': 'granted'
});

gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}