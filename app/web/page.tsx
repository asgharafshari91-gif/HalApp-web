"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

type Cat = {
  id: string;
  name: string;
  image: string; // public path
  kind: "Meyve" | "Sebze";
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function WebHomePage() {
  const categories: Cat[] = useMemo(
    () => [
      { id: "domates", name: "Domates", image: "/products/domates.jpg", kind: "Sebze" },
      { id: "salatalik", name: "Salatalık", image: "/products/salatalik.jpg", kind: "Sebze" },
      { id: "biber", name: "Biber", image: "/products/biber.jpg", kind: "Sebze" },
      { id: "patlican", name: "Patlıcan", image: "/products/patlican.jpg", kind: "Sebze" },
      { id: "patates", name: "Patates", image: "/products/patates.jpg", kind: "Sebze" },
      { id: "sogan", name: "Soğan", image: "/products/sogan.jpg", kind: "Sebze" },

      { id: "elma", name: "Elma", image: "/products/elma.jpg", kind: "Meyve" },
      { id: "muz", name: "Muz", image: "/products/muz.jpg", kind: "Meyve" },
      { id: "portakal", name: "Portakal", image: "/products/portakal.jpg", kind: "Meyve" },
      { id: "mandalina", name: "Mandalina", image: "/products/mandalina.jpg", kind: "Meyve" },
      { id: "nar", name: "Nar", image: "/products/nar.jpg", kind: "Meyve" },
      { id: "uzum", name: "Üzüm", image: "/products/uzum.jpg", kind: "Meyve" },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { t: "Canlı Akış", d: "Realtime ilanlar", k: "⚡" },
      { t: "Mesajlaşma", d: "Hızlı iletişim", k: "💬" },
      { t: "Premium", d: "Boost & vitrin", k: "✨" },
    ],
    []
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* HERO (ultra premium) */}
      <section className="relative overflow-hidden rounded-[34px] border border-black/10 bg-white/75 p-6 shadow-[0_22px_90px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_110px_rgba(0,0,0,0.55)] sm:p-10">
        {/* glow */}
        <div className="pointer-events-none absolute -left-28 -top-28 h-[360px] w-[360px] rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_40%_0%,rgba(16,185,129,0.10),transparent_60%)] dark:bg-[radial-gradient(800px_circle_at_40%_0%,rgba(16,185,129,0.12),transparent_60%)]" />

        <div className="relative">
          {/* top badge row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              HalApp Web • Premium Hal & İlan Platformu
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/live"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-400"
              >
                Canlı İlanlara Gir →
              </Link>

              <Link
                href="/conversations"
                className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-5 py-3 text-sm font-extrabold text-black/75 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              >
                Mesajlar
              </Link>

              <Link
                href="/pazar"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-500/15 dark:text-emerald-200"
              >
                Pazar
              </Link>
            </div>
          </div>

          {/* headline */}
          <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-black/90 dark:text-white sm:text-5xl">
                Meyve & sebze piyasasını{" "}
                <span className="text-emerald-700 dark:text-emerald-300">canlı</span> takip et, alıcı &
                satıcıyı{" "}
                <span className="text-emerald-700 dark:text-emerald-300">anında</span> buluştur.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/60 dark:text-white/60 sm:text-lg">
                Realtime ilan akışı, premium vitrin ve hızlı mesajlaşma. Web’den giriş yap, piyasayı cebinde taşı.
              </p>

              {/* mini stats */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <div
                    key={s.t}
                    className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_14px_45px_rgba(0,0,0,0.45)]"
                  >
                    <div className="text-sm font-black text-black/85 dark:text-white/85">
                      <span className="mr-2">{s.k}</span>
                      {s.t}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-black/55 dark:text-white/55">{s.d}</div>
                  </div>
                ))}
              </div>

              {/* quick actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/live"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-400"
                >
                  Realtime Akışı Aç
                </Link>

                <Link
                  href="/favorites"
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-extrabold text-black/80 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white/85 dark:hover:bg-white/[0.06]"
                >
                  Favoriler
                </Link>

                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-500/15 dark:text-emerald-200"
                >
                  Premium Paketler
                </Link>
              </div>
            </div>

            {/* right preview card */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-white/70 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_90px_rgba(0,0,0,0.55)]">
                <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/12 blur-3xl" />

                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-black/85 dark:text-white/85">Hızlı Kategori Seç</div>
                  <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                    HOME
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {categories.slice(0, 4).map((c) => (
                    <Link
                      key={c.id}
                      href={`/live?cat=${encodeURIComponent(c.id)}`}
                      className="group flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                        <Image src={c.image} alt={c.name} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.05]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black text-black/85 dark:text-white/85">{c.name}</div>
                        <div className="mt-0.5 text-xs text-black/55 dark:text-white/55">Canlı ilanları gör</div>
                      </div>
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">→</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 text-xs text-black/50 dark:text-white/50">
                  İpucu: Kategori seçince otomatik canlı ilan filtresine gider.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES (premium section) */}
      <section className="rounded-[34px] border border-black/10 bg-white/75 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_90px_rgba(0,0,0,0.50)] sm:p-6">
        <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-black/90 dark:text-white/90">Kategoriler</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              Meyve ve sebzeleri görselleriyle seç, canlı ilana geç.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              Tüm İlanlar →
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/live?cat=${encodeURIComponent(c.id)}`}
              className={cn(
                "group relative overflow-hidden rounded-[26px] border border-black/10 bg-white/70 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition",
                "hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
              )}
            >
              {/* hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -inset-10 bg-[radial-gradient(circle_at_25%_15%,rgba(34,197,94,.16),transparent_55%)]" />
              </div>

              <div className="relative flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-base font-black text-black/90 dark:text-white/90">{c.name}</div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-200">
                      {c.kind}
                    </span>
                  </div>

                  <div className="mt-1 text-sm text-black/55 dark:text-white/55">Canlı ilanları gör</div>
                </div>

                <div className="shrink-0 rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-2 text-xs font-black text-black/70 transition group-hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:group-hover:bg-white/10">
                  Aç →
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="px-2 pt-5 text-xs text-black/50 dark:text-white/50">
          Not: Görselleri <span className="font-mono">/public/products</span> içine koyarsan kartlar tam premium görünür.
        </div>
      </section>

      {/* CTA footer */}
      <section className="relative overflow-hidden rounded-[34px] border border-black/10 bg-white/75 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_90px_rgba(0,0,0,0.50)] sm:p-10">
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_70%_10%,rgba(16,185,129,0.10),transparent_55%)]" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-black text-black/90 dark:text-white/90">Hazır mısın?</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Canlı akışı aç, ilanları takip et, satıcılarla anında konuş.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-400"
            >
              Canlı İlanları Aç →
            </Link>
            <Link
              href="/download"
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-5 py-3 text-sm font-extrabold text-black/75 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            >
              Uygulamayı İndir
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}