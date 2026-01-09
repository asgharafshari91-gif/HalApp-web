"use client";

import { useEffect, useMemo, useState } from "react";

const LS_KEY = "halapp-consent";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updated_at: string;
};

function safeParse(v: string | null): Consent | null {
  if (!v) return null;
  try {
    const j = JSON.parse(v);
    if (typeof j?.analytics === "boolean" && typeof j?.marketing === "boolean") {
      return {
        necessary: true,
        analytics: j.analytics,
        marketing: j.marketing,
        updated_at: String(j.updated_at ?? new Date().toISOString()),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string) {
  try {
    const n = encodeURIComponent(name) + "=";
    const parts = document.cookie.split(";").map((s) => s.trim());
    const hit = parts.find((p) => p.startsWith(n));
    if (!hit) return null;
    return decodeURIComponent(hit.slice(n.length));
  } catch {
    return null;
  }
}

function readConsent(): Consent | null {
  const c = safeParse(getCookie(LS_KEY));
  if (c) return c;
  try {
    return safeParse(localStorage.getItem(LS_KEY));
  } catch {
    return null;
  }
}

function writeConsent(consent: Consent) {
  const val = JSON.stringify(consent);
  try {
    localStorage.setItem(LS_KEY, val);
  } catch {}
  setCookie(LS_KEY, val, 365);
  try {
    window.dispatchEvent(new CustomEvent("halapp-consent", { detail: consent }));
  } catch {}
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) return; // zaten karar verilmiş
    setVisible(true);
  }, []);

  const consentPreview: Consent = useMemo(
    () => ({ necessary: true, analytics, marketing, updated_at: new Date().toISOString() }),
    [analytics, marketing]
  );

  function acceptAll() {
    writeConsent({ necessary: true, analytics: true, marketing: true, updated_at: new Date().toISOString() });
    setVisible(false);
  }

  function rejectAll() {
    writeConsent({ necessary: true, analytics: false, marketing: false, updated_at: new Date().toISOString() });
    setVisible(false);
  }

  function savePrefs() {
    writeConsent(consentPreview);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[9999] mx-auto max-w-4xl px-4">
      <div className="rounded-3xl border border-black/10 bg-white/95 p-5 shadow-2xl dark:border-white/10 dark:bg-black/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-black/90 dark:text-white/90">Çerez Tercihleri</div>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70 leading-6">
              HalApp; zorunlu çerezleri kullanır. Analitik ve pazarlama çerezlerini ise yalnızca onayınla çalıştırır.
            </p>
          </div>

          <a href="/privacy" className="text-sm font-extrabold text-emerald-600 hover:underline">
            KVKK & Çerez Politikası
          </a>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/60 dark:text-white/60">Zorunlu</div>
            <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">Her zaman açık</div>
            <div className="mt-2 text-xs text-black/60 dark:text-white/60">Giriş, güvenlik, temel işlevler.</div>
          </div>

          <label className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5 cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-black/60 dark:text-white/60">Analitik</div>
                <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">İsteğe bağlı</div>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div className="mt-2 text-xs text-black/60 dark:text-white/60">Ürün iyileştirme, performans ölçümü.</div>
          </label>

          <label className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5 cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-black/60 dark:text-white/60">Pazarlama</div>
                <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">İsteğe bağlı</div>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div className="mt-2 text-xs text-black/60 dark:text-white/60">Kampanya/yeniden hedefleme.</div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            Tümünü Kabul Et
          </button>

          <button
            type="button"
            onClick={rejectAll}
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
          >
            Tümünü Reddet
          </button>

          <button
            type="button"
            onClick={savePrefs}
            className="ml-auto rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white/80 dark:hover:bg-black/20 transition"
          >
            Seçimleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}