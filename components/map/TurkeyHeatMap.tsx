"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { supabase } from "@/lib/supabaseClient";

type CitySignal = {
  city: string;
  signals: number;
  recentSignals?: number;
  gpsSignals?: number;
  ipSignals?: number;
  lastSignalAt?: string;
};

type LatestSignal = {
  city: string;
  district?: string;
  platform?: string;
  deviceType?: string;
  locationSource?: string;
  createdAt?: string;
  listingId?: string;
  listingTitle?: string;
  productName?: string;
  postType?: string;
};

type DashboardData = {
  activeListings: number;
  activeSellers: number;
  buyerRequests: number;
  activeSignalCities: number;
  totalSignals24h: number;
  totalSignals5m: number;
  citySignals: CitySignal[];
  hotCities: CitySignal[];
  latestSignals: LatestSignal[];
};

type TooltipState = {
  city: string;
  signals: number;
  recentSignals: number;
  gpsSignals: number;
  ipSignals: number;
  x: number;
  y: number;
} | null;

const emptyDashboard: DashboardData = {
  activeListings: 0,
  activeSellers: 0,
  buyerRequests: 0,
  activeSignalCities: 0,
  totalSignals24h: 0,
  totalSignals5m: 0,
  citySignals: [],
  hotCities: [],
  latestSignals: [],
};

const TOOLTIP_W = 240;
const TOOLTIP_H = 190;
const TOOLTIP_GAP = 18;
const TOOLTIP_PAD = 12;

function normalizeCityName(value?: string) {
  if (!value) return "";
  const v = value.trim();

  const fixes: Record<string, string> = {
    Istanbul: "İstanbul",
    istanbul: "İstanbul",
    ISTANBUL: "İstanbul",
    İSTANBUL: "İstanbul",
    Izmir: "İzmir",
    izmir: "İzmir",
    IZMIR: "İzmir",
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
    Kahramanmaras: "Kahramanmaraş",
    "K.Maraş": "Kahramanmaraş",
  };

  return fixes[v] || v;
}

function cityKey(value?: string) {
  return normalizeCityName(value)
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
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

function fmt(n: any) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function timeAgoTR(value?: string) {
  if (!value) return "az önce";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "az önce";

  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(min / 60);

  if (sec < 30) return "şimdi";
  if (min < 1) return `${sec} sn önce`;
  if (min < 60) return `${min} dk önce`;
  if (hour < 24) return `${hour} sa önce`;

  return `${Math.floor(hour / 24)} gün önce`;
}

function productEmoji(name: any) {
  const s = String(name ?? "").toLocaleLowerCase("tr-TR").trim();

  if (!s) return "🧺";

  if (s.includes("elma")) return "🍎";
  if (s.includes("armut")) return "🍐";
  if (s.includes("portakal")) return "🍊";
  if (s.includes("mandalina")) return "🍊";
  if (s.includes("greyfurt")) return "🍊";
  if (s.includes("limon")) return "🍋";
  if (s.includes("muz")) return "🍌";
  if (s.includes("karpuz")) return "🍉";
  if (s.includes("kavun")) return "🍈";
  if (s.includes("üzüm")) return "🍇";
  if (s.includes("çilek")) return "🍓";
  if (s.includes("ahududu")) return "🫐";
  if (s.includes("böğürtlen")) return "🫐";
  if (s.includes("blueberry")) return "🫐";
  if (s.includes("yaban mersini")) return "🫐";
  if (s.includes("kiraz")) return "🍒";
  if (s.includes("vişne")) return "🍒";
  if (s.includes("şeftali")) return "🍑";
  if (s.includes("kayısı")) return "🍑";
  if (s.includes("nektarin")) return "🍑";
  if (s.includes("erik")) return "🟣";
  if (s.includes("nar")) return "🔴";
  if (s.includes("ayva")) return "🍐";
  if (s.includes("incir")) return "🟣";
  if (s.includes("kivi")) return "🥝";
  if (s.includes("ananas")) return "🍍";
  if (s.includes("mango")) return "🥭";
  if (s.includes("avokado")) return "🥑";
  if (s.includes("hindistan cevizi")) return "🥥";
  if (s.includes("hurma")) return "🌴";
  if (s.includes("dut")) return "🫐";
  if (s.includes("altın çilek")) return "🍓";

  if (s.includes("domates")) return "🍅";
  if (s.includes("biber")) return "🌶️";
  if (s.includes("patlıcan")) return "🍆";
  if (s.includes("salatalık")) return "🥒";
  if (s.includes("hıyar")) return "🥒";
  if (s.includes("kabak")) return "🎃";
  if (s.includes("patates")) return "🥔";
  if (s.includes("soğan")) return "🧅";
  if (s.includes("sarımsak")) return "🧄";
  if (s.includes("havuç")) return "🥕";
  if (s.includes("turp")) return "🥕";
  if (s.includes("pancar")) return "🥕";
  if (s.includes("brokoli")) return "🥦";
  if (s.includes("karnabahar")) return "🥦";
  if (s.includes("lahana")) return "🥬";
  if (s.includes("marul")) return "🥬";
  if (s.includes("ıspanak")) return "🥬";
  if (s.includes("pazı")) return "🥬";
  if (s.includes("kereviz")) return "🥬";
  if (s.includes("pırasa")) return "🥬";
  if (s.includes("enginar")) return "🌿";
  if (s.includes("bamya")) return "🌿";
  if (s.includes("fasulye")) return "🫛";
  if (s.includes("bezelye")) return "🫛";
  if (s.includes("bakla")) return "🫛";
  if (s.includes("mısır")) return "🌽";
  if (s.includes("mantar")) return "🍄";
  if (s.includes("kuşkonmaz")) return "🌱";

  if (s.includes("roka")) return "🌿";
  if (s.includes("nane")) return "🌿";
  if (s.includes("maydanoz")) return "🌿";
  if (s.includes("dereotu")) return "🌿";
  if (s.includes("fesleğen")) return "🌿";
  if (s.includes("tere")) return "🌿";

  if (s.includes("ceviz")) return "🥜";
  if (s.includes("badem")) return "🥜";
  if (s.includes("fındık")) return "🥜";
  if (s.includes("antep fıstığı")) return "🥜";

  return "🧺";
}

function signalColor(s?: CitySignal) {
  const count = Number(s?.signals ?? 0);
  const gps = Number(s?.gpsSignals ?? 0);
  const recent = Number(s?.recentSignals ?? 0);

  if (gps > 0) return "#2dd4bf";
  if (recent > 0) return "#22c55e";
  if (count >= 100) return "#ff4d5a";
  if (count >= 50) return "#ff8a2a";
  if (count >= 20) return "#ffe257";
  if (count > 0) return "#86efac";

  return "#2f5c43";
}

function signalFill(s?: CitySignal) {
  const count = Number(s?.signals ?? 0);
  const gps = Number(s?.gpsSignals ?? 0);
  const recent = Number(s?.recentSignals ?? 0);

  if (gps > 0) return "rgba(45,212,191,.42)";
  if (recent > 0) return "rgba(34,197,94,.34)";
  if (count >= 100) return "rgba(255,77,90,.34)";
  if (count >= 50) return "rgba(255,138,42,.30)";
  if (count >= 20) return "rgba(255,226,87,.24)";
  if (count > 0) return "rgba(134,239,172,.20)";

  return "rgba(16,73,59,.42)";
}

function signalSentence(s: LatestSignal) {
  const city = s.city || "Türkiye";
  const district = s.district ? ` / ${s.district}` : "";
  const product = s.productName || s.listingTitle || "ilan";

  if (s.postType === "request") {
    return `${city}${district} konumundan ${product} talebi görüntülendi`;
  }

  return `${city}${district} konumundan ${product} ilanına bakıldı`;
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

function StatCard({
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
    <div className="rounded-[22px] border border-white/10 bg-[#061612]/95 p-4 shadow-[0_18px_70px_rgba(0,0,0,.34)] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-emerald-300/20 bg-emerald-300/10 text-3xl shadow-[0_0_28px_rgba(52,211,153,.12)]">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/82">{label}</div>

          <div className="mt-1 text-3xl font-black leading-none text-white">
            <AnimatedNumber value={value} />
          </div>

          <div className="mt-2 text-xs font-medium text-white/62">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function AdvantageCard({
  icon,
  title,
  text,
  active,
}: {
  icon: string;
  title: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 transition hover:-translate-y-0.5",
        active
          ? "border-yellow-300/20 bg-yellow-300/10"
          : "border-white/10 bg-black/24 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      <div className="flex gap-4">
        <div className="text-3xl">{icon}</div>

        <div>
          <div
            className={[
              "font-black",
              active ? "text-yellow-200" : "text-emerald-200",
            ].join(" ")}
          >
            {title}
          </div>

          <div className="mt-1 text-sm font-medium leading-relaxed text-white/68">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TurkeyHeatMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [geo, setGeo] = useState<any>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [mapReady, setMapReady] = useState(false);
  const [zoomText, setZoomText] = useState("%100");
  const [lastRefresh, setLastRefresh] = useState("");
  const [tooltip, setTooltip] = useState<TooltipState>(null);

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
      totalSignals24h: Number(raw.totalSignals24h ?? 0),
      totalSignals5m: Number(raw.totalSignals5m ?? 0),

      citySignals: Array.isArray(raw.citySignals)
        ? raw.citySignals.map((x: any) => ({
            city: normalizeCityName(x.city),
            signals: Number(x.signals ?? 0),
            recentSignals: Number(x.recentSignals ?? 0),
            gpsSignals: Number(x.gpsSignals ?? 0),
            ipSignals: Number(x.ipSignals ?? 0),
            lastSignalAt: x.lastSignalAt ?? "",
          }))
        : [],

      hotCities: Array.isArray(raw.hotCities)
        ? raw.hotCities.map((x: any) => ({
            city: normalizeCityName(x.city),
            signals: Number(x.signals ?? 0),
            recentSignals: Number(x.recentSignals ?? 0),
            gpsSignals: Number(x.gpsSignals ?? 0),
            ipSignals: Number(x.ipSignals ?? 0),
            lastSignalAt: x.lastSignalAt ?? "",
          }))
        : [],

      latestSignals: Array.isArray(raw.latestSignals)
        ? raw.latestSignals.map((x: any) => ({
            city: normalizeCityName(x.city),
            district: x.district ?? "",
            platform: x.platform ?? "",
            deviceType: x.deviceType ?? "",
            locationSource: x.locationSource ?? "",
            createdAt: x.createdAt ?? "",
            listingId: x.listingId ?? "",
            listingTitle: x.listingTitle ?? "İlan",
            productName: x.productName ?? "",
            postType: x.postType ?? "",
          }))
        : [],
    });

    setLastRefresh(
      new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
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
          setGeo(feature(json, json.objects[key]) as any);
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
    const map = new Map<string, CitySignal>();
    dashboard.citySignals.forEach((s) => map.set(cityKey(s.city), s));
    return map;
  }, [dashboard.citySignals]);

  const topCities = dashboard.hotCities.length
    ? dashboard.hotCities.slice(0, 8)
    : dashboard.citySignals.slice(0, 8);

  const latest = dashboard.latestSignals.slice(0, 8);
  const tickerFlow = latest.length ? [...latest, ...latest] : [];

  const lastSignal = latest[0];
  const lastSignalCity = lastSignal?.city || "Sinyal bekleniyor";
  const lastSignalTitle =
    lastSignal?.productName ||
    lastSignal?.listingTitle ||
    "Canlı veri bekleniyor";
  const lastSignalSource = lastSignal?.locationSource === "gps" ? "GPS" : "IP";

  useEffect(() => {
    if (!geo || !svgRef.current) return;

    setMapReady(false);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1400;
    const height = 760;

    const projection = d3.geoMercator().fitSize([width, height], geo);
    const path = d3.geoPath(projection);

    const root = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const defs = root.append("defs");

    const glow = defs
      .append("filter")
      .attr("id", "provinceGlow")
      .attr("x", "-80%")
      .attr("y", "-80%")
      .attr("width", "260%")
      .attr("height", "260%");

    glow.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "blur");

    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const signalGlow = defs
      .append("filter")
      .attr("id", "signalGlow")
      .attr("x", "-130%")
      .attr("y", "-130%")
      .attr("width", "360%")
      .attr("height", "360%");

    signalGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "12")
      .attr("result", "blur");

    const merge2 = signalGlow.append("feMerge");
    merge2.append("feMergeNode").attr("in", "blur");
    merge2.append("feMergeNode").attr("in", "SourceGraphic");

    const mapLayer = root.append("g").attr("class", "map-layer");

    const features = Array.isArray(geo.features) ? geo.features : [];

    mapLayer
      .selectAll("path.province")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const city = readProvinceName(d);
        return signalFill(signalMap.get(cityKey(city)));
      })
      .attr("stroke", (d: any) => {
        const city = readProvinceName(d);
        const signal = signalMap.get(cityKey(city));
        return signal?.signals ? "rgba(167,243,208,.68)" : "rgba(167,243,208,.28)";
      })
      .attr("stroke-width", (d: any) => {
        const city = readProvinceName(d);
        const signal = signalMap.get(cityKey(city));
        return signal?.signals ? 1.15 : 0.72;
      })
      .attr("filter", "url(#provinceGlow)")
      .style("cursor", "pointer")
      .on("mousemove", function (event: MouseEvent, d: any) {
        const city = readProvinceName(d);
        const item = signalMap.get(cityKey(city));
        const rect = mapBoxRef.current?.getBoundingClientRect();

        const rawX = event.clientX - (rect?.left ?? 0);
        const rawY = event.clientY - (rect?.top ?? 0);

        const boxW = rect?.width ?? 0;
        const boxH = rect?.height ?? 0;

        let nextX = rawX + TOOLTIP_GAP;
        let nextY = rawY - 20;

        if (nextX + TOOLTIP_W + TOOLTIP_PAD > boxW) {
          nextX = rawX - TOOLTIP_W - TOOLTIP_GAP;
        }

        if (nextY + TOOLTIP_H + TOOLTIP_PAD > boxH) {
          nextY = boxH - TOOLTIP_H - TOOLTIP_PAD;
        }

        if (nextX < TOOLTIP_PAD) nextX = TOOLTIP_PAD;
        if (nextY < TOOLTIP_PAD) nextY = TOOLTIP_PAD;

        setTooltip({
          city,
          signals: Number(item?.signals ?? 0),
          recentSignals: Number(item?.recentSignals ?? 0),
          gpsSignals: Number(item?.gpsSignals ?? 0),
          ipSignals: Number(item?.ipSignals ?? 0),
          x: nextX,
          y: nextY,
        });

        d3.select(this)
          .attr("stroke", "rgba(255,255,255,.95)")
          .attr("stroke-width", 2);
      })
      .on("mouseleave", function (_event: MouseEvent, d: any) {
        const city = readProvinceName(d);
        const item = signalMap.get(cityKey(city));

        d3.select(this)
          .attr("stroke", item?.signals ? "rgba(167,243,208,.68)" : "rgba(167,243,208,.28)")
          .attr("stroke-width", item?.signals ? 1.15 : 0.72);

        setTooltip(null);
      });

    const activeCities = features.filter((d: any) => {
      const city = readProvinceName(d);
      const signal = signalMap.get(cityKey(city));
      return Number(signal?.signals ?? 0) > 0;
    });

    activeCities.forEach((d: any) => {
      const city = readProvinceName(d);
      const signal = signalMap.get(cityKey(city));
      if (!signal) return;

      const [cx, cy] = path.centroid(d);
      const color = signalColor(signal);

      const radius =
        signal.signals >= 100
          ? 34
          : signal.signals >= 50
          ? 28
          : signal.signals >= 20
          ? 24
          : 18;

      mapLayer
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", radius)
        .attr("fill", color)
        .attr("opacity", 0.15)
        .attr("filter", "url(#signalGlow)")
        .style("pointer-events", "none");

      for (let i = 0; i < 3; i++) {
        mapLayer
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 8)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("opacity", 0.9)
          .style("pointer-events", "none")
          .append("animate")
          .attr("attributeName", "r")
          .attr("from", "8")
          .attr("to", radius + 30)
          .attr("dur", "2.4s")
          .attr("begin", `${i * 0.8}s`)
          .attr("repeatCount", "indefinite");

        mapLayer
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 8)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .style("pointer-events", "none")
          .append("animate")
          .attr("attributeName", "opacity")
          .attr("from", "0.9")
          .attr("to", "0")
          .attr("dur", "2.4s")
          .attr("begin", `${i * 0.8}s`)
          .attr("repeatCount", "indefinite");
      }

      mapLayer
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", signal.gpsSignals ? 8 : 6.5)
        .attr("fill", color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("filter", "url(#signalGlow)")
        .style("pointer-events", "none");

      mapLayer
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 2.8)
        .attr("fill", "#ffffff")
        .style("pointer-events", "none");
    });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 6])
      .translateExtent([
        [-120, -120],
        [width + 120, height + 120],
      ])
      .on("zoom", (event) => {
        mapLayer.attr("transform", event.transform);
        setZoomText(`%${Math.round(event.transform.k * 100)}`);
      });

    zoomRef.current = zoom;
    svg.call(zoom as any);

    setMapReady(true);
  }, [geo, signalMap]);

  function zoomIn() {
    if (!svgRef.current || !zoomRef.current) return;

    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.scaleBy as any, 1.25);
  }

  function zoomOut() {
    if (!svgRef.current || !zoomRef.current) return;

    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.scaleBy as any, 0.8);
  }

  function resetZoom() {
    if (!svgRef.current || !zoomRef.current) return;

    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomRef.current.transform as any, d3.zoomIdentity);

    setZoomText("%100");
  }

  return (
    <section id="live-map" className="mt-16">
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[34px] border border-white/10 bg-[#020908] p-4 text-white shadow-[0_34px_140px_rgba(0,0,0,.38)] sm:rounded-[42px] sm:p-7">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-100">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.9)]" />
              CANLI TÜRKİYE HARİTASI
            </div>

            <h2 className="mt-5 max-w-4xl text-[34px] font-black leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl lg:text-[64px]">
              Türkiye’nin{" "}
              <span className="bg-gradient-to-r from-emerald-200 via-lime-200 to-emerald-100 bg-clip-text text-transparent">
                hal hareketi
              </span>{" "}
              anlık burada.
            </h2>

            <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-white/76">
              İlan ve talep sinyalleri il bazlı olarak haritada canlı görünür.
              GPS destekli kayıtlar turkuaz renkle öne çıkar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:w-[340px] lg:flex-col">
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-[#071713] px-6 text-sm font-black text-white shadow-[0_18px_70px_rgba(0,0,0,.22)] transition hover:bg-[#0b211b]"
            >
              <span className="mr-2 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.9)]" />
              Canlı Veriyi Yenile ↻
            </button>

            <div className="rounded-2xl border border-white/10 bg-[#071713] px-5 py-3 text-xs font-bold text-white/62">
              Son güncelleme:
              <span className="ml-2 font-black text-white">
                {lastRefresh || "yükleniyor"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon="📦" label="Aktif İlan" value={dashboard.activeListings} sub="Yayındaki akış" />
          <StatCard icon="👥" label="Aktif Satıcı" value={dashboard.activeSellers} sub="Türkiye genelinde" />
          <StatCard icon="🎯" label="Alıcı Talebi" value={dashboard.buyerRequests} sub="Pazarda bekleyen" />
          <StatCard icon="🏙️" label="Sinyal Veren İl" value={dashboard.activeSignalCities} sub="Son 24 saat" />
          <StatCard icon="⚡" label="5dk Sinyal" value={dashboard.totalSignals5m} sub="Anlık radar hareketi" />
        </div>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#061512] p-3 shadow-[0_28px_110px_rgba(0,0,0,.26)] sm:p-4">
          <div
            ref={mapBoxRef}
            className="relative min-h-[440px] overflow-hidden rounded-[26px] border border-white/10 bg-[#03100d] lg:min-h-[560px]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.038)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.038)_1px,transparent_1px)] bg-[size:36px_36px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(52,211,153,.18),transparent_26%),radial-gradient(circle_at_78%_62%,rgba(45,212,191,.12),transparent_32%)]" />

            <div className="absolute left-4 top-4 z-30 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm font-black text-white backdrop-blur-xl sm:left-5 sm:top-5">
              CANLI TÜRKİYE HARİTASI

              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-white/78">
                <span>🟢 Düşük</span>
                <span>🟡 Orta</span>
                <span>🟠 Yüksek</span>
                <span>🔴 Çok Yüksek</span>
                <span className="text-cyan-200">● GPS Sinyal</span>
              </div>
            </div>

            <div className="absolute right-4 top-4 z-30 hidden items-center gap-3 lg:flex">
              <button type="button" onClick={zoomOut} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/45 text-lg font-black text-white transition hover:bg-white/10">
                −
              </button>

              <button type="button" onClick={resetZoom} className="h-11 rounded-xl border border-white/10 bg-black/45 px-4 text-sm font-black text-white transition hover:bg-white/10">
                {zoomText}
              </button>

              <button type="button" onClick={zoomIn} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/45 text-lg font-black text-white transition hover:bg-white/10">
                +
              </button>
            </div>

            {!mapReady && (
              <div className="absolute inset-0 z-30 flex items-center justify-center">
                <div className="rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-sm font-black text-white backdrop-blur-xl">
                  Türkiye haritası yükleniyor...
                </div>
              </div>
            )}

            <svg ref={svgRef} className="relative z-10 h-full min-h-[440px] w-full lg:min-h-[560px]" />

            {tooltip && (
              <div
                className="pointer-events-none absolute z-50 w-[240px] rounded-2xl border border-white/15 bg-black/85 p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,.38)] backdrop-blur-2xl"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-base font-black">{tooltip.city}</div>

                  <span className="rounded-full bg-emerald-400/12 px-2 py-1 text-[10px] font-black text-emerald-200">
                    LIVE
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-white/10 p-2">
                    <div className="text-lg font-black">{tooltip.signals}</div>
                    <div className="text-[10px] font-bold text-white/55">24s Sinyal</div>
                  </div>

                  <div className="rounded-xl bg-emerald-400/12 p-2">
                    <div className="text-lg font-black text-emerald-200">
                      {tooltip.recentSignals}
                    </div>
                    <div className="text-[10px] font-bold text-white/55">5dk</div>
                  </div>

                  <div className="rounded-xl bg-cyan-400/12 p-2">
                    <div className="text-lg font-black text-cyan-200">
                      {tooltip.gpsSignals}
                    </div>
                    <div className="text-[10px] font-bold text-white/55">GPS</div>
                  </div>

                  <div className="rounded-xl bg-orange-400/12 p-2">
                    <div className="text-lg font-black text-orange-200">
                      {tooltip.ipSignals}
                    </div>
                    <div className="text-[10px] font-bold text-white/55">IP</div>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 z-30 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm font-semibold text-white backdrop-blur-xl sm:bottom-5 sm:left-5">
              <div className="font-black">81 il kapsanıyor</div>
              <div className="mt-1 text-xs text-white/65">
                Gerçek zamanlı izleniyor
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-30 hidden max-w-[390px] rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-xs font-semibold leading-relaxed text-white/78 backdrop-blur-xl sm:bottom-5 sm:right-5 sm:block">
              <span className="text-emerald-200">● GPS doğruluğu</span> olan
              sinyaller turkuaz renkte gösterilir.
              <br />
              <span className="text-yellow-200">● IP tabanlı</span> sinyaller
              yoğunluğa göre renklendirilir.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.25fr_1fr]">
          <div className="rounded-[26px] border border-white/10 bg-[#061512] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black tracking-wide text-white">
                EN FAZLA SİNYAL ALAN İLLER
              </div>

              <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-[11px] font-black text-emerald-200">
                24 SAAT
              </span>
            </div>

            <div className="mt-5 divide-y divide-white/8">
              {(topCities.length
                ? topCities
                : [{ city: "Sinyal bekleniyor", signals: 0 }]
              ).map((s, i) => {
                const city = s as CitySignal;
                const color = signalColor(city);

                return (
                  <button
                    type="button"
                    key={`${city.city}-${i}`}
                    className="flex w-full items-center gap-3 py-3 text-left transition hover:translate-x-1"
                  >
                    <div className="w-5 text-sm font-black text-white/78">
                      {i + 1}
                    </div>

                    <div
                      className="h-3.5 w-3.5 rounded-full shadow-[0_0_18px]"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 18px ${color}`,
                      }}
                    />

                    <div className="min-w-0 flex-1 truncate text-sm font-black text-white">
                      {city.city}
                    </div>

                    <div className="text-right text-xs font-semibold text-white/70">
                      {city.signals ?? 0} sinyal
                      <div className="mt-1 inline-flex rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                        {city.gpsSignals ? "GPS" : "IP"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <a href="/signals" className="mt-5 flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-black text-white transition hover:bg-white/10">
              Tüm şehirleri görüntüle →
            </a>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#061512] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black tracking-wide text-white">
                CANLI PAZAR NABZI
              </div>

              <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-[11px] font-black text-emerald-200">
                LIVE
              </span>
            </div>

            <div className="relative mt-5 h-[360px] overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#061512] to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[#061512] to-transparent" />

              {tickerFlow.length ? (
                <div className="animate-[tickerFlow_20s_linear_infinite] space-y-3 hover:[animation-play-state:paused]">
                  {tickerFlow.map((s, i) => (
                    <a
                      key={`${s.createdAt}-${i}`}
                      href={s.listingId ? `/pazar/${s.listingId}` : "/pazar"}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:bg-white/[0.06]"
                    >
                      <div className="h-3 w-3 shrink-0 rounded-full border-2 border-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.8)]" />

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-white/55">
                          {timeAgoTR(s.createdAt)}
                        </div>

                        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-white">
                          {signalSentence(s)}
                        </div>

                        <div className="mt-2 flex gap-2 text-xs font-medium text-white/58">
                          <span>{s.deviceType || "web"}</span>
                          <span>•</span>
                          <span className={s.locationSource === "gps" ? "text-cyan-200" : "text-orange-200"}>
                            {s.locationSource === "gps" ? "GPS" : "IP"}
                          </span>
                        </div>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl shadow-[0_0_30px_rgba(255,255,255,.08)]">
                        {productEmoji(s.productName || s.listingTitle)}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-black text-white/60">
                  Canlı sinyal bekleniyor.
                </div>
              )}
            </div>

            <a href="/pazar" className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-black text-white transition hover:bg-white/10">
              Tüm akışı görüntüle →
            </a>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[#061512] p-5">
            <div className="text-sm font-black tracking-wide text-white">
              HALAPP AVANTAJLARI
            </div>

            <div className="mt-5 space-y-3">
              <AdvantageCard icon="⚡" title="Gerçek Zamanlı" text="Anlık ilan ve talep sinyalleri" />
              <AdvantageCard icon="🗺️" title="81 İl Kapsamı" text="Türkiye’nin her ilinden canlı veri" />
              <AdvantageCard icon="🎯" title="GPS Doğruluğu" text="İzin veren kullanıcının kesin konumu" />
              <AdvantageCard icon="🛡️" title="Güvenli Ticaret" text="Doğru alıcı, doğru satıcı ile buluşur" />
              <AdvantageCard icon="🛰️" title="Pazar her yerde hareket ediyor!" text="HalApp ile anlık takipte kalın." active />
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes tickerFlow {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(-50%);
            }
          }
        `}</style>
      </div>
    </section>
  );
}