// app/ui/home-client.tsx
"use client";

import LiveGrid from "@/components/live/LiveGrid";
import LivePreview from "@/components/live/LivePreview";

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
        {value}
      </div>
      <div className="mt-1 text-sm font-semibold text-zinc-600 dark:text-white/60">
        {label}
      </div>
    </div>
  );
}

function Feature({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-black/10 bg-white/70 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition group-hover:scale-125" />

      <div className="relative z-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
          {icon}
        </div>

        <div className="mt-5 text-lg font-black text-zinc-900 dark:text-white">
          {title}
        </div>

        <div className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/65">
          {desc}
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  desc,
  featured,
}: {
  title: string;
  price: string;
  desc: string;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[32px] border p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1",
        featured
          ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_20px_90px_rgba(16,185,129,0.18)]"
          : "border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.04]",
      ].join(" ")}
    >
      {featured ? (
        <div className="absolute right-4 top-4 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-900 dark:text-emerald-100">
          ÖNERİLEN
        </div>
      ) : null}

      <div className="text-lg font-black text-zinc-900 dark:text-white">
        {title}
      </div>

      <div className="mt-4 text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
        {price}
      </div>

      <div className="mt-3 text-sm leading-6 text-zinc-600 dark:text-white/65">
        {desc}
      </div>

      <button
        className={[
          "mt-6 w-full rounded-2xl px-5 py-3 text-sm font-black transition",
          featured
            ? "bg-emerald-500 text-black hover:bg-emerald-400"
            : "border border-black/10 bg-black/[0.04] text-zinc-900 hover:bg-black/[0.08] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
        ].join(" ")}
      >
        Başla
      </button>
    </div>
  );
}

export default function HomeClient() {
  return (
    <main className="relative overflow-x-clip">
      {/* PREMIUM BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[-200px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-[0%] top-[120px] h-[480px] w-[480px] rounded-full bg-emerald-400/10 blur-[140px]" />
        <div className="absolute bottom-[-200px] left-[20%] h-[520px] w-[520px] rounded-full bg-emerald-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[38px] border border-black/10 bg-white/75 p-7 shadow-[0_20px_100px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_20px_100px_rgba(0,0,0,0.45)] sm:p-10 lg:p-14">
          {/* glow */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative z-10 grid gap-14 lg:grid-cols-12 lg:items-center">
            {/* LEFT */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-black text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                CANLI HAL SİSTEMİ • HALAPP WEB
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
                Türkiye’nin
                <span className="text-emerald-600 dark:text-emerald-300">
                  {" "}premium{" "}
                </span>
                hal & ilan platformu.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-700 dark:text-white/70 sm:text-lg">
                Üretici, komisyoncu, tüccar ve alıcıları aynı platformda
                buluşturan modern nesil hal sistemi. Canlı ilanlar, premium vitrin,
                hızlı mesajlaşma ve gerçek zamanlı piyasa akışı.
              </p>

              {/* CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#live"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-black transition hover:scale-[1.02] hover:bg-emerald-400"
                >
                  Canlı İlanlara Gir
                </a>

                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-6 py-4 text-sm font-black text-zinc-900 transition hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Premium Paketler
                </a>

                <a
                  href="#download"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-500/15 dark:text-emerald-200"
                >
                  Uygulamayı İndir
                </a>
              </div>

              {/* STATS */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <Stat value="7/24" label="Canlı İlan Akışı" />
                <Stat value="Hızlı" label="Gerçek Zamanlı Mesajlaşma" />
                <Stat value="Premium" label="Modern Hal Deneyimi" />
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-5">
              <LivePreview />
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-16">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                Neden HalApp?
              </div>

              <div className="mt-2 text-zinc-600 dark:text-white/60">
                Modern nesil hal & ilan altyapısı.
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Feature
              icon="⚡"
              title="Canlı Sistem"
              desc="İlanlar mobil uygulamadan web’e gerçek zamanlı yansır."
            />

            <Feature
              icon="💬"
              title="Hızlı Mesajlaşma"
              desc="Alıcı ve satıcıyı anında buluşturan modern chat sistemi."
            />

            <Feature
              icon="🛡️"
              title="Güvenli Altyapı"
              desc="Supabase + RLS ile güvenli premium mimari."
            />

            <Feature
              icon="🚀"
              title="Premium Deneyim"
              desc="Modern arayüz, yüksek performans, profesyonel görünüm."
            />
          </div>
        </section>

        {/* LIVE */}
        <section id="live" className="mt-16">
          <LiveGrid />
        </section>

        {/* PRICING */}
        <section id="pricing" className="mt-20">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                Premium Paketler
              </div>

              <div className="mt-2 text-zinc-600 dark:text-white/60">
                HalApp premium üyelik sistemi.
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <PricingCard
              title="Free"
              price="0₺"
              desc="Canlı ilanları görüntüle, temel sistemi kullan."
            />

            <PricingCard
              featured
              title="Premium"
              price="Yakında"
              desc="Boost, premium vitrin, filtreler ve öncelikli görünürlük."
            />

            <PricingCard
              title="Kurumsal"
              price="Yakında"
              desc="Hal yönetimi, büyük üretici & tüccar çözümleri."
            />
          </div>
        </section>

        {/* DOWNLOAD */}
        <section id="download" className="mt-20">
          <div className="relative overflow-hidden rounded-[38px] border border-black/10 bg-white/75 p-8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] sm:p-12">
            <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <div className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                HalApp’i şimdi keşfet.
              </div>

              <div className="mt-4 text-lg leading-8 text-zinc-700 dark:text-white/65">
                Mobil uygulama çok yakında App Store ve Google Play’de.
                Şimdilik canlı sistemi web üzerinden kullanabilirsin.
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-black transition hover:bg-emerald-400"
                >
                  App Store
                </a>

                <a
                  href="#"
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-6 py-4 text-sm font-black text-zinc-900 transition hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Google Play
                </a>

                <a
                  href="#live"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-500/15 dark:text-emerald-200"
                >
                  Web’den Devam Et
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pb-8 pt-16 text-center">
          <div className="text-sm font-semibold text-zinc-600 dark:text-white/50">
            ©️ 2026 HalApp • Türkiye’nin Premium Hal Platformu
          </div>
        </footer>
      </div>
    </main>
  );
}