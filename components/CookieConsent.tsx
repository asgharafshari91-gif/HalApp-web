"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { ConsentState, readConsent, writeConsent, writePendingConsent } from "@/lib/consent";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

async function upsertConsentToDb(v: ConsentState) {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) return { ok: false as const, reason: "no-session" as const };

  const payload = {
    user_id: uid,
    necessary: true,
    analytics: v.analytics,
    marketing: v.marketing,
    terms_accepted: v.termsAccepted,
    privacy_accepted: v.privacyAccepted,
    explicit_consent: v.explicitConsent,
    accepted_at: v.acceptedAt,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  };

  const { error } = await supabase.from("user_consents").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;

  return { ok: true as const };
}

/** ✅ Consent değişti: tüm app bunu dinleyebilir (ConsentScripts / track.ts vs) */
function emitConsentChanged(v: ConsentState) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("halapp-consent-changed", { detail: v }));
  // ekstra “basit” event (istersen dinlersin)
  window.dispatchEvent(new Event("halapp-consent-refresh"));
}

/** ✅ ConsentScripts veya başka yerler analytics kapalıyken gtag yoksa event atmasın */
function ensureNoopGtagIfNeeded(v: ConsentState) {
  if (typeof window === "undefined") return;
  if (v.analytics) return;
  if (typeof (window as any).gtag === "function") return;
  (window as any).gtag = () => {};
}

export default function CookieConsent() {
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // toggles
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // legal checks (zorunlu)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [explicitConsent, setExplicitConsent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  /** ✅ modal dışarıdan açılabilsin (privacy sayfasından) */
  useEffect(() => {
    function onOpen() {
      const c = readConsent();
      if (c) {
        setAnalytics(Boolean(c.analytics));
        setMarketing(Boolean(c.marketing));
        setTermsAccepted(Boolean(c.termsAccepted));
        setPrivacyAccepted(Boolean(c.privacyAccepted));
        setExplicitConsent(Boolean(c.explicitConsent));
      }
      setOpen(true);
    }

    window.addEventListener("halapp-open-cookie-consent", onOpen);
    return () => window.removeEventListener("halapp-open-cookie-consent", onOpen);
  }, []);

  useEffect(() => {
    setMounted(true);

    const c = readConsent();
    if (!c) {
      // ilk girişte consent yoksa aç
      setOpen(true);
      return;
    }

    // mevcut consent varsa hydrate
    setAnalytics(Boolean(c.analytics));
    setMarketing(Boolean(c.marketing));
    setTermsAccepted(Boolean(c.termsAccepted));
    setPrivacyAccepted(Boolean(c.privacyAccepted));
    setExplicitConsent(Boolean(c.explicitConsent));
    setOpen(false);

    // ✅ app ilk mount’ta da haberdar olsun (SPA sayfalarda)
    emitConsentChanged(c);
    ensureNoopGtagIfNeeded(c);
  }, []);

  const legalOk = useMemo(
    () => termsAccepted && privacyAccepted && explicitConsent,
    [termsAccepted, privacyAccepted, explicitConsent]
  );

  function buildConsent(next: { analytics: boolean; marketing: boolean }): ConsentState {
    return {
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      termsAccepted,
      privacyAccepted,
      explicitConsent,
      acceptedAt: new Date().toISOString(),
      version: 1,
    };
  }

  async function persist(v: ConsentState) {
    // 1) localStorage/cookie -> anında aktif (refresh gerekmez)
    writeConsent(v);

    // ✅ önemli: anında app'e bildir
    ensureNoopGtagIfNeeded(v);
    emitConsentChanged(v);

    // 2) DB’ye kaydet (session varsa). yoksa pending kaydet.
    try {
      const r = await upsertConsentToDb(v);
      if (!r.ok && r.reason === "no-session") writePendingConsent(v);
    } catch (e: any) {
      // DB hatası olsa bile kullanıcı deneyimini bozmayalım; local çalışır.
      writePendingConsent(v);
      console.error(e);
    }
  }

  async function acceptAll() {
    if (!legalOk) {
      toast({
        variant: "warning",
        title: "Onay gerekli",
        message: "Devam etmek için Şartlar + KVKK/Çerez + Açık Rıza onaylarını işaretlemelisin.",
      });
      return;
    }

    setSaving(true);
    try {
      const v = buildConsent({ analytics: true, marketing: true });
      await persist(v);
      setOpen(false);

      toast({
        variant: "success",
        title: "Kaydedildi",
        message: "Tercihlerin kaydedildi.",
        durationMs: 1400,
      });
    } finally {
      setSaving(false);
    }
  }

  async function rejectAll() {
    if (!legalOk) {
      toast({
        variant: "warning",
        title: "Onay gerekli",
        message: "Devam etmek için en azından metinleri okuyup onaylamalısın. (Zorunlu yasal onay)",
      });
      return;
    }

    setSaving(true);
    try {
      const v = buildConsent({ analytics: false, marketing: false });
      await persist(v);
      setOpen(false);

      toast({
        variant: "info",
        title: "Kaydedildi",
        message: "Sadece zorunlu çerezler aktif.",
        durationMs: 1400,
      });
    } finally {
      setSaving(false);
    }
  }

  async function savePrefs() {
    if (!legalOk) {
      toast({
        variant: "warning",
        title: "Onay gerekli",
        message: "Devam etmek için Şartlar + KVKK/Çerez + Açık Rıza onaylarını işaretlemelisin.",
      });
      return;
    }

    setSaving(true);
    try {
      const v = buildConsent({ analytics, marketing });
      await persist(v);
      setOpen(false);

      toast({
        variant: "success",
        title: "Kaydedildi",
        message: "Tercihlerin kaydedildi.",
        durationMs: 1400,
      });
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl px-4 pb-6">
        <div className="rounded-[28px] border border-black/10 bg-white/95 p-5 shadow-[0_-24px_70px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-zinc-950/95">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-black text-black/95 dark:text-white/95">
                Çerez Tercihleri & Yasal Onaylar
              </div>
              <div className="mt-1 text-sm text-black/60 dark:text-white/60">
                HalApp deneyimini iyileştirmek için çerez kullanır. Analitik/pazarlama çerezleri yalnızca izin verirsen aktif olur.
                Detaylar için{" "}
                <Link href="/privacy" className="font-black text-emerald-700 underline dark:text-emerald-200">
                  KVKK + Çerez Politikası
                </Link>{" "}
                sayfasını okuyabilirsin.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPrefs((s) => !s)}
              className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
            >
              {showPrefs ? "Basit Görünüm" : "Tercihleri Yönet"}
            </button>
          </div>

          {/* Legal must-read */}
          <div className="mt-4 grid gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="text-sm font-extrabold text-black/80 dark:text-white/80">
                Kullanım Şartlarını okudum ve kabul ediyorum. (Zorunlu)
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
              />
              <span className="text-sm font-extrabold text-black/80 dark:text-white/80">
                KVKK + Çerez Politikasını okudum ve kabul ediyorum. (Zorunlu)
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={explicitConsent}
                onChange={(e) => setExplicitConsent(e.target.checked)}
              />
              <span className="text-sm font-extrabold text-black/80 dark:text-white/80">
                Açık rıza beyanını kabul ediyorum. (Zorunlu)
              </span>
            </label>

            {!legalOk ? (
              <div className="text-[12px] font-semibold text-black/60 dark:text-white/60">
                Devam etmek için yukarıdaki 3 zorunlu onayı işaretlemelisin.
              </div>
            ) : null}
          </div>

          {/* Preferences */}
          {showPrefs ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-sm font-black">Zorunlu</div>
                <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                  Oturum ve güvenlik için gereklidir. Kapalı yapılamaz.
                </div>
                <div className="mt-3 inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-900 dark:text-emerald-100">
                  Aktif
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">Analitik</div>
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                      Trafik/performans ölçümü.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalytics((s) => !s)}
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-black transition",
                      analytics
                        ? "bg-emerald-500 text-black"
                        : "border border-black/10 bg-white/80 text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70"
                    )}
                  >
                    {analytics ? "Açık" : "Kapalı"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5 sm:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">Pazarlama</div>
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                      Kişiselleştirilmiş içerik/yeniden hedefleme.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMarketing((s) => !s)}
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-black transition",
                      marketing
                        ? "bg-emerald-500 text-black"
                        : "border border-black/10 bg-white/80 text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70"
                    )}
                  >
                    {marketing ? "Açık" : "Kapalı"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={saving}
              onClick={rejectAll}
              className={clsx(
                "rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold text-black/75 hover:bg-black/10 transition",
                "dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10",
                saving && "opacity-60 cursor-not-allowed"
              )}
            >
              Reddet (Sadece Zorunlu)
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={savePrefs}
              className={clsx(
                "rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-extrabold text-emerald-900 hover:bg-emerald-500/15 transition",
                "dark:text-emerald-100",
                saving && "opacity-60 cursor-not-allowed"
              )}
            >
              Tercihleri Kaydet
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={acceptAll}
              className={clsx(
                "rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
                saving && "opacity-60 cursor-not-allowed"
              )}
            >
              {saving ? "Kaydediliyor…" : "Hepsini Kabul Et"}
            </button>
          </div>

          <div className="mt-3 text-[11px] text-black/50 dark:text-white/50">
            Tercihlerini daha sonra <b>/privacy</b> sayfasından veya ayarlardan değiştirebilirsin.
          </div>
        </div>
      </div>
    </div>
  );
}