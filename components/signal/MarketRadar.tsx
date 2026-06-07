"use client";

import { useMemo, useState } from "react";
import type { SignalRow } from "@/types/signal";

type CityStat = {
  city: string;
  signals: number;
  gps: number;
  ip: number;
  mobile: number;
  desktop: number;
  lastAt: string;
};

type Props = {
  cities: CityStat[];
  lastSignal: SignalRow | null;
  onSelectSignal?: React.Dispatch<React.SetStateAction<SignalRow | null>>;
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function timeAgo(value?: string | null) {
  if (!value) return "veri yok";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "veri yok";

  const min = Math.floor((Date.now() - d.getTime()) / 60000);

  if (min < 1) return "şimdi";
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} sa önce`;

  return `${Math.floor(hour / 24)} gün önce`;
}

function productEmoji(name?: string | null) {
  const s = String(name ?? "").toLocaleLowerCase("tr-TR");

  if (s.includes("avokado")) return "🥑";
  if (s.includes("limon")) return "🍋";
  if (s.includes("domates")) return "🍅";
  if (s.includes("kayısı")) return "🍑";
  if (s.includes("elma")) return "🍎";
  if (s.includes("salatalık")) return "🥒";
  if (s.includes("biber")) return "🌶️";
  if (s.includes("kuşkonmaz")) return "🌱";

  return "🧺";
}

function cityIcon(city?: string | null) {
  const c = String(city ?? "").toLocaleLowerCase("tr-TR");

  if (c.includes("antalya")) return "🔥";
  if (c.includes("istanbul")) return "🚀";
  if (c.includes("izmir")) return "⚡";
  if (c.includes("bursa")) return "📈";
  if (c.includes("mersin")) return "🌴";
  if (c.includes("adana")) return "☀️";

  return "📍";
}

function sourceLabel(value?: string | null) {
  return String(value ?? "").toLowerCase() === "gps" ? "GPS" : "IP";
}

function deviceLabel(signal?: SignalRow | null) {
  const d = String(signal?.deviceType ?? "").toLowerCase();
  const p = String(signal?.platform ?? "").toLowerCase();

  if (d.includes("desktop")) return "Desktop";
  if (d.includes("mobile")) return "Mobile";
  if (p.includes("android")) return "Android";
  if (p.includes("ios")) return "iOS";
  if (p.includes("web")) return "Web";

  return signal?.deviceType || signal?.platform || "Bilinmiyor";
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function score(value: number, max: number) {
  if (!max) return 0;
  return Math.max(8, Math.min(100, Math.round((value / max) * 100)));
}

function MetricCard({
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
  tone: "emerald" | "blue" | "orange" | "purple";
}) {
  const cls =
    tone === "blue"
      ? "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      : tone === "orange"
      ? "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300"
      : tone === "purple"
      ? "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300"
      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  return (
    <div className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-3xl ${cls}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
            {label}
          </div>

          <div className="mt-1 text-3xl font-black text-zinc-950 dark:text-white">
            {value}
          </div>

          <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
            {sub}
          </div>
        </div>
      </div>
    </div>
  );
}

function CityDetailPanel({
  city,
  max,
  onClose,
}: {
  city: CityStat;
  max: number;
  onClose: () => void;
}) {
  const heatScore = score(city.signals, max);
  const gpsRate = percent(city.gps, city.signals);
  const mobileRate = percent(city.mobile, city.signals);
  const ipRate = percent(city.ip, city.signals);

  const insight =
    gpsRate >= 50
      ? `${city.city} için GPS doğrulamalı sinyal oranı güçlü. Bu şehirdeki hareket daha güvenilir kabul edilebilir.`
      : `${city.city} için IP sinyalleri daha baskın. Kullanıcılardan konum izni alınırsa analiz kalitesi artar.`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1021]">
        <div className="flex items-start justify-between border-b border-zinc-200 p-6 dark:border-white/10">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/40">
              City Intelligence
            </div>

            <h3 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
              {cityIcon(city.city)} {city.city}
            </h3>

            <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-white/50">
              Son aktivite: {timeAgo(city.lastAt)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-lg font-black text-zinc-700 dark:bg-white/[0.06] dark:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <MetricCard icon="📡" label="Sinyal" value={fmt(city.signals)} sub="Toplam hareket" tone="emerald" />
            <MetricCard icon="🎯" label="GPS" value={`%${gpsRate}`} sub={`${fmt(city.gps)} sinyal`} tone="purple" />
            <MetricCard icon="🌍" label="IP" value={`%${ipRate}`} sub={`${fmt(city.ip)} sinyal`} tone="blue" />
            <MetricCard icon="📱" label="Mobil" value={`%${mobileRate}`} sub={`${fmt(city.mobile)} sinyal`} tone="orange" />
          </div>

          <div className="mt-6 rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                  Pazar Sıcaklık Skoru
                </div>
                <div className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
                  {heatScore}/100
                </div>
              </div>

              <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
                Kullanıcı hareketi
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
                style={{ width: `${heatScore}%` }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Pazar Yorumu
            </div>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-700 dark:text-white/60">
              {insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CityRow({
  city,
  max,
  index,
  onClick,
}: {
  city: CityStat;
  max: number;
  index: number;
  onClick: () => void;
}) {
  const s = score(city.signals, max);
  const gpsRate = percent(city.gps, city.signals);

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.035]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
            {cityIcon(city.city)} {city.city}
          </div>

          <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
            {fmt(city.signals)} sinyal • GPS %{gpsRate} • {timeAgo(city.lastAt)}
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
          Detay
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
          style={{ width: `${s}%` }}
        />
      </div>
    </button>
  );
}

export default function MarketRadar({ cities, lastSignal, onSelectSignal }: Props) {
  const [selectedCity, setSelectedCity] = useState<CityStat | null>(null);

  const activeCities = useMemo(
    () => cities.filter((c) => Number(c.signals || 0) > 0),
    [cities]
  );

  const totalSignals = useMemo(
    () => activeCities.reduce((sum, c) => sum + Number(c.signals || 0), 0),
    [activeCities]
  );

  const gpsSignals = useMemo(
    () => activeCities.reduce((sum, c) => sum + Number(c.gps || 0), 0),
    [activeCities]
  );

  const ipSignals = useMemo(
    () => activeCities.reduce((sum, c) => sum + Number(c.ip || 0), 0),
    [activeCities]
  );

  const mobileSignals = useMemo(
    () => activeCities.reduce((sum, c) => sum + Number(c.mobile || 0), 0),
    [activeCities]
  );

  const leader = activeCities[0] ?? {
    city: "Veri bekleniyor",
    signals: 0,
    gps: 0,
    ip: 0,
    mobile: 0,
    desktop: 0,
    lastAt: "",
  };

  const maxCitySignals = Math.max(...activeCities.map((c) => c.signals), 1);
  const gpsRate = percent(gpsSignals, totalSignals);
  const mobileRate = percent(mobileSignals, totalSignals);

  const lastProduct =
    lastSignal?.productName || lastSignal?.listingTitle || "Sinyal bekleniyor";

  const insight =
    gpsRate >= 50
      ? `${leader.city} bölgesi öne çıkıyor. GPS doğrulamalı sinyal oranı güçlü olduğu için veri kalitesi iyi.`
      : `${leader.city} öne çıkıyor fakat IP sinyalleri daha yoğun. GPS izin oranı artarsa pazar analizi daha net olur.`;

  return (
    <>
      <section className="overflow-hidden rounded-[36px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
        <div className="border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500 dark:text-white/40">
                MARKET INTELLIGENCE
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                Pazar Analiz Merkezi
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                Şehir yoğunluğu, GPS/IP kalitesi, mobil hareket ve son pazar aktivitesi.
              </p>
            </div>

            <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
              ● CANLI ANALİZ
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <MetricCard icon="📡" label="Toplam Sinyal" value={fmt(totalSignals)} sub="Aktif şehirlerden" tone="emerald" />
            <MetricCard icon="🎯" label="GPS Oranı" value={`%${gpsRate}`} sub={`${fmt(gpsSignals)} GPS sinyali`} tone="purple" />
            <MetricCard icon="🏙️" label="Aktif Şehir" value={fmt(activeCities.length)} sub="Sinyal gelen il" tone="blue" />
            <MetricCard icon="📱" label="Mobil Hareket" value={`%${mobileRate}`} sub={`${fmt(mobileSignals)} mobil sinyal`} tone="orange" />
          </div>
        </div>

        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_.95fr]">
          <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.035]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
                  Şehir Yoğunluğu
                </div>

                <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                  En Sıcak Bölgeler
                </div>
              </div>

              <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-700 dark:text-orange-300">
                Tıklanabilir analiz
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(activeCities.length ? activeCities.slice(0, 6) : [leader]).map((city, i) => (
                <CityRow
                  key={`${city.city}-${i}`}
                  city={city}
                  max={maxCitySignals}
                  index={i}
                  onClick={() => setSelectedCity(city)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <button
              type="button"
              onClick={() => lastSignal && onSelectSignal?.(lastSignal)}
              className="rounded-[30px] border border-emerald-500/20 bg-emerald-500/10 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                Son Yakalanan Sinyal
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/60 text-4xl dark:bg-white/[0.06]">
                  {productEmoji(lastProduct)}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-2xl font-black text-zinc-950 dark:text-white">
                    {lastSignal?.city || "Veri bekleniyor"}
                  </div>

                  <div className="mt-1 truncate text-sm font-semibold text-zinc-500 dark:text-white/50">
                    {lastProduct}
                  </div>

                  <div className="mt-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                    {lastSignal
                      ? `${timeAgo(lastSignal.createdAt)} • ${sourceLabel(lastSignal.locationSource)} • ${deviceLabel(lastSignal)}`
                      : "Sinyal geldiğinde detay açılır"}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white/55 px-4 py-3 text-xs font-black text-emerald-700 dark:bg-white/[0.05] dark:text-emerald-300">
                Detayını açmak için tıkla →
              </div>
            </button>

            <div className="rounded-[30px] border border-orange-500/20 bg-orange-500/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">
                En Sıcak Şehir
              </div>

              <div className="mt-4 text-4xl font-black text-zinc-950 dark:text-white">
                {cityIcon(leader.city)} {leader.city}
              </div>

              <div className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                {fmt(leader.signals)} sinyal • son aktivite {timeAgo(leader.lastAt)}
              </div>
            </div>

            <div className="rounded-[30px] border border-emerald-500/20 bg-emerald-500/10 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/60 text-4xl dark:bg-white/[0.06]">
                  🧠
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                    Market Insight
                  </div>

                  <div className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
                    Pazar Yorumu
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/55">
                    {insight}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-500/20 bg-white/55 p-3 dark:bg-white/[0.05]">
                      <div className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">GPS</div>
                      <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">%{gpsRate}</div>
                    </div>

                    <div className="rounded-2xl border border-blue-500/20 bg-white/55 p-3 dark:bg-white/[0.05]">
                      <div className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">IP</div>
                      <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">{fmt(ipSignals)}</div>
                    </div>

                    <div className="rounded-2xl border border-orange-500/20 bg-white/55 p-3 dark:bg-white/[0.05]">
                      <div className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-300">Mobil</div>
                      <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">{fmt(mobileSignals)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedCity ? (
        <CityDetailPanel
          city={selectedCity}
          max={maxCitySignals}
          onClose={() => setSelectedCity(null)}
        />
      ) : null}
    </>
  );
}