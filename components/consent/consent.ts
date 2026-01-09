// components/consent/consent.ts
export type ConsentValue = "accepted" | "rejected" | "unset";

export const CONSENT_KEY = "halapp-cookie-consent";

export function readConsent(): ConsentValue {
  if (typeof window === "undefined") return "unset";
  const v = window.localStorage.getItem(CONSENT_KEY);
  if (v === "accepted" || v === "rejected") return v;
  return "unset";
}

export function writeConsent(v: Exclude<ConsentValue, "unset">) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, v);
  // İstersen cookie de yaz (server-side ihtiyaç olursa)
  document.cookie = `${CONSENT_KEY}=${v}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}