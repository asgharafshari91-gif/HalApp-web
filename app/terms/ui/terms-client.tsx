"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Badge({
  children,
  variant = "emerald",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "sky" | "amber" | "rose";
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
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold",
        cls
      )}
    >
      {children}
    </span>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black tracking-tight">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 prose prose-zinc max-w-none dark:prose-invert prose-p:leading-7 prose-li:leading-7">
        {children}
      </div>
    </section>
  );
}

export default function TermsClient() {
  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  }, []);

  useEffect(() => {
    // build-safe (client only)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as any });
    }
  }, []);

  function openCookiePrefs() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("halapp-open-cookie-consent"));
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* HERO */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight">
              Kullanım Şartları
            </div>
            <div className="mt-2 text-sm text-black/60 dark:text-white/60">
              HalApp (“Platform”) hizmetlerini kullanan tüm kullanıcılar bu
              şartları kabul etmiş sayılır.{" "}
              <span className="ml-2 inline-block">
                <Badge variant="sky">Güncelleme: {today}</Badge>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
              >
                ← Ana sayfa
              </Link>

              <Link
                href="/privacy"
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white/80 dark:hover:bg-black/20 transition"
              >
                KVKK & Çerez Politikası →
              </Link>

              <button
                type="button"
                onClick={openCookiePrefs}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
              >
                Çerez Tercihlerini Yönet
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
              Kısa Özet
            </div>
            <ul className="mt-2 space-y-2 text-sm text-black/70 dark:text-white/70">
              <li>• İlan içeriklerinden kullanıcı sorumludur.</li>
              <li>• Dolandırıcılık / spam / sahtecilik yasaktır.</li>
              <li>• KYC/kimlik doğrulama güvenlik için talep edilebilir.</li>
            </ul>
          </div>
        </div>
      </div>

      <Card title="1) Tanımlar" subtitle="Şartlarda geçen bazı temel kavramlar.">
        <ul>
          <li>
            <b>Platform:</b> HalApp web/mobil hizmetleri ve ilgili altyapı.
          </li>
          <li>
            <b>Kullanıcı:</b> Platforma üye olan veya hizmetleri kullanan
            gerçek/tüzel kişi.
          </li>
          <li>
            <b>İlan:</b> Ürün/hizmet tanıtımı, fiyat, stok, görsel ve diğer
            içerikler.
          </li>
          <li>
            <b>Premium:</b> Ücretli özellikler (vitrin, öne çıkarma, gelişmiş
            araçlar vb.).
          </li>
        </ul>
      </Card>

      <Card title="2) Hizmetin Kapsamı" subtitle="HalApp ne sağlar, ne sağlamaz.">
        <>
          <p>
            HalApp; canlı ilan akışı, ilan yayınlama, favoriler, mesajlaşma ve
            kullanıcı profili gibi özellikler sunar. HalApp bir “pazar yeri”
            deneyimi sunar ancak satıcı/alıcı arasındaki anlaşmanın tarafı
            değildir.
          </p>
          <ul>
            <li>
              İlanların doğruluğundan, ürünün niteliğinden ve teslimat/ödeme
              süreçlerinden ilgili kullanıcı sorumludur.
            </li>
            <li>
              HalApp, şüpheli işlemleri güvenlik amacıyla inceleyebilir ve
              gerekli gördüğünde kısıtlama uygulayabilir.
            </li>
          </ul>
        </>
      </Card>

      <Card
        title="3) Üyelik ve Hesap Güvenliği"
        subtitle="Hesabın korunması ve sorumluluklar."
      >
        <ul>
          <li>Kullanıcı, hesap bilgilerini gizli tutmakla yükümlüdür.</li>
          <li>Hesap üzerinden yapılan işlemler kullanıcı tarafından yapılmış kabul edilir.</li>
          <li>Şüpheli durumda kullanıcı destek kanalına derhal bildirim yapmalıdır.</li>
        </ul>
      </Card>

      <Card title="4) İlan Kuralları" subtitle="Platformun kalitesini korumak için temel kurallar.">
        <>
          <ul>
            <li>Sahte, yanıltıcı, eksik bilgi içeren ilanlar yasaktır.</li>
            <li>Spam / kopya ilan / aldatıcı fiyatlandırma yasaktır.</li>
            <li>Hukuka aykırı ürün/hizmet ilanları yasaktır.</li>
            <li>
              Başkasına ait görsel/marka/kişisel veri paylaşımı için gerekli haklar kullanıcıya aittir.
            </li>
          </ul>
          <p>Kurallara aykırı içerikler kaldırılabilir, hesaplar kısıtlanabilir veya kapatılabilir.</p>
        </>
      </Card>

      <Card title="5) Mesajlaşma Kuralları" subtitle="Güvenli iletişim ve kötüye kullanım.">
        <ul>
          <li>Hakaret, tehdit, taciz, ısrarlı mesaj yasaktır.</li>
          <li>Dolandırıcılık amacıyla link/ödeme yönlendirmesi yapan hesaplar engellenebilir.</li>
          <li>Güvenlik şikayetleri kapsamında gerekli incelemeler yapılabilir.</li>
        </ul>
      </Card>

      <Card title="6) Premium Üyelik" subtitle="Ücretli özellikler ve kullanım şartları.">
        <ul>
          <li>Premium özellikler dönemsel olarak değişebilir.</li>
          <li>Ödeme/abonelik detayları ilgili ekranda belirtilir.</li>
          <li>Suistimal tespitinde premium özellikler askıya alınabilir.</li>
        </ul>
      </Card>

      <Card title="7) KYC / Doğrulama" subtitle="Kimlik doğrulama, güvenlik ve uyum.">
        <>
          <p>
            HalApp, güvenliği artırmak amacıyla kimlik doğrulama (KYC) isteyebilir.
            KYC sürecinde iletilen belgeler, KVKK & Çerez Politikası sayfasındaki aydınlatma kapsamında işlenir.
          </p>
          <p>KYC durumuna göre hesapta bazı özellikler kısıtlanabilir veya açılabilir.</p>
        </>
      </Card>

      <Card title="8) Fikri Mülkiyet" subtitle="İçerik hakları ve platform tasarımı.">
        <p>
          HalApp marka, tasarım ve yazılımı HalApp’a aittir. Kullanıcı, ilan içeriğinin haklarına sahip olduğunu beyan eder.
          HalApp, ilanların platformda gösterimi için gerekli ölçüde kullanım hakkı elde eder.
        </p>
      </Card>

      <Card title="9) Sorumluluğun Sınırlandırılması" subtitle="Hizmetin doğası gereği sınırlamalar.">
        <ul>
          <li>HalApp, ilanların doğruluğu veya satıcı/alıcı anlaşmalarından sorumlu değildir.</li>
          <li>Kesintiler, bakım, altyapı arızaları gibi durumlarda hizmet geçici olarak durabilir.</li>
        </ul>
      </Card>

      <Card title="10) Uyuşmazlık ve Değişiklikler" subtitle="Şartların güncellenmesi.">
        <>
          <p>HalApp bu şartları güncelleyebilir. Güncellemeler platformda yayınlandığı andan itibaren geçerli olur.</p>
          <p>Uyuşmazlıklarda kullanıcı destek kanalı üzerinden çözüm aranır.</p>
        </>
      </Card>

      <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        Bu metin bilgilendirme amaçlıdır. KVKK ve Çerez tercihleriniz için{" "}
        <Link className="font-bold" href="/privacy">
          /privacy
        </Link>{" "}
        sayfasını kullanın.
      </div>
    </div>
  );
}