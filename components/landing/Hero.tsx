"use client";

import Link from "next/link";
import HalappLogo from "@/components/halapp-logo";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        {/* gradient wash */}
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-40 right-[-120px] h-[420px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />
        {/* subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:46px_46px] opacity-[0.08]" />
        {/* vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-white/75">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Canlı ilanlar • anlık akış • hızlı iletişim
            </div>

            <h1 className="mt-5 text-balance text-4xl font-black tracking-tight text-white sm:text-5xl">
              HalApp ile
              <span className="relative mx-2 inline-block">
                <span className="absolute -inset-1 -z-10 rounded-xl bg-emerald-500/20 blur-lg" />
                <span className="text-emerald-300">premium</span>
              </span>
              ilan akışı ve hızlı satış.
            </h1>

            <p className="mt-4 max-w-xl text-pretty text-base font-semibold leading-relaxed text-white/70 sm:text-lg">
              Ürün ilanlarını saniyeler içinde paylaş, alıcılarla hemen yazış.
              Premium görünürlük ile ilanların üst sıralarda kalsın.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#indir"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-extrabold text-white/90 hover:bg-white/10 transition"
              >
                İndir
                <span className="ml-2 rounded-xl bg-white/10 px-2 py-1 text-[11px] font-black text-white/80">
                  iOS / Android
                </span>
              </a>

              <Link
                href="/webapp"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:bg-emerald-400 transition shadow-[0_18px_55px_rgba(16,185,129,0.25)]"
              >
                Web’e Gir
                <span className="ml-2 rounded-xl bg-zinc-950/10 px-2 py-1 text-[11px] font-black">
                  Live
                </span>
              </Link>

              <div className="flex items-center gap-3 text-xs font-bold text-white/55">
                <span className="h-8 w-px bg-white/10 hidden sm:block" />
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  Supabase ile gerçek zamanlı
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <Stat k="Canlı" v="İlan Akışı" />
              <Stat k="Hızlı" v="Mesajlaşma" />
              <Stat k="Premium" v="Vitrin" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full bg-emerald-500/10 blur-2xl" />

            <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5 shadow-[0_26px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <HalappLogo withText={false} />
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-extrabold text-emerald-200 ring-1 ring-emerald-400/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live Preview
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-white/60">
                      Öne Çıkan İlan
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      Domates • 1. Sınıf
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/60">
                      Antalya / Kepez • Hal
                    </div>
                  </div>
                  <div className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-black text-zinc-950">
                    19.5 ₺ <span className="text-[11px] font-extrabold">/ kg</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <MiniPill text="Boost" />
                  <MiniPill text="Anlık" />
                  <MiniPill text="Güvenli" />
                </div>

                <div className="mt-4 h-px bg-white/10" />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InfoRow label="Min. Miktar" value="500 kg" />
                  <InfoRow label="Teslim" value="Aynı gün" />
                  <InfoRow label="Ödeme" value="Anlaşmalı" />
                  <InfoRow label="Durum" value="Aktif" accent />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <GlassCard title="Premium Vitrin" desc="İlanların üstte kalsın." />
                <GlassCard title="Hızlı Sohbet" desc="Alıcıyla anında konuş." />
              </div>
            </div>

            {/* small note */}
            <p className="mt-4 text-center text-xs font-semibold text-white/50">
              HalApp Web — canlı ilanları görüntüle, uygulamaya yönlendir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-sm font-black text-white">{k}</div>
      <div className="mt-1 text-xs font-semibold text-white/55">{v}</div>
    </div>
  );
}

function MiniPill({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-extrabold text-white/70">
      {text}
    </div>
  );
}

function InfoRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] font-extrabold text-white/50">{label}</div>
      <div
        className={[
          "mt-1 text-sm font-black",
          accent ? "text-emerald-300" : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function GlassCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-black text-white">{title}</div>
      <div className="mt-1 text-xs font-semibold text-white/55">{desc}</div>
    </div>
  );
}