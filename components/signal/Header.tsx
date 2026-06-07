"use client";

type HeaderProps = {
  lastRefresh?: string;
  totalSignals?: number;
  activeCities?: number;
  gpsRate?: number;
  onRefresh?: () => void;
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function MiniSparkline({
  tone = "emerald",
}: {
  tone?: "emerald" | "blue" | "purple" | "orange";
}) {
  const stroke =
    tone === "blue"
      ? "#2563eb"
      : tone === "purple"
      ? "#7c3aed"
      : tone === "orange"
      ? "#f97316"
      : "#16a34a";

  const fill =
    tone === "blue"
      ? "rgba(37,99,235,.10)"
      : tone === "purple"
      ? "rgba(124,58,237,.10)"
      : tone === "orange"
      ? "rgba(249,115,22,.10)"
      : "rgba(22,163,74,.10)";

  return (
    <svg viewBox="0 0 180 54" className="h-14 w-full overflow-visible">
      <defs>
        <linearGradient id={`sparkFill-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      <path
        d="M0 44 C18 38 23 46 37 35 C51 24 58 39 72 28 C89 15 97 24 110 19 C127 12 139 27 151 17 C164 7 171 12 180 6 L180 54 L0 54 Z"
        fill={`url(#sparkFill-${tone})`}
      />

      <path
        d="M0 44 C18 38 23 46 37 35 C51 24 58 39 72 28 C89 15 97 24 110 19 C127 12 139 27 151 17 C164 7 171 12 180 6"
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle cx="180" cy="6" r="4" fill={stroke} />
    </svg>
  );
}

function HeroStat({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "blue" | "purple" | "orange";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-500/15 bg-blue-500/8 text-blue-600 dark:text-blue-300"
      : tone === "purple"
      ? "border-purple-500/15 bg-purple-500/8 text-purple-600 dark:text-purple-300"
      : tone === "orange"
      ? "border-orange-500/15 bg-orange-500/8 text-orange-600 dark:text-orange-300"
      : "border-emerald-500/15 bg-emerald-500/8 text-emerald-600 dark:text-emerald-300";

  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.035]">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-zinc-900/[0.03] blur-3xl dark:bg-white/[0.05]" />

      <div className="relative flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-3xl ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-500 dark:text-white/50">
            {label}
          </div>

          <div className="mt-1 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            {value}
          </div>

          <div className={`mt-2 text-xs font-black ${toneClass.replace("border-", "").replace("bg-", "")}`}>
            {sub}
          </div>
        </div>
      </div>

      <div className="relative mt-3">
        <MiniSparkline tone={tone} />
      </div>
    </div>
  );
}

export default function Header({
  lastRefresh,
  totalSignals = 0,
  activeCities = 0,
  gpsRate = 0,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="overflow-hidden rounded-[36px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
        {/* Top bar */}
        <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-xl font-black text-white shadow-lg shadow-emerald-500/20 sm:flex">
              H
            </div>

            <div>
              <div className="text-sm font-black text-zinc-950 dark:text-white">
                Market Intelligence
              </div>
              <div className="text-xs font-semibold text-zinc-500 dark:text-white/45">
                HalApp canlı pazar komuta merkezi
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 text-xs font-black text-emerald-700 dark:text-emerald-300">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,.85)]" />
              CANLI VERİ
            </div>

            <div className="flex h-11 items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-bold text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Son güncelleme:
              <span className="ml-2 font-black text-zinc-950 dark:text-white">
                {lastRefresh || "yükleniyor"}
              </span>
            </div>

          </div>
        </div>

        {/* Hero */}
        <div className="relative p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-[110px]" />
          <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px]" />

          <div className="relative grid gap-6 xl:grid-cols-[1fr_360px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                Türkiye Canlı Pazar Ağı
              </div>

              <h1 className="mt-5 max-w-5xl text-4xl font-black leading-[0.95] tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
                Türkiye&apos;nin Canlı Tarım Ticaret Merkezi
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/55 sm:text-base">
                HalApp üzerindeki ilan görüntülemeleri, GPS doğrulamalı kullanıcı hareketleri,
                şehir bazlı pazar yoğunluğu ve ürün trendleri gerçek zamanlı analiz edilir.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Toplam Sinyal
                  </div>
                  <div className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                    {fmt(totalSignals)}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                    Aktif Şehir
                  </div>
                  <div className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                    {fmt(activeCities)}
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3">
                  <div className="text-xs font-black uppercase tracking-wide text-orange-700 dark:text-orange-300">
                    GPS Güveni
                  </div>
                  <div className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                    %{fmt(gpsRate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Satellite card */}
            <div className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                    Son Uydu Sinyali
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-300">
                    LIVE
                  </span>
                </div>

                <div className="mt-7 flex items-center justify-center">
                  <div className="relative flex h-36 w-36 items-center justify-center">
                    <span className="absolute h-36 w-36 animate-ping rounded-full border border-emerald-400/25" />
                    <span className="absolute h-28 w-28 rounded-full bg-emerald-500/10 blur-xl" />
                    <div className="animate-[satelliteFloat_3.6s_ease-in-out_infinite] text-7xl drop-shadow-[0_0_24px_rgba(16,185,129,.35)]">
                      🛰️
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <div className="text-2xl font-black text-zinc-950 dark:text-white">
                    Sinyal Takibi Aktif
                  </div>

                  <div className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                    Yeni pazar hareketleri anlık yakalanıyor.
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    ["📡", "Canlı"],
                    ["🎯", "GPS"],
                    ["⚡", "Hızlı"],
                  ].map(([icon, text]) => (
                    <div
                      key={text}
                      className="rounded-2xl border border-zinc-200 bg-white p-3 text-center dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="text-2xl">{icon}</div>
                      <div className="mt-1 text-xs font-black text-zinc-600 dark:text-white/60">
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="relative mt-6 grid gap-4 lg:grid-cols-4">
            <HeroStat
              icon="📡"
              label="Toplam Sinyal"
              value={fmt(totalSignals)}
              sub="+12.8% hareket"
              tone="emerald"
            />
            <HeroStat
              icon="🏙️"
              label="Aktif Şehir"
              value={fmt(activeCities)}
              sub="Türkiye geneli"
              tone="blue"
            />
            <HeroStat
              icon="🎯"
              label="GPS Doğrulama"
              value={`%${fmt(gpsRate)}`}
              sub="+6% güven"
              tone="purple"
            />
            <HeroStat
              icon="🔥"
              label="Pazar Nabzı"
              value="Canlı"
              sub="Anlık izleme"
              tone="orange"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes satelliteFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-5deg) scale(1);
          }
          50% {
            transform: translateY(-10px) rotate(7deg) scale(1.05);
          }
        }
      `}</style>
    </header>
  );
}