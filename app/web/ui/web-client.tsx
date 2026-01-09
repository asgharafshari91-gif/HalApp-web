"use client";

import LiveGrid from "@/components/live/LiveGrid";
import LivePreview from "@/components/live/LivePreview";

export default function WebClient() {
  return (
    <main className="relative w-full max-w-full overflow-x-clip">
      {/* Premium Background (light + dark uyumlu) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* light */}
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px] dark:hidden" />
        <div className="absolute -bottom-40 left-10 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[120px] dark:hidden" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_0%,rgba(16,185,129,0.12),transparent_60%)] dark:hidden" />

        {/* dark */}
        <div className="hidden dark:block absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-[120px]" />
        <div className="hidden dark:block absolute -bottom-40 left-10 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(800px_circle_at_50%_0%,rgba(16,185,129,0.10),transparent_60%)]" />
      </div>

      <div className="mx-auto w-full max-w-6xl min-w-0 px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* HERO */}
        <section className="relative max-w-full overflow-x-clip overflow-y-visible rounded-3xl border border-black/10 bg-white/70 p-6 sm:p-10 backdrop-blur-xl shadow-[0_18px_80px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_80px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* Badge */}
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">Türkiye’nin Hal’i — HalApp Web</span>
          </div>

          <div className="mt-5 grid min-w-0 max-w-full gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left */}
            <div className="min-w-0 lg:col-span-7">
              <h1 className="break-words text-3xl sm:text-5xl font-black leading-tight text-zinc-900 dark:text-white">
                HalApp ile{" "}
                <span className="text-emerald-600 dark:text-emerald-300">
                  canlı ilanları
                </span>{" "}
                takip et, üretici & alıcıyı{" "}
                <span className="text-emerald-600 dark:text-emerald-300">
                  anında
                </span>{" "}
                buluştur.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-zinc-700 leading-relaxed dark:text-white/70">
                Mobil uygulamadaki ilanlar Supabase üzerinden web’e yansır.
                Premium tasarım, hızlı erişim, temiz arayüz.
              </p>

              {/* CTA */}
              <div className="mt-6 max-w-full min-w-0 overflow-x-hidden">
                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href="#live"
                    className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-black hover:bg-emerald-400 transition sm:w-auto"
                  >
                    Web’e Gir (Canlı İlanlar)
                  </a>

                  <a
                    href="#pricing"
                    className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-5 py-3 text-sm font-extrabold text-zinc-900 hover:bg-black/[0.06] transition dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10 sm:w-auto"
                  >
                    Premium Paketler
                  </a>

                  <a
                    href="#download"
                    className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-sm font-extrabold text-emerald-800 hover:bg-emerald-500/15 transition dark:text-emerald-200 sm:w-auto"
                  >
                    Uygulamayı İndir
                  </a>
                </div>
              </div>

              {/* Features */}
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { t: "Hızlı", d: "Canlı ilanlar, net kartlar" },
                  { t: "Güvenli", d: "Supabase + RLS mimarisi" },
                  { t: "Premium", d: "Modern UI / premium tipografi" },
                ].map((x) => (
                  <div
                    key={x.t}
                    className="min-w-0 rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="truncate text-sm font-extrabold text-zinc-900 dark:text-white">
                      {x.t}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-white/65">
                      {x.d}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right preview */}
            <div className="min-w-0 lg:col-span-5">
              <LivePreview />
            </div>
          </div>
        </section>

        {/* LIVE */}
        <section id="live" className="mt-10 min-w-0 max-w-full overflow-x-clip">
          <LiveGrid />
        </section>

        {/* PRICING */}
        <section id="pricing" className="mt-14">
          <div className="max-w-full overflow-x-clip rounded-3xl border border-black/10 bg-white/70 p-6 sm:p-10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex min-w-0 flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                  Premium Paketler
                </h2>
                <p className="mt-2 text-zinc-700 dark:text-white/65">
                  Bir sonraki adımda burayı %100 premium pricing kartlarına çevireceğiz.
                </p>
              </div>

              <a
                href="#download"
                className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-black hover:bg-emerald-400 transition sm:w-auto"
              >
                Premium’a Geç
              </a>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-sm font-black text-zinc-900 dark:text-white">Free</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-white/60">Web’de ilanları gör</div>
                <div className="mt-4 text-2xl font-black text-zinc-900 dark:text-white">0₺</div>
                <div className="mt-4 h-10 rounded-xl bg-black/[0.04] dark:bg-white/5" />
              </div>

              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
                <div className="text-sm font-black text-emerald-800 dark:text-emerald-200">Premium</div>
                <div className="mt-1 text-xs text-zinc-700 dark:text-white/70">Boost + filtre + hızlı erişim</div>
                <div className="mt-4 text-2xl font-black text-zinc-900 dark:text-white">Yakında</div>
                <div className="mt-4 h-10 rounded-xl bg-emerald-500/20" />
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-sm font-black text-zinc-900 dark:text-white">Kurumsal</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-white/60">Toptancı / Hal yönetimi</div>
                <div className="mt-4 text-2xl font-black text-zinc-900 dark:text-white">Yakında</div>
                <div className="mt-4 h-10 rounded-xl bg-black/[0.04] dark:bg-white/5" />
              </div>
            </div>
          </div>
        </section>

        {/* DOWNLOAD */}
        <section id="download" className="mt-14">
          <div className="relative max-w-full overflow-x-clip rounded-3xl border border-black/10 bg-white/70 p-6 sm:p-10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">HalApp’i indir</h2>
            <p className="mt-2 text-zinc-700 dark:text-white/65">
              Ana CTA: Uygulamayı indir veya web’den devam et.
            </p>

            <div className="mt-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#"
                className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-black hover:bg-emerald-400 transition sm:w-auto"
              >
                App Store (yakında)
              </a>
              <a
                href="#"
                className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] px-5 py-3 text-sm font-extrabold text-zinc-900 hover:bg-black/[0.06] transition dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10 sm:w-auto"
              >
                Google Play (yakında)
              </a>
              <a
                href="#live"
                className="inline-flex w-full shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-sm font-extrabold text-emerald-800 hover:bg-emerald-500/15 transition dark:text-emerald-200 sm:w-auto"
              >
                Web’den devam et
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-14 pb-10 text-center text-xs text-zinc-600 dark:text-white/55">
          ©️ 2026 HalApp • halapp.tr
        </footer>
      </div>
    </main>
  );
}