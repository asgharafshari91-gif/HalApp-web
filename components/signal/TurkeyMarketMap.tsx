"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type CityStat = {
  city: string;
  signals: number;
  gps?: number;
  ip?: number;
  mobile?: number;
  desktop?: number;
  lastAt?: string;
};

type Props = {
  cities: CityStat[];
};

type TooltipState = {
  city: string;
  signals: number;
  gps: number;
  ip: number;
  mobile: number;
  desktop: number;
  lastAt?: string;
  x: number;
  y: number;
} | null;

function normalize(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

function displayCity(value?: string | null) {
  const key = normalize(value);

  const fixes: Record<string, string> = {
    adana: "Adana",
    adiyaman: "Adıyaman",
    afyonkarahisar: "Afyonkarahisar",
    agri: "Ağrı",
    amasya: "Amasya",
    ankara: "Ankara",
    antalya: "Antalya",
    artvin: "Artvin",
    aydin: "Aydın",
    balikesir: "Balıkesir",
    bilecik: "Bilecik",
    bingol: "Bingöl",
    bitlis: "Bitlis",
    bolu: "Bolu",
    burdur: "Burdur",
    bursa: "Bursa",
    canakkale: "Çanakkale",
    cankiri: "Çankırı",
    corum: "Çorum",
    denizli: "Denizli",
    diyarbakir: "Diyarbakır",
    edirne: "Edirne",
    elazig: "Elazığ",
    erzincan: "Erzincan",
    erzurum: "Erzurum",
    eskisehir: "Eskişehir",
    gaziantep: "Gaziantep",
    giresun: "Giresun",
    gumushane: "Gümüşhane",
    hakkari: "Hakkari",
    hatay: "Hatay",
    isparta: "Isparta",
    mersin: "Mersin",
    istanbul: "İstanbul",
    izmir: "İzmir",
    kars: "Kars",
    kastamonu: "Kastamonu",
    kayseri: "Kayseri",
    kirklareli: "Kırklareli",
    kirsehir: "Kırşehir",
    kocaeli: "Kocaeli",
    konya: "Konya",
    kutahya: "Kütahya",
    malatya: "Malatya",
    manisa: "Manisa",
    kahramanmaras: "Kahramanmaraş",
    mardin: "Mardin",
    mugla: "Muğla",
    mus: "Muş",
    nevsehir: "Nevşehir",
    nigde: "Niğde",
    ordu: "Ordu",
    rize: "Rize",
    sakarya: "Sakarya",
    samsun: "Samsun",
    siirt: "Siirt",
    sinop: "Sinop",
    sivas: "Sivas",
    tekirdag: "Tekirdağ",
    tokat: "Tokat",
    trabzon: "Trabzon",
    tunceli: "Tunceli",
    sanliurfa: "Şanlıurfa",
    usak: "Uşak",
    van: "Van",
    yozgat: "Yozgat",
    zonguldak: "Zonguldak",
    aksaray: "Aksaray",
    bayburt: "Bayburt",
    karaman: "Karaman",
    kirikkale: "Kırıkkale",
    batman: "Batman",
    sirnak: "Şırnak",
    bartin: "Bartın",
    ardahan: "Ardahan",
    igdir: "Iğdır",
    yalova: "Yalova",
    karabuk: "Karabük",
    kilis: "Kilis",
    osmaniye: "Osmaniye",
    duzce: "Düzce",
  };

  if (fixes[key]) return fixes[key];

  const raw = String(value ?? "").trim();
  return raw || "Bilinmeyen";
}

function readProvinceName(d: any) {
  return displayCity(
    d?.properties?.name ||
      d?.properties?.NAME_1 ||
      d?.properties?.province ||
      d?.properties?.il ||
      d?.properties?.adm1_tr ||
      d?.properties?.shapeName ||
      d?.properties?.Name ||
      d?.properties?.NAME ||
      ""
  );
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function timeAgo(value?: string | null) {
  if (!value) return "veri yok";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "veri yok";

  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);

  if (min < 1) return "şimdi";
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} sa önce`;

  return `${Math.floor(hour / 24)} gün önce`;
}

function heatLevel(count: number) {
  if (count >= 100) return "veryHigh";
  if (count >= 50) return "high";
  if (count >= 20) return "mid";
  if (count > 0) return "low";
  return "none";
}

function fillColor(count: number) {
  const level = heatLevel(count);

  if (level === "veryHigh") return "rgba(239,68,68,.82)";
  if (level === "high") return "rgba(249,115,22,.78)";
  if (level === "mid") return "rgba(245,158,11,.70)";
  if (level === "low") return "rgba(16,185,129,.58)";

  return "rgba(148,163,184,.18)";
}

function strokeColor(count: number) {
  const level = heatLevel(count);

  if (level === "veryHigh") return "rgba(248,113,113,.98)";
  if (level === "high") return "rgba(251,146,60,.98)";
  if (level === "mid") return "rgba(251,191,36,.98)";
  if (level === "low") return "rgba(52,211,153,.95)";

  return "rgba(148,163,184,.36)";
}

function glowColor(count: number) {
  const level = heatLevel(count);

  if (level === "veryHigh") return "rgba(239,68,68,.28)";
  if (level === "high") return "rgba(249,115,22,.24)";
  if (level === "mid") return "rgba(245,158,11,.20)";
  if (level === "low") return "rgba(16,185,129,.18)";

  return "transparent";
}

function cityIcon(city?: string) {
  const c = normalize(city);

  if (c.includes("antalya")) return "🔥";
  if (c.includes("istanbul")) return "🚀";
  if (c.includes("izmir")) return "⚡";
  if (c.includes("bursa")) return "📈";
  if (c.includes("mersin")) return "🌴";
  if (c.includes("adana")) return "☀️";

  return "📍";
}

function TooltipMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-100 p-3 dark:bg-white/[0.06]">
      <div className="text-[10px] font-black uppercase text-zinc-400 dark:text-white/35">
        {label}
      </div>

      <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function getTooltipPosition({
  x,
  y,
  containerWidth,
  containerHeight,
}: {
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const tooltipWidth = 260;
  const tooltipHeight = 235;
  const gap = 18;
  const padding = 16;

  let left = x + gap;
  let top = y + gap;

  if (left + tooltipWidth > containerWidth - padding) {
    left = x - tooltipWidth - gap;
  }

  if (top + tooltipHeight > containerHeight - padding) {
    top = y - tooltipHeight - gap;
  }

  left = Math.max(padding, Math.min(left, containerWidth - tooltipWidth - padding));
  top = Math.max(padding, Math.min(top, containerHeight - tooltipHeight - padding));

  return { left, top };
}

function HotCitiesDropdown({ cities }: { cities: CityStat[] }) {
  const [open, setOpen] = useState(false);
  const max = Math.max(...cities.map((x) => x.signals), 1);

  return (
    <div className="absolute right-5 top-5 z-[80]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 text-xs font-black text-zinc-700 shadow-sm backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-black/35 dark:text-white/75"
      >
        🔥 En Sıcak İller

        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-700 dark:text-emerald-300">
          {cities.length}
        </span>
      </button>

      {open ? (
        <div className="mt-3 w-[320px] overflow-hidden rounded-[26px] border border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#071015]/95">
          <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-white/10">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
                Hot Cities
              </div>

              <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
                En sıcak iller
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-sm font-black text-zinc-600 dark:bg-white/[0.06] dark:text-white/70"
            >
              ×
            </button>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto p-4 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-300 dark:scrollbar-thumb-white/20">
            {(cities.length ? cities : [{ city: "Veri yok", signals: 0 }]).map((c, i) => {
              const width = max ? Math.max(8, (c.signals / max) * 100) : 0;

              return (
                <div
                  key={`${c.city}-${i}`}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                      {cityIcon(c.city)} {c.city}
                    </div>

                    <div className="text-xs font-black text-zinc-500 dark:text-white/45">
                      {fmt(c.signals)}
                    </div>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <TooltipMetric label="GPS" value={fmt(c.gps ?? 0)} />
                    <TooltipMetric label="IP" value={fmt(c.ip ?? 0)} />
                    <TooltipMetric label="Mobil" value={fmt(c.mobile ?? 0)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TurkeyMarketMap({ cities }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);

  const [geo, setGeo] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const cityMap = useMemo(() => {
    const map = new Map<string, CityStat>();

    for (const c of cities) {
      map.set(normalize(c.city), c);
    }

    return map;
  }, [cities]);

  const topCities = useMemo(() => cities.slice(0, 5), [cities]);

  const totalSignals = useMemo(
    () => cities.reduce((sum, c) => sum + Number(c.signals || 0), 0),
    [cities]
  );

  const gpsSignals = useMemo(
    () => cities.reduce((sum, c) => sum + Number(c.gps || 0), 0),
    [cities]
  );

  const gpsRate =
    totalSignals > 0 ? Math.round((gpsSignals / totalSignals) * 100) : 0;

  const tooltipPosition = useMemo(() => {
    if (!tooltip || !mapBoxRef.current) return { left: 20, top: 20 };

    const rect = mapBoxRef.current.getBoundingClientRect();

    return getTooltipPosition({
      x: tooltip.x,
      y: tooltip.y,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });
  }, [tooltip]);

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
    if (!geo || !svgRef.current) return;

    setReady(false);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1120;
    const height = 520;

    const projection = d3.geoMercator().fitSize([width, height], geo);
    const path = d3.geoPath(projection);
    const features = Array.isArray(geo.features) ? geo.features : [];

    const root = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const defs = root.append("defs");

    const glow = defs.append("filter").attr("id", "mapGlow");
    glow.append("feGaussianBlur").attr("stdDeviation", "7").attr("result", "blur");
    const glowMerge = glow.append("feMerge");
    glowMerge.append("feMergeNode").attr("in", "blur");
    glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const provinceGlow = defs.append("filter").attr("id", "provinceSoftGlow");
    provinceGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "2.4")
      .attr("result", "blur");
    const provinceMerge = provinceGlow.append("feMerge");
    provinceMerge.append("feMergeNode").attr("in", "blur");
    provinceMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = root.append("g").attr("class", "map-layer");

    g.selectAll("path.province")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("d", path as any)
      .attr("fill", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return fillColor(stat?.signals ?? 0);
      })
      .attr("stroke", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return strokeColor(stat?.signals ?? 0);
      })
      .attr("stroke-width", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return stat?.signals ? 1.35 : 0.75;
      })
      .attr("filter", "url(#provinceSoftGlow)")
      .style("cursor", "pointer")
      .on("mousemove", function (event: MouseEvent, d: any) {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));

        d3.select(this)
          .attr("stroke", "rgba(255,255,255,.95)")
          .attr("stroke-width", 2);

        const rect = mapBoxRef.current?.getBoundingClientRect();

        setTooltip({
          city: name,
          signals: stat?.signals ?? 0,
          gps: stat?.gps ?? 0,
          ip: stat?.ip ?? 0,
          mobile: stat?.mobile ?? 0,
          desktop: stat?.desktop ?? 0,
          lastAt: stat?.lastAt,
          x: event.clientX - (rect?.left ?? 0),
          y: event.clientY - (rect?.top ?? 0),
        });
      })
      .on("mouseleave", function (_event: MouseEvent, d: any) {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));

        d3.select(this)
          .attr("stroke", strokeColor(stat?.signals ?? 0))
          .attr("stroke-width", stat?.signals ? 1.35 : 0.75);

        setTooltip(null);
      });

    const activeFeatures = features.filter((d: any) => {
      const name = readProvinceName(d);
      const stat = cityMap.get(normalize(name));
      return Number(stat?.signals || 0) > 0;
    });

    g.selectAll("circle.heat-glow")
      .data(activeFeatures)
      .enter()
      .append("circle")
      .attr("class", "heat-glow")
      .attr("cx", (d: any) => path.centroid(d)[0])
      .attr("cy", (d: any) => path.centroid(d)[1])
      .attr("r", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return Math.min(76, 22 + Number(stat?.signals || 0) * 0.58);
      })
      .attr("fill", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return glowColor(stat?.signals ?? 0);
      })
      .attr("filter", "url(#mapGlow)")
      .style("pointer-events", "none");

    g.selectAll("circle.signal-ring")
      .data(activeFeatures)
      .enter()
      .append("circle")
      .attr("class", "signal-ring")
      .attr("cx", (d: any) => path.centroid(d)[0])
      .attr("cy", (d: any) => path.centroid(d)[1])
      .attr("r", 8)
      .attr("fill", "none")
      .attr("stroke", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return strokeColor(stat?.signals ?? 0);
      })
      .attr("stroke-width", 3)
      .attr("opacity", 0.8)
      .style("pointer-events", "none")
      .append("animate")
      .attr("attributeName", "r")
      .attr("from", "8")
      .attr("to", "42")
      .attr("dur", "1.9s")
      .attr("repeatCount", "indefinite");

    g.selectAll("circle.signal-ring-fade")
      .data(activeFeatures)
      .enter()
      .append("circle")
      .attr("class", "signal-ring-fade")
      .attr("cx", (d: any) => path.centroid(d)[0])
      .attr("cy", (d: any) => path.centroid(d)[1])
      .attr("r", 8)
      .attr("fill", "none")
      .attr("stroke", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return strokeColor(stat?.signals ?? 0);
      })
      .attr("stroke-width", 2)
      .style("pointer-events", "none")
      .append("animate")
      .attr("attributeName", "opacity")
      .attr("from", "0.8")
      .attr("to", "0")
      .attr("dur", "1.9s")
      .attr("repeatCount", "indefinite");

    g.selectAll("circle.signal-dot")
      .data(activeFeatures)
      .enter()
      .append("circle")
      .attr("class", "signal-dot")
      .attr("cx", (d: any) => path.centroid(d)[0])
      .attr("cy", (d: any) => path.centroid(d)[1])
      .attr("r", 5)
      .attr("fill", (d: any) => {
        const name = readProvinceName(d);
        const stat = cityMap.get(normalize(name));
        return strokeColor(stat?.signals ?? 0);
      })
      .attr("stroke", "rgba(255,255,255,.95)")
      .attr("stroke-width", 1.5)
      .attr("filter", "url(#mapGlow)")
      .style("pointer-events", "none");

    g.selectAll("text.city-label")
      .data(activeFeatures.slice(0, 12))
      .enter()
      .append("text")
      .attr("class", "city-label")
      .attr("x", (d: any) => path.centroid(d)[0] + 13)
      .attr("y", (d: any) => path.centroid(d)[1] - 12)
      .attr("font-size", "13")
      .attr("font-weight", "900")
      .attr("fill", "currentColor")
      .attr("paint-order", "stroke")
      .attr("stroke", "rgba(255,255,255,.75)")
      .attr("stroke-width", "4")
      .attr("stroke-linejoin", "round")
      .text((d: any) => readProvinceName(d));

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

    setReady(true);
  }, [geo, cityMap]);

  return (
    <section className="overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
      <div className="flex flex-col gap-4 border-b border-zinc-200 p-6 dark:border-white/10 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
            TÜRKİYE PAZAR HARİTASI
          </div>

          <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
            Canlı Şehir Sinyalleri
          </h2>

          <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-white/50">
            İl bazlı görüntüleme, GPS ve IP hareket yoğunluğu
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-[10px] font-black uppercase text-zinc-400 dark:text-white/35">
              Sinyal
            </div>
            <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
              {fmt(totalSignals)}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
              GPS
            </div>
            <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
              %{gpsRate}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
            <div className="text-[10px] font-black uppercase text-cyan-700 dark:text-cyan-300">
              İl
            </div>
            <div className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
              {cities.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0">
        <div
          ref={mapBoxRef}
          className="relative min-h-[520px] overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-orange-50 dark:from-[#071716] dark:via-[#0b1021] dark:to-[#17120b]"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.08)_1px,transparent_1px)] bg-[size:38px_38px]" />
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[110px]" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-orange-500/10 blur-[110px]" />

          <HotCitiesDropdown cities={topCities} />

          {!ready ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="rounded-2xl border border-zinc-200 bg-white/85 px-5 py-4 text-sm font-black text-zinc-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/40 dark:text-white/70">
                Türkiye haritası yükleniyor...
              </div>
            </div>
          ) : null}

          <svg
            ref={svgRef}
            className="relative z-10 h-full min-h-[520px] w-full text-zinc-900 dark:text-white"
          />

          {tooltip ? (
            <div
              className="pointer-events-none absolute z-[90] w-[260px] rounded-3xl border border-zinc-200 bg-white/95 p-4 text-xs shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#071015]/95"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-black text-zinc-950 dark:text-white">
                  {cityIcon(tooltip.city)} {tooltip.city}
                </div>

                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                  LIVE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <TooltipMetric label="Sinyal" value={fmt(tooltip.signals)} />
                <TooltipMetric label="GPS" value={fmt(tooltip.gps)} />
                <TooltipMetric label="IP" value={fmt(tooltip.ip)} />
                <TooltipMetric label="Mobil" value={fmt(tooltip.mobile)} />
              </div>

              <div className="mt-3 rounded-2xl bg-zinc-100 p-3 font-bold text-zinc-500 dark:bg-white/[0.06] dark:text-white/45">
                Son aktivite: {timeAgo(tooltip.lastAt)}
              </div>
            </div>
          ) : null}

          <div className="absolute bottom-5 left-5 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white/85 px-4 py-3 text-xs font-bold text-zinc-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-black/35 dark:text-white/65">
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Düşük
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Orta
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Yüksek
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-red-500" /> Çok Yüksek
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}