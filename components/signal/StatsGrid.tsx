"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  totalSignals: number;
  signals24h: number;
  activeCities: number;
  gpsSignals: number;
};

type Tone = "emerald" | "blue" | "purple" | "orange";

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = current;
    const diff = value - start;

    const timer = window.setInterval(() => {
      frame += 1;
      const next = Math.round(start + diff * Math.min(frame / 26, 1));
      setCurrent(next);

      if (frame >= 26) window.clearInterval(timer);
    }, 18);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <>
      {prefix}
      {fmt(current)}
      {suffix}
    </>
  );
}

function toneClasses(tone: Tone) {
  if (tone === "blue") {
    return {
      card: "from-blue-500/12 via-cyan-500/8 to-transparent border-blue-500/18",
      icon: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",
      text: "text-blue-600 dark:text-blue-300",
      bar: "from-blue-500 via-cyan-400 to-sky-400",
      glow: "bg-blue-500/15",
    };
  }

  if (tone === "purple") {
    return {
      card: "from-purple-500/12 via-fuchsia-500/8 to-transparent border-purple-500/18",
      icon: "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300",
      text: "text-purple-600 dark:text-purple-300",
      bar: "from-purple-500 via-fuchsia-400 to-pink-400",
      glow: "bg-purple-500/15",
    };
  }

  if (tone === "orange") {
    return {
      card: "from-orange-500/12 via-yellow-500/8 to-transparent border-orange-500/18",
      icon: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-300",
      text: "text-orange-600 dark:text-orange-300",
      bar: "from-orange-500 via-yellow-400 to-amber-300",
      glow: "bg-orange-500/15",
    };
  }

  return {
    card: "from-emerald-500/12 via-cyan-500/8 to-transparent border-emerald-500/18",
    icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-300",
    bar: "from-emerald-500 via-teal-400 to-cyan-400",
    glow: "bg-emerald-500/15",
  };
}

function Sparkline({ tone }: { tone: Tone }) {
  const points =
    tone === "orange"
      ? "0,36 22,28 44,33 66,18 88,24 110,12 132,20 154,8 176,15"
      : tone === "blue"
      ? "0,30 22,22 44,26 66,17 88,19 110,13 132,16 154,9 176,11"
      : tone === "purple"
      ? "0,34 22,31 44,25 66,28 88,16 110,22 132,12 154,15 176,7"
      : "0,38 22,30 44,32 66,21 88,25 110,15 132,18 154,10 176,12";

  const color =
    tone === "orange"
      ? "#f97316"
      : tone === "blue"
      ? "#2563eb"
      : tone === "purple"
      ? "#9333ea"
      : "#10b981";

  return (
    <svg viewBox="0 0 176 48" className="h-14 w-full">
      <polyline points={points} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${points} 176,48 0,48`} fill={color} opacity="0.08" />
      <circle cx="176" cy={tone === "purple" ? "7" : tone === "orange" ? "15" : "12"} r="4.5" fill={color} />
    </svg>
  );
}

function MiniBars({ tone }: { tone: Tone }) {
  const bars = [36, 52, 43, 72, 61, 88, 76, 94];

  return (
    <div className="flex h-14 items-end gap-1.5">
      {bars.map((h, i) => (
        <span
          key={i}
          className={[
            "flex-1 rounded-t-lg bg-gradient-to-t opacity-90 transition-all duration-300 group-hover:opacity-100",
            toneClasses(tone).bar,
          ].join(" ")}
          style={{
            height: `${Math.max(18, h - i * 2)}%`,
          }}
        />
      ))}
    </div>
  );
}

function Gauge({ value, tone }: { value: number; tone: Tone }) {
  const safe = Math.max(0, Math.min(100, value));
  const dash = `${safe}, 100`;

  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
        <path
          d="M18 2.7a15.3 15.3 0 1 1 0 30.6a15.3 15.3 0 1 1 0-30.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.3"
          className="text-zinc-200 dark:text-white/10"
        />
        <path
          d="M18 2.7a15.3 15.3 0 1 1 0 30.6a15.3 15.3 0 1 1 0-30.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.3"
          strokeLinecap="round"
          strokeDasharray={dash}
          className={toneClasses(tone).text}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-zinc-950 dark:text-white">
        %{safe}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone,
  sub,
  change,
  mode = "spark",
  suffix = "",
}: {
  title: string;
  value: number;
  icon: string;
  tone: Tone;
  sub: string;
  change: string;
  mode?: "spark" | "bars" | "gauge";
  suffix?: string;
}) {
  const t = toneClasses(tone);

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[34px] border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-[#0b1021]",
        t.card,
      ].join(" ")}
    >
      <div className={["absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl", t.glow].join(" ")} />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
            {title}
          </div>

          <div className="mt-3 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
            <AnimatedNumber value={value} suffix={suffix} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={["rounded-full px-3 py-1 text-xs font-black", "bg-white/60 dark:bg-white/[0.06]", t.text].join(" ")}>
              {change}
            </span>

            <span className="text-xs font-semibold text-zinc-500 dark:text-white/45">
              {sub}
            </span>
          </div>
        </div>

        <div className={["flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-3xl", t.icon].join(" ")}>
          {icon}
        </div>
      </div>

      <div className="relative mt-5">
        {mode === "bars" ? <MiniBars tone={tone} /> : null}
        {mode === "gauge" ? <Gauge value={value} tone={tone} /> : null}
        {mode === "spark" ? <Sparkline tone={tone} /> : null}
      </div>
    </div>
  );
}

export default function StatsGrid({
  totalSignals,
  signals24h,
  activeCities,
  gpsSignals,
}: Props) {
  const gpsRate = useMemo(() => {
    if (!totalSignals) return 0;
    return Math.round((gpsSignals / totalSignals) * 100);
  }, [totalSignals, gpsSignals]);

  const ipRate = Math.max(0, 100 - gpsRate);

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
            LIVE KPI DASHBOARD
          </div>

          <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
            Pazar Performans Özeti
          </h2>
        </div>

        <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
          ● Realtime Metrics
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          title="Toplam Sinyal"
          value={totalSignals}
          icon="📡"
          tone="emerald"
          sub="Tüm kayıtlı hareket"
          change="+12.8%"
          mode="spark"
        />

        <StatCard
          title="Son 24 Saat"
          value={signals24h}
          icon="⚡"
          tone="orange"
          sub="Canlı pazar hareketi"
          change="+8.2%"
          mode="bars"
        />

        <StatCard
          title="Aktif Şehir"
          value={activeCities}
          icon="🏙️"
          tone="blue"
          sub="Sinyal veren il"
          change="Türkiye geneli"
          mode="spark"
        />

        <StatCard
          title="GPS Güven"
          value={gpsRate}
          icon="🎯"
          tone="purple"
          sub={`IP oranı %${ipRate}`}
          change={`${fmt(gpsSignals)} GPS`}
          mode="gauge"
          suffix="%"
        />
      </div>
    </section>
  );
}