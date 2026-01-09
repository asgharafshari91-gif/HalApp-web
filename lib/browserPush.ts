// lib/browserPush.ts
// ✅ Safari tespit + WebPush destek durumu (FCM için)

export type WebPushSupport = {
  supported: boolean;
  reason?: string;
  isSafari: boolean;
  isIOS: boolean;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

/**
 * ✅ Safari tespit (Mac Safari dahil)
 * - Chrome iOS da "Safari engine" ama UA farklı; yine de push olarak destek yok.
 */
export function detectSafari(): { isSafari: boolean; isIOS: boolean } {
  if (!isBrowser()) return { isSafari: false, isIOS: false };

  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ masquerade
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);

  // Safari: "Safari" var, ama Chrome/Edge/Opera yok
  const isSafari =
    /Safari/.test(ua) &&
    !/Chrome|Chromium|Edg|OPR|Opera|Firefox/.test(ua);

  return { isSafari, isIOS };
}

/**
 * ✅ Firebase Cloud Messaging Web Push desteği
 * - FCM web push: Notification + ServiceWorker + PushManager
 * - Safari (macOS/iOS) FCM web push çalışmaz → Apple Push gerekli
 */
export function getWebPushSupport(): WebPushSupport {
  if (!isBrowser()) return { supported: false, reason: "no-browser", isSafari: false, isIOS: false };

  const { isSafari, isIOS } = detectSafari();

  // Safari için FCM web push yok (Apple APNs web push farklı)
  if (isSafari) {
    return {
      supported: false,
      isSafari: true,
      isIOS,
      reason: isIOS
        ? "iOS Safari Web Push (FCM) desteklemez."
        : "Mac Safari Web Push (FCM) desteklemez. (Apple Push gerekir)",
    };
  }

  const supported =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  return {
    supported,
    isSafari,
    isIOS,
    reason: supported ? undefined : "Tarayıcı Web Push API'lerini desteklemiyor.",
  };
}