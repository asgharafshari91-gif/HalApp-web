// lib/track.ts
// ✅ Analytics kabul edilmediyse hiçbir tracking çağrısı çıkmasın.
// ✅ gtag yüklenmemişse (window.gtag yoksa) event gönderme.
// ✅ Consent değişince otomatik davranır (CookieConsent dispatch + storage event).
// ✅ ConsentScripts ile uyumlu: analytics true olunca GA script load, false olunca NO-OP.

import { readConsent } from "@/lib/consent";

export type HalAppConsentSnapshot = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

/** ✅ consent oku (yoksa null) */
export function getConsent(): HalAppConsentSnapshot | null {
  if (typeof window === "undefined") return null;

  const c: any = readConsent?.() ?? null;
  if (!c) return null;

  const updatedAt =
    typeof c.acceptedAt === "string" && c.acceptedAt
      ? c.acceptedAt
      : typeof c.updatedAt === "string" && c.updatedAt
      ? c.updatedAt
      : new Date().toISOString();

  return {
    necessary: true,
    analytics: Boolean(c.analytics),
    marketing: Boolean(c.marketing),
    updatedAt,
  };
}

/** ✅ Analytics açık mı? (tercih yoksa false) */
export function isAnalyticsAllowed(): boolean {
  const c = getConsent();
  return Boolean(c?.analytics);
}

/** ✅ Marketing açık mı? (tercih yoksa false) */
export function isMarketingAllowed(): boolean {
  const c = getConsent();
  return Boolean(c?.marketing);
}

/** ✅ gtag hazır mı? */
export function hasGtag(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as any).gtag === "function";
}

/**
 * ✅ Event gönder (GA4)
 * - Analytics kapalıysa: NO-OP
 * - gtag yoksa: NO-OP
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!isAnalyticsAllowed()) return;

  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;

  try {
    gtag("event", eventName, params ?? {});
  } catch {
    // no-op
  }
}

/**
 * ✅ Page view (SPA route değişimlerinde)
 */
export function trackPageView(url?: string) {
  if (typeof window === "undefined") return;
  if (!isAnalyticsAllowed()) return;

  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;

  try {
    gtag("event", "page_view", {
      page_location: url ?? window.location.href,
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
    });
  } catch {
    // no-op
  }
}

/**
 * ✅ Güvenli wrapper: sadece analytics izinliyse + gtag hazırsa çalıştırır
 */
export function trackSafe(fn: () => void) {
  if (!isAnalyticsAllowed()) return;
  if (!hasGtag()) return;
  try {
    fn();
  } catch {
    // no-op
  }
}

/**
 * ✅ Consent değişimini dinle
 * CookieConsent dispatch:
 * - "halapp:consent"
 * - "halapp-consent-changed"
 * - "halapp-consent-refresh"
 * Ayrıca "storage" ile diğer tab değişimini yakalar.
 */
export function listenConsent(cb: (c: HalAppConsentSnapshot | null) => void) {
  if (typeof window === "undefined") return () => {};

  const emit = (maybe?: any) => {
    const fromDetail = maybe?.detail ?? null;
    if (fromDetail) {
      const updatedAt =
        typeof fromDetail.acceptedAt === "string" && fromDetail.acceptedAt
          ? fromDetail.acceptedAt
          : new Date().toISOString();

      cb({
        necessary: true,
        analytics: Boolean(fromDetail.analytics),
        marketing: Boolean(fromDetail.marketing),
        updatedAt,
      });
      return;
    }

    cb(getConsent());
  };

  const onAny = (e: any) => emit(e);
  const onRefresh = () => emit();

  window.addEventListener("halapp:consent", onAny);
  window.addEventListener("halapp-consent-changed", onAny);
  window.addEventListener("halapp-consent-refresh", onRefresh);

  const onStorage = (ev: StorageEvent) => {
    if (ev.key === "halapp-consent-v1") emit();
  };
  window.addEventListener("storage", onStorage);

  // ilk snapshot
  emit();

  return () => {
    window.removeEventListener("halapp:consent", onAny);
    window.removeEventListener("halapp-consent-changed", onAny);
    window.removeEventListener("halapp-consent-refresh", onRefresh);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * ✅ TrackInit'in çağıracağı otomatik senkron
 * - Analytics kapalıyken: window.gtag NO-OP kalır (event kaçmaz)
 * - Analytics açılınca: ConsentScripts zaten GA'yı yükler (bu fonksiyon sadece güvenlik kalkanı)
 */
export function initTrackingAutoSync() {
  if (typeof window === "undefined") return () => {};

  // ilk boot: analytics kapalıysa NO-OP kalkanı kur
  if (!isAnalyticsAllowed()) {
    (window as any).gtag = (window as any).gtag || function () {};
  }

  const unsub = listenConsent((c) => {
    const allowed = Boolean(c?.analytics);

    if (!allowed) {
      // analytics kapandıysa, gtag üzerinden event kaçmasın
      (window as any).gtag = (window as any).gtag || function () {};
    }
    // analytics açıldıysa: ConsentScripts GA'yı dinamik yükleyecek (refresh gerektirmez)
  });

  return unsub;
}

/** ✅ Debug: console'da kontrol için */
export function debugConsent() {
  return getConsent();
}