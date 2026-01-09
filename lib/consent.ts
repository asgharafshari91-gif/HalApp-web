// lib/consent.ts
// ✅ Single source of truth for consent (LS + Cookie + Events)
// ✅ CookieConsent + Privacy page + ConsentScripts aynı yerden konuşur
// ✅ Refresh gerekmez: writeConsent event dispatch eder.

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;

  // legal must
  termsAccepted: boolean;
  privacyAccepted: boolean;
  explicitConsent: boolean;

  acceptedAt: string; // ISO
  version: number; // 1
};

const LS_KEY = "halapp-consent-v1";
const COOKIE_KEY = "halapp_consent_v1";
const PENDING_LS_KEY = "halapp-consent-pending-v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function toJson(v: ConsentState) {
  return JSON.stringify({
    necessary: true,
    analytics: Boolean(v.analytics),
    marketing: Boolean(v.marketing),
    termsAccepted: Boolean(v.termsAccepted),
    privacyAccepted: Boolean(v.privacyAccepted),
    explicitConsent: Boolean(v.explicitConsent),
    acceptedAt: v.acceptedAt,
    version: v.version ?? 1,
  });
}

function readCookie(name: string) {
  if (!isBrowser()) return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 365) {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax` + secure;
}

function safeParse(raw: string): ConsentState | null {
  try {
    const j = JSON.parse(raw);
    if (!j) return null;

    return {
      necessary: true,
      analytics: Boolean(j.analytics),
      marketing: Boolean(j.marketing),
      termsAccepted: Boolean(j.termsAccepted),
      privacyAccepted: Boolean(j.privacyAccepted),
      explicitConsent: Boolean(j.explicitConsent),
      acceptedAt: typeof j.acceptedAt === "string" ? j.acceptedAt : new Date().toISOString(),
      version: typeof j.version === "number" ? j.version : 1,
    };
  } catch {
    return null;
  }
}

/** ✅ Consent oku (önce LS, sonra cookie) */
export function readConsent(): ConsentState | null {
  if (!isBrowser()) return null;

  const ls = window.localStorage.getItem(LS_KEY);
  const fromLs = ls ? safeParse(ls) : null;
  if (fromLs) return fromLs;

  const ck = readCookie(COOKIE_KEY);
  const fromCk = ck ? safeParse(ck) : null;
  if (fromCk) return fromCk;

  return null;
}

/** ✅ Consent yaz (LS + cookie) + event dispatch (refresh gerekmez) */
export function writeConsent(v: ConsentState) {
  if (!isBrowser()) return;

  const payload = toJson(v);

  try {
    window.localStorage.setItem(LS_KEY, payload);
  } catch {}

  try {
    setCookie(COOKIE_KEY, payload);
  } catch {}

  // ✅ anında uygulansın diye event fırlat
  try {
    // yeni standart event
    window.dispatchEvent(new CustomEvent("halapp:consent", { detail: v }));
    // backward-compat (bazı yerlerde bunu dinliyor olabilirsin)
    window.dispatchEvent(new CustomEvent("halapp-consent-changed", { detail: v }));
    // basit refresh event (istersen)
    window.dispatchEvent(new Event("halapp-consent-refresh"));
  } catch {}
}

/** ✅ Kullanıcı login değilse DB’ye yazamayız → pending olarak saklarız */
export function writePendingConsent(v: ConsentState) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PENDING_LS_KEY, toJson(v));
  } catch {}
}

/** ✅ Pending consent oku */
export function readPendingConsent(): ConsentState | null {
  if (!isBrowser()) return null;
  const ls = window.localStorage.getItem(PENDING_LS_KEY);
  return ls ? safeParse(ls) : null;
}

/** ✅ Pending consent temizle */
export function clearPendingConsent() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(PENDING_LS_KEY);
  } catch {}
}

/** ✅ Consent temizle (debug/test) */
export function clearConsent() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {}
  try {
    document.cookie = `${COOKIE_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
  } catch {}
  try {
    window.dispatchEvent(new Event("halapp-consent-refresh"));
  } catch {}
}

/** ✅ legal ok mu? */
export function isLegalOk(c?: ConsentState | null) {
  const v = c ?? readConsent();
  return Boolean(v?.termsAccepted && v?.privacyAccepted && v?.explicitConsent);
}