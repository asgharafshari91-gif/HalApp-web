"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { readConsent, writeConsent, ConsentState } from "@/lib/consent";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Section({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black tracking-tight">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 text-sm text-black/70 dark:text-white/70 leading-7">
        {children}
      </div>
    </section>
  );
}

function Badge({
  children,
  variant = "emerald",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "sky" | "rose";
}) {
  const cls =
    variant === "amber"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      : variant === "sky"
      ? "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200"
      : variant === "rose"
      ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold", cls)}>
      {children}
    </span>
  );
}

function SwitchPill({
  label,
  desc,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  desc: string;
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black text-black/85 dark:text-white/85">{label}</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">{desc}</div>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          className={clsx(
            "shrink-0 rounded-full px-3 py-1 text-xs font-black transition",
            on
              ? "bg-emerald-500 text-black"
              : "border border-black/10 bg-white/80 text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          {on ? "Açık" : "Kapalı"}
        </button>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  // consent state
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // legal must
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [explicitConsent, setExplicitConsent] = useState(false);

  useEffect(() => {
    setMounted(true);
    const c = readConsent();
    if (!c) return;

    setAnalytics(Boolean(c.analytics));
    setMarketing(Boolean(c.marketing));
    setTermsAccepted(Boolean(c.termsAccepted));
    setPrivacyAccepted(Boolean(c.privacyAccepted));
    setExplicitConsent(Boolean(c.explicitConsent));
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
    // ✅ yaz + event dispatch (lib/consent bunu yapıyor)
    writeConsent(v);

    // ✅ ConsentScripts’in anında haberi olsun (bazı eski kodlar için ekstra)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("halapp-consent-changed", { detail: v }));
      window.dispatchEvent(new Event("halapp-consent-refresh"));
    }
  }

  async function savePrefs() {
    if (!legalOk) {
      toast({
        variant: "warning",
        title: "Zorunlu onaylar eksik",
        message: "Şartlar + KVKK/Çerez + Açık Rıza onaylarını işaretlemeden kaydedemezsin.",
      });
      return;
    }

    setSaving(true);
    try {
      await persist(buildConsent({ analytics, marketing }));
      toast({ variant: "success", title: "Kaydedildi", message: "Tercihlerin güncellendi.", durationMs: 1400 });
    } finally {
      setSaving(false);
    }
  }

  async function acceptAll() {
    if (!legalOk) {
      toast({
        variant: "warning",
        title: "Zorunlu onaylar eksik",
        message: "Şartlar + KVKK/Çerez + Açık Rıza onaylarını işaretlemeden devam edemezsin.",
      });
      return;
    }
    setSaving(true);
    try {
      await persist(buildConsent({ analytics: true, marketing: true }));
      setAnalytics(true);
      setMarketing(true);
      toast({ variant: "success", title: "Kabul edildi", message: "Tüm tercihler aktif.", durationMs: 1400 });
    } finally {
      setSaving(false);
    }
  }

  async function onlyNecessary() {
    if (!legalOk) {
      toast({
        variant: "warning",
        title: "Zorunlu onaylar eksik",
        message: "En azından metinleri okuyup onaylamalısın. (Yasal zorunluluk)",
      });
      return;
    }
    setSaving(true);
    try {
      await persist(buildConsent({ analytics: false, marketing: false }));
      setAnalytics(false);
      setMarketing(false);
      toast({ variant: "info", title: "Kaydedildi", message: "Sadece zorunlu çerezler aktif.", durationMs: 1400 });
    } finally {
      setSaving(false);
    }
  }

  function resetConsent() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("halapp-consent-v1");
      document.cookie = "halapp_consent_v1=; Max-Age=0; path=/; SameSite=Lax";
      window.dispatchEvent(new Event("halapp-consent-refresh"));
      toast({ variant: "info", title: "Sıfırlandı", message: "Consent temizlendi. Banner tekrar çıkar." });
    } catch {}
  }

  if (!mounted) return null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Header */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight">KVKK • Çerez Politikası • Şartlar • Açık Rıza</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              HalApp’ta veri işleme, çerezler ve kullanıcı onayları burada yönetilir.
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={legalOk ? "emerald" : "amber"}>Yasal Onaylar: {legalOk ? "Tam" : "Eksik"}</Badge>
              <Badge variant={analytics ? "emerald" : "sky"}>Analytics: {analytics ? "Açık" : "Kapalı"}</Badge>
              <Badge variant={marketing ? "emerald" : "sky"}>Marketing: {marketing ? "Açık" : "Kapalı"}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
            >
              Ana Sayfa
            </Link>
            <button
              type="button"
              onClick={resetConsent}
              className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-sm font-extrabold text-rose-700 hover:bg-rose-500/15 dark:text-rose-200 transition"
            >
              Tercihleri Sıfırla
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-lg font-black">Tercihler</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          Zorunlu çerezler her zaman aktif. Analytics/Pazarlama sadece onay verirsen.
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-black">Zorunlu</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">
              Oturum yönetimi, güvenlik, dolandırıcılık önleme, temel site fonksiyonları.
            </div>
            <div className="mt-3 inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-900 dark:text-emerald-100">
              Aktif
            </div>
          </div>

          <SwitchPill
            label="Analitik"
            desc="Trafik/performans ölçümü, hata analizi ve ürün iyileştirme."
            on={analytics}
            onToggle={() => setAnalytics((s) => !s)}
          />

          <div className="sm:col-span-2">
            <SwitchPill
              label="Pazarlama"
              desc="Kişiselleştirilmiş içerik ve yeniden hedefleme (onaylı olursa)."
              on={marketing}
              onToggle={() => setMarketing((s) => !s)}
            />
          </div>
        </div>

        {/* Legal must */}
        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-sm font-black text-black/85 dark:text-white/85">
            Zorunlu Yasal Onaylar
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            Devam etmek ve hesabını/uygulamayı kullanmak için aşağıdaki 3 onay zorunludur.
          </div>

          <div className="mt-3 grid gap-2">
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
              <div className="mt-1 text-[12px] font-semibold text-black/60 dark:text-white/60">
                Kaydetmek için 3 zorunlu onayı işaretlemelisin.
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={saving}
              onClick={onlyNecessary}
              className={clsx(
                "rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold text-black/75 hover:bg-black/10 transition",
                "dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10",
                saving && "opacity-60 cursor-not-allowed"
              )}
            >
              Sadece Zorunlu
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
        </div>
      </div>

      {/* Terms */}
      <Section
        title="Kullanım Şartları"
        subtitle="Platformu kullanarak aşağıdaki şartları kabul etmiş olursun."
      >
        <ul className="list-disc pl-5 space-y-2">
          <li>
            HalApp, ilan yayınlama ve alıcı-satıcı iletişimi için aracılık sağlar. İlanların doğruluğundan ilan sahibi sorumludur.
          </li>
          <li>
            Kullanıcı; sahte, yanıltıcı, yasa dışı içerik yayınlamayacağını ve üçüncü kişilerin haklarını ihlal etmeyeceğini kabul eder.
          </li>
          <li>
            Mesajlaşma, ödeme/teslimat süreçleri tarafların sorumluluğundadır. HalApp dolandırıcılık/uyuşmazlık riskini azaltmak için KYC isteyebilir.
          </li>
          <li>
            HalApp, güvenlik ve kalite amaçlarıyla ilanları ve hesapları inceleyebilir; ihlalde askıya alma/silme uygulayabilir.
          </li>
        </ul>
      </Section>

      {/* KVKK */}
      <Section
        title="KVKK Aydınlatma Metni"
        subtitle="6698 sayılı KVKK kapsamında bilgilendirme."
      >
        <p>
          HalApp; hesap oluşturma, ilan yayınlama, mesajlaşma, müşteri desteği, güvenlik ve yasal yükümlülükler kapsamında kimlik,
          iletişim, adres ve kullanım verilerini işler. Veriler; hizmetin sağlanması, güvenliğin temini, hukuki yükümlülükler ve
          talep/şikâyet süreçleri için gerekli süre boyunca saklanır.
        </p>
        <p className="mt-3">
          KVKK kapsamındaki hakların (erişim, düzeltme, silme, itiraz vb.) için destek kanallarımız üzerinden başvurabilirsin.
        </p>
      </Section>

      {/* Cookie */}
      <Section
        title="Çerez Politikası"
        subtitle="Zorunlu/analitik/pazarlama çerezleri ve kullanım amaçları."
      >
        <ul className="list-disc pl-5 space-y-2">
          <li><b>Zorunlu çerezler:</b> Oturum, güvenlik, temel fonksiyonlar. Kapalı yapılamaz.</li>
          <li><b>Analitik çerezler:</b> Trafik ölçümü, performans analizi, ürün iyileştirme. Onay vermezsen çalışmaz.</li>
          <li><b>Pazarlama çerezleri:</b> Kişiselleştirme/yeniden hedefleme. Onay vermezsen çalışmaz.</li>
        </ul>
        <p className="mt-3">
          Analitik/pazarlama izni kapalı ise HalApp bu servislerin scriptlerini yüklemez ve tracking çağrısı yapmaz.
        </p>
      </Section>

      {/* Explicit */}
      <Section
        title="Açık Rıza Metni"
        subtitle="Analitik ve pazarlama amaçlı işleme için açık rıza beyanı."
      >
        <p>
          Analitik ve pazarlama çerezlerini kabul etmen halinde; cihaz/çerez kimlikleri, oturum ve kullanım istatistikleri gibi veriler,
          hizmetin iyileştirilmesi ve/veya kişiselleştirme amaçlarıyla işlenebilir. Bu onay isteğe bağlıdır; dilediğin zaman bu sayfadan
          geri alabilirsin.
        </p>
      </Section>

      {/* Bottom helper */}
      <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/65 dark:border-white/10 dark:bg-white/5 dark:text-white/65">
        <b>Not:</b> Eğer analytics kapalıysa, <code className="px-1">window.gtag</code> yoksa veya NO-OP ise
        hiçbir event gönderilmez. (HalApp tracking güvenlik kalkanı aktif.)
      </div>
    </div>
  );
}