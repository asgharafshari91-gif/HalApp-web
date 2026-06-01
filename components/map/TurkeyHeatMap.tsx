"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { supabase } from "@/lib/supabaseClient";

type CitySignal = {
  city: string;
  signals: number;
};

type LatestSignal = {
  city: string;
  district?: string;
  source?: string;
  platform?: string;
  deviceType?: string;
  createdAt?: string;
  listingTitle?: string;
};

type DashboardData = {
  activeListings: number;
  activeSellers: number;
  buyerRequests: number;
  activeSignalCities: number;
  citySignals: CitySignal[];
  latestSignals: LatestSignal[];
};

type TooltipState = {
  city: string;
  signals: number;
  x: number;
  y: number;
} | null;

const emptyDashboard: DashboardData = {
  activeListings: 0,
  activeSellers: 0,
  buyerRequests: 0,
  activeSignalCities: 0,
  citySignals: [],
  latestSignals: [],
};

const labelCities = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Antalya",
  "Adana",
  "Mersin",
  "Konya",
  "Gaziantep",
  "Şanlıurfa",
  "Diyarbakır",
  "Samsun",
  "Trabzon",
  "Erzurum",
  "Van",
  "Bursa",
  "Kayseri",
  "Isparta",
];

function normalizeCityName(value?: string) {
  if (!value) return "";

  const v = value.trim();

  const fixes: Record<string, string> = {
    Istanbul: "İstanbul",
    istanbul: "İstanbul",
    İSTANBUL: "İstanbul",

    Izmir: "İzmir",
    izmir: "İzmir",
    İZMİR: "İzmir",

    Ankara: "Ankara",
    ankara: "Ankara",

    Antalya: "Antalya",
    antalya: "Antalya",

    Isparta: "Isparta",
    isparta: "Isparta",

    Mersin: "Mersin",
    mersin: "Mersin",

    Adana: "Adana",
    adana: "Adana",

    Konya: "Konya",
    konya: "Konya",

    Urfa: "Şanlıurfa",
    Sanliurfa: "Şanlıurfa",
    "Şanlı Urfa": "Şanlıurfa",

    "K.Maraş": "Kahramanmaraş",
    Kahramanmaras: "Kahramanmaraş",
  };

  return fixes[v] || v;
}

function readProvinceName(d: any) {
  return normalizeCityName(
    d?.properties?.name ||
      d?.properties?.NAME_1 ||
      d?.properties?.province ||
      d?.properties?.il ||
      d?.properties?.adm1_tr ||
      d?.properties?.shapeName ||
      d?.properties?.Name ||
      ""
  );
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function timeAgoTR(value?: string) {
  if (!value) return "az önce";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);

  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;

  return `${Math.floor(hour / 24)} gün önce`;
}

function signalLevel(count: number) {
  if (count >= 100) return "veryHigh";
  if (count >= 50) return "high";
  if (count >= 20) return "mid";
  if (count > 0) return "low";
  return "none";
}

function signalFill(count: number) {
  const level = signalLevel(count);

  if (level === "veryHigh") return "rgba(239,68,68,.78)";
  if (level === "high") return "rgba(249,115,22,.72)";
  if (level === "mid") return "rgba(250,204,21,.65)";
  if (level === "low") return "rgba(52,211,153,.55)";

  return "rgba(15,118,110,.30)";
}

function signalStroke(count: number) {
  const level = signalLevel(count);

  if (level === "veryHigh") return "rgba(248,113,113,.95)";
  if (level === "high") return "rgba(251,146,60,.95)";
  if (level === "mid") return "rgba(253,224,71,.95)";
  if (level === "low") return "rgba(110,231,183,.95)";

  return "rgba(167,243,208,.38)";
}

function heatFill(count: number) {
  const level = signalLevel(count);

  if (level === "veryHigh") return "rgba(239,68,68,.30)";
  if (level === "high") return "rgba(249,115,22,.26)";
  if (level === "mid") return "rgba(250,204,21,.22)";
  if (level === "low") return "rgba(52,211,153,.18)";

  return "transparent";
}

function glowClass(count: number) {
  const level = signalLevel(count);

  if (level === "veryHigh") {
    return "bg-red-500 shadow-red-500/70 ring-red-400/40";
  }

  if (level === "high") {
    return "bg-orange-400 shadow-orange-400/70 ring-orange-300/40";
  }

  if (level === "mid") {
    return "bg-yellow-300 shadow-yellow-300/70 ring-yellow-300/40";
  }

  return "bg-emerald-400 shadow-emerald-400/70 ring-emerald-300/40";
}

function AnimatedNumber({ value }: { value: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = current;
    const diff = value - start;

    const timer = window.setInterval(() => {
      frame += 1;
      const next = Math.round(start + diff * Math.min(frame / 22, 1));
      setCurrent(next);

      if (frame >= 22) window.clearInterval(timer);
    }, 22);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{fmt(current)}</>;
}

function StatBox({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_70px_rgba(0,0,0,.18)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-2xl ring-1 ring-emerald-400/15">
          {icon}
        </div>

        <div>
          <div className="text-xs font-black text-white/70">{label}</div>

          <div className="mt-1 text-3xl font-black tracking-tight text-white">
            <AnimatedNumber value={value} />
          </div>

          <div className="mt-1 text-[11px] font-bold text-white/38">{sub}</div>
        </div>
      </div>
    </div>
  );
}

export default function TurkeyHeatMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [geo, setGeo] = useState<any>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [mapReady, setMapReady] = useState(false);

  async function loadDashboard() {
    const { data, error } = await supabase.rpc("get_home_live_dashboard");

    if (error) {
      console.log("get_home_live_dashboard error:", error.message);
      return;
    }

    const raw: any = data ?? {};

    setDashboard({
      activeListings: Number(raw.activeListings ?? 0),
      activeSellers: Number(raw.activeSellers ?? 0),
      buyerRequests: Number(raw.buyerRequests ?? 0),
      activeSignalCities: Number(raw.activeSignalCities ?? 0),

      citySignals: Array.isArray(raw.citySignals)
        ? raw.citySignals.map((x: any) => ({
            city: normalizeCityName(x.city),
            signals: Number(x.signals ?? 0),
          }))
        : [],

      latestSignals: Array.isArray(raw.latestSignals)
        ? raw.latestSignals.map((x: any) => ({
            city: normalizeCityName(x.city),
            district: x.district ?? "",
            source: x.source ?? "",
            platform: x.platform ?? "",
            deviceType: x.deviceType ?? "",
            createdAt: x.createdAt ?? "",
            listingTitle: x.listingTitle ?? "İlan",
          }))
        : [],
    });
  }

  useEffect(() => {
    fetch("/maps/turkey-provinces.json")
      .then((r) => {
        if (!r.ok) throw new Error("turkey-provinces.json bulunamadı");
        return r.json();
      })
      .then((json) => {
        if (json.type === "Topology") {
          const key = Object.keys(json.objects)[0];
          const converted = feature(json, json.objects[key]) as any;
          setGeo(converted);
        } else {
          setGeo(json);
        }
      })
      .catch((e) => {
        console.log("Turkey map json error:", e);
        setGeo(null);
      });
  }, []);

  useEffect(() => {
    loadDashboard();

    const timer = window.setInterval(loadDashboard, 15000);

    const ch = supabase
      .channel("home-live-dashboard-map")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listing_view_logs" },
        () => loadDashboard()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => loadDashboard()
      )
      .subscribe();

    return () => {
      window.clearInterval(timer);
      supabase.removeChannel(ch);
    };
  }, []);

  const signalMap = useMemo(() => {
    const map = new Map<string, number>();

    dashboard.citySignals.forEach((s) => {
      map.set(normalizeCityName(s.city), Number(s.signals || 0));
    });

    return map;
  }, [dashboard.citySignals]);

  const topCities = dashboard.citySignals.slice(0, 5);
  const latest = dashboard.latestSignals.slice(0, 5);
  const ticker = latest[0];

  useEffect(() => {
    if (!geo || !svgRef.current) return;

    setMapReady(false);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1120;
    const height = 500;

    const projection = d3.geoMercator().fitSize([width, height], geo);
    const path = d3.geoPath(projection);

    const root = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const defs = root.append("defs");

    const glow = defs.append("filter").attr("id", "provinceGlow");
    glow
      .append("feGaussianBlur")
      .attr("stdDeviation", "3.2")
      .attr("result", "blur");

    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const heatGlow = defs.append("filter").attr("id", "heatGlow");
    heatGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "10")
      .attr("result", "blur");

    const heatMerge = heatGlow.append("feMerge");
    heatMerge.append("feMergeNode").attr("in", "blur");
    heatMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = root.append("g").attr("class", "map-layer");

    const features = Array.isArray(geo.features) ? geo.features : [];

    g.selectAll("path.province")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const name = readProvinceName(d);
        const count = signalMap.get(name) ?? 0;
        return signalFill(count);
      })
      .attr("stroke", (d: any) => {
        const name = readProvinceName(d);
        const count = signalMap.get(name) ?? 0;
        return signalStroke(count);
      })
      .attr("stroke-width", (d: any) => {
        const name = readProvinceName(d);
        const count = signalMap.get(name) ?? 0;
        return count > 0 ? 1.15 : 0.72;
      })
      .attr("filter", "url(#provinceGlow)")
      .style("cursor", "pointer")
      .on("mousemove", function (event: MouseEvent, d: any) {
        const name = readProvinceName(d);
        const signals = signalMap.get(name) ?? 0;

        d3.select(this)
          .attr("stroke", "rgba(255,255,255,.95)")
          .attr("stroke-width", 1.8);

        const rect = svgRef.current?.getBoundingClientRect();
        const x = event.clientX - (rect?.left ?? 0);
        const y = event.clientY - (rect?.top ?? 0);

        setTooltip({
          city: name || "İl",
          signals,
          x,
          y,
        });
      })
      .on("mouseleave", function (_event: MouseEvent, d: any) {
        const name = readProvinceName(d);
        const count = signalMap.get(name) ?? 0;

        d3.select(this)
          .attr("stroke", signalStroke(count))
          .attr("stroke-width", count > 0 ? 1.15 : 0.72);

        setTooltip(null);
      });

   const activeFeatures = features.filter((d: any) => {
  const name = readProvinceName(d);
  return (signalMap.get(name) ?? 0) > 0;
});

g.selectAll("circle.heat")
  .data(activeFeatures)
  .enter()
  .append("circle")
  .attr("class", "heat")
  .attr("cx", (d: any) => path.centroid(d)[0])
  .attr("cy", (d: any) => path.centroid(d)[1])
  .attr("r", (d: any) => {
    const count = signalMap.get(readProvinceName(d)) ?? 0;
    return Math.min(60, 16 + count * 0.5);
  })
  .attr("fill", (d: any) => {
    const count = signalMap.get(readProvinceName(d)) ?? 0;
    return heatFill(count);
  })
  .attr("opacity", 0.95)
  .attr("filter", "url(#heatGlow)")
  .style("pointer-events", "none");

g.selectAll("circle.signal-ring")
  .data(activeFeatures)
  .enter()
  .append("circle")
  .attr("class", "signal-ring")
  .attr("cx", (d: any) => path.centroid(d)[0])
  .attr("cy", (d: any) => path.centroid(d)[1])
  .attr("r", 7)
  .attr("fill", "none")
  .attr("stroke", (d: any) => signalStroke(signalMap.get(readProvinceName(d)) ?? 0))
  .attr("stroke-width", 3)
  .attr("opacity", 0.9)
  .style("pointer-events", "none")
  .append("animate")
  .attr("attributeName", "r")
  .attr("from", "7")
  .attr("to", "34")
  .attr("dur", "1.7s")
  .attr("repeatCount", "indefinite");

g.selectAll("circle.signal-ring-opacity")
  .data(activeFeatures)
  .enter()
  .append("circle")
  .attr("cx", (d: any) => path.centroid(d)[0])
  .attr("cy", (d: any) => path.centroid(d)[1])
  .attr("r", 7)
  .attr("fill", "none")
  .attr("stroke", (d: any) => signalStroke(signalMap.get(readProvinceName(d)) ?? 0))
  .attr("stroke-width", 2)
  .style("pointer-events", "none")
  .append("animate")
  .attr("attributeName", "opacity")
  .attr("from", "0.9")
  .attr("to", "0")
  .attr("dur", "1.7s")
  .attr("repeatCount", "indefinite");

g.selectAll("circle.signal-dot")
  .data(activeFeatures)
  .enter()
  .append("circle")
  .attr("class", "signal-dot")
  .attr("cx", (d: any) => path.centroid(d)[0])
  .attr("cy", (d: any) => path.centroid(d)[1])
  .attr("r", 5)
  .attr("fill", (d: any) => signalStroke(signalMap.get(readProvinceName(d)) ?? 0))
  .attr("stroke", "rgba(255,255,255,.85)")
  .attr("stroke-width", 1.5)
  .attr("filter", "url(#heatGlow)")
  .style("pointer-events", "none");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 5])
      .translateExtent([
        [-80, -80],
        [width + 80, height + 80],
      ])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    setMapReady(true);
  }, [geo, signalMap]);

  return (
    <section id="live-map" className="mt-16">
      <div className="relative overflow-hidden rounded-[44px] border border-black/10 bg-[#06110e] p-5 shadow-[0_30px_140px_rgba(0,0,0,.22)] dark:border-white/10 sm:p-7 lg:p-9">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-[120px]" />
          <div className="absolute -right-32 top-24 h-[460px] w-[460px] rounded-full bg-teal-400/12 blur-[120px]" />
          <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-lime-400/10 blur-[120px]" />
        </div>

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              CANLI TÜRKİYE HARİTASI
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Türkiye’nin{" "}
              <span className="text-emerald-300">hal hareketi anlık</span>{" "}
              burada.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
              İlan ve talep sinyalleri il bazlı olarak haritada canlı görünür.
            </p>
          </div>

          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200">
            ● CANLI
          </div>
        </div>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatBox
            icon="📦"
            label="Aktif İlan"
            value={dashboard.activeListings}
            sub="Yayındaki akış"
          />

          <StatBox
            icon="👥"
            label="Aktif Satıcı"
            value={dashboard.activeSellers}
            sub="Türkiye genelinde"
          />

          <StatBox
            icon="🎯"
            label="Alıcı Talebi"
            value={dashboard.buyerRequests}
            sub="Pazarda bekleyen"
          />

          <StatBox
            icon="🏙️"
            label="Sinyal Veren İl"
            value={dashboard.activeSignalCities}
            sub="Son 24 saat"
          />
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-[#071b15] p-4 shadow-[0_24px_100px_rgba(0,0,0,.25)]">
          <div className="relative aspect-[16/6.3] min-h-[390px] overflow-hidden rounded-[28px] border border-white/10 bg-[#061713]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:42px_42px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(52,211,153,.22),transparent_26%),radial-gradient(circle_at_72%_55%,rgba(45,212,191,.14),transparent_32%)]" />

            <div className="absolute left-5 top-5 z-40 max-w-[310px] rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs font-bold text-white/75 backdrop-blur-xl">
              <span className="mr-2 inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              {ticker
                ? `Şu an ${ticker.city} bölgesinde hareket var`
                : "Canlı sinyal bekleniyor"}
            </div>

            <div className="absolute right-5 top-5 z-40 hidden rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-[11px] font-bold text-white/70 backdrop-blur-xl lg:flex lg:items-center lg:gap-4">
              <span>SİNYAL YOĞUNLUĞU</span>
              <span className="flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Düşük
              </span>
              <span className="flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-yellow-300" /> Orta
              </span>
              <span className="flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-orange-400" /> Yüksek
              </span>
              <span className="flex items-center gap-1">
                <i className="h-2.5 w-2.5 rounded-full bg-red-500" /> Çok Yüksek
              </span>
            </div>

            {!mapReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="rounded-2xl border border-white/10 bg-black/45 px-5 py-4 text-sm font-black text-white/70 backdrop-blur-xl">
                  Türkiye haritası yükleniyor...
                </div>
              </div>
            )}

            <svg ref={svgRef} className="relative z-10 h-full w-full" />

            {tooltip && (
              <div
                className="pointer-events-none absolute z-50 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-xs font-black text-white shadow-xl backdrop-blur-xl"
                style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
              >
                {tooltip.city}

                <div className="mt-1 text-emerald-300">
                  {tooltip.signals} canlı sinyal
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-6 grid gap-5 lg:grid-cols-12">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl lg:col-span-4">
            <div className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-white/55">
              En Fazla Sinyal Gelen İller
            </div>

            <div className="space-y-3">
              {(topCities.length
                ? topCities
                : [{ city: "Antalya", signals: 0 }]
              ).map((s, i) => (
                <div key={`${s.city}-${i}`} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-black text-white/50">
                    {i + 1}
                  </span>

                  <span className={`h-3 w-3 rounded-full ${glowClass(s.signals)}`} />

                  <span className="flex-1 text-sm font-black text-white">
                    {s.city}
                  </span>

                  <span className="text-xs font-bold text-white/70">
                    {s.signals} sinyal
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl lg:col-span-4">
            <div className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-white/55">
              Canlı Sinyal Akışı
            </div>

            <div className="space-y-4">
              {(latest.length
                ? latest
                : [{ city: "Bekleniyor", listingTitle: "Canlı veri bekleniyor" }]
              ).map((s, i) => (
                <div key={`${s.city}-${i}`} className="flex gap-3">
                  <span className="mt-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,.7)]" />

                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-white/40">
                      {timeAgoTR(s.createdAt)}
                    </div>

                    <div className="truncate text-sm font-black text-white">
                      Şu an {s.city} bölgesinde hareket var
                    </div>

                    <div className="truncate text-xs font-semibold text-white/55">
                      {s.listingTitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-400/15 bg-emerald-400/8 p-5 backdrop-blur-xl lg:col-span-4">
            <div className="flex items-start gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center [perspective:700px]">
                <div className="absolute inset-0 rounded-full bg-emerald-400/18 blur-2xl" />

                <div className="animate-[satellite3d_4s_ease-in-out_infinite] text-5xl drop-shadow-[0_0_24px_rgba(52,211,153,.55)] [transform-style:preserve-3d]">
                  🛰️
                </div>

                <span className="absolute h-28 w-28 animate-ping rounded-full border border-emerald-300/20" />
              </div>

              <div>
                <h3 className="text-xl font-black text-emerald-300">
                  Pazar her yerde hareket ediyor
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  HalApp, Türkiye genelindeki hal ve pazar sinyallerini gerçek
                  zamanlı izler.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["👥", "Gerçek Zamanlı", "Anlık ilan ve talep"],
                ["🗺️", "81 İl Kapsamı", "Türkiye’nin her ili"],
                ["🛡️", "Güvenli Ticaret", "Doğru alıcı, doğru satıcı"],
              ].map(([icon, title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:bg-white/[0.075]"
                >
                  <div className="text-2xl">{icon}</div>
                  <div className="mt-3 text-sm font-black text-white">{title}</div>
                  <div className="mt-1 text-xs font-semibold text-white/45">
                    {text}
                  </div>
                </div>
              ))}
            </div>

            <style jsx>{`
              @keyframes satellite3d {
                0%, 100% {
                  transform: rotateX(12deg) rotateY(-18deg) translateY(0) scale(1);
                }
                50% {
                  transform: rotateX(-8deg) rotateY(22deg) translateY(-10px) scale(1.08);
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </section>
  );
}