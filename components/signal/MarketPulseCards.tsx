"use client";

import { useMemo, useState } from "react";
import type { SignalRow } from "@/types/signal";

type PulseCard = {
  city: string;
  product: string;
  signals: number;
};

type TopProduct = {
  productName: string;
  signals: number;
};

type TradeRoute = {
  productName: string;
  listingCity: string;
  listingDistrict: string;
  buyerCity: string;
  buyerDistrict: string;
  signals: number;
  gpsSignals: number;
  ipSignals: number;
  mobileSignals: number;
  desktopSignals: number;
  uniqueVisitors: number;
  lastAt: string;
};

type Props = {
  data: PulseCard[];
  tradeRoutes?: TradeRoute[];
  topProducts?: TopProduct[];
  signals?: SignalRow[];
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function normalize(value?: string | null) {
  return String(value ?? "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .trim();
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function score(value: number, max: number) {
  if (!max) return 0;
  return Math.max(8, Math.min(100, Math.round((value / max) * 100)));
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
  const s = normalize(name);

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

  // Sebzeler
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

  // Yeşillikler
  if (s.includes("roka")) return "🌿";
  if (s.includes("nane")) return "🌿";
  if (s.includes("maydanoz")) return "🌿";
  if (s.includes("dereotu")) return "🌿";
  if (s.includes("fesleğen")) return "🌿";
  if (s.includes("tere")) return "🌿";

  // Kuru yemiş
  if (s.includes("ceviz")) return "🥜";
  if (s.includes("badem")) return "🥜";
  if (s.includes("fındık")) return "🥜";
  if (s.includes("antep fıstığı")) return "🥜";

  // Genel
  return "🧺";
}

function cityIcon(city?: string | null) {
  const c = normalize(city);

  if (c.includes("antalya")) return "🔥";
  if (c.includes("istanbul")) return "🚀";
  if (c.includes("izmir")) return "⚡";
  if (c.includes("mersin")) return "🍋";
  if (c.includes("bursa")) return "📈";
  if (c.includes("ankara")) return "🏛️";
  if (c.includes("malatya")) return "🍑";
  if (c.includes("aydın") || c.includes("aydin")) return "🌿";

  return "📍";
}

function routeScore(route: TradeRoute, maxSignals: number) {
  const signalPower = score(route.signals, maxSignals);
  const gpsRate = percent(route.gpsSignals, route.signals);
  const mobileRate = percent(route.mobileSignals, route.signals);
  const visitorPower = Math.min(100, route.uniqueVisitors * 12);

  return Math.min(
    100,
    Math.round(signalPower * 0.48 + gpsRate * 0.22 + mobileRate * 0.18 + visitorPower * 0.12)
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
      <div className="truncate text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function PulseSectionTitle({
  eyebrow,
  title,
  badge,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
          {eyebrow}
        </div>
        <h3 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
          {title}
        </h3>
      </div>

      {badge ? (
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function HotRouteCard({
  route,
  maxSignals,
}: {
  route: TradeRoute;
  maxSignals: number;
}) {
  const value = routeScore(route, maxSignals);
  const gpsRate = percent(route.gpsSignals, route.signals);

  return (
    <div className="rounded-[26px] border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{productEmoji(route.productName)}</span>
            <div className="truncate text-base font-black text-zinc-950 dark:text-white">
              {route.productName}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm font-black text-zinc-700 dark:text-white/70">
            <span className="truncate">{cityIcon(route.buyerCity)} {route.buyerCity}</span>
            <span className="text-zinc-400">→</span>
            <span className="truncate">{cityIcon(route.listingCity)} {route.listingCity}</span>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-700 dark:text-rose-300">
          {value}/100
        </span>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-yellow-300"
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Sinyal" value={fmt(route.signals)} />
        <MiniMetric label="GPS" value={`%${gpsRate}`} />
        <MiniMetric label="Kişi" value={fmt(route.uniqueVisitors)} />
      </div>
    </div>
  );
}

function AlarmRow({
  route,
  maxSignals,
}: {
  route: TradeRoute;
  maxSignals: number;
}) {
  const value = routeScore(route, maxSignals);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
            🚨 {route.buyerCity} → {route.productName}
          </div>

          <div className="mt-1 truncate text-xs font-semibold text-zinc-500 dark:text-white/45">
            {route.listingCity} ilanlarına {fmt(route.signals)} gerçek sinyal
          </div>
        </div>

        
      </div>
    </div>
  );
}

function ProductFireRow({
  product,
  maxSignals,
}: {
  product: TopProduct;
  maxSignals: number;
}) {
  const value = score(product.signals, maxSignals);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-white/[0.07]">
            {productEmoji(product.productName)}
          </span>

          <div className="min-w-0">
            <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
              {product.productName}
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
              {fmt(product.signals)} sinyal
            </div>
          </div>
        </div>

        <span className="text-sm font-black text-zinc-950 dark:text-white">
          {value}/100
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function BuyerCityCard({
  city,
  products,
}: {
  city: string;
  products: Array<{ productName: string; signals: number }>;
}) {
  const total = products.reduce((s, p) => s + p.signals, 0);

  return (
    <div className="rounded-[26px] border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-black text-zinc-950 dark:text-white">
            {cityIcon(city)} {city}
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
            {fmt(total)} ürün sinyali
          </div>
        </div>

        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-300">
          Alıcı
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {products.slice(0, 3).map((p) => {
          const pct = percent(p.signals, total);

          return (
            <div key={`${city}-${p.productName}`}>
              <div className="mb-1 flex justify-between gap-3 text-xs font-black text-zinc-600 dark:text-white/55">
                <span className="truncate">
                  {productEmoji(p.productName)} {p.productName}
                </span>
                <span>%{pct}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightBox({ route }: { route?: TradeRoute }) {
  if (!route) {
    return (
      <div className="rounded-[30px] border border-emerald-500/20 bg-emerald-500/10 p-5">
        <div className="text-3xl">🧠</div>
        <div className="mt-3 text-xl font-black text-zinc-950 dark:text-white">
          Veri bekleniyor
        </div>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/55">
          Ticaret rotaları oluşunca burada canlı pazar yorumu görünecek.
        </p>
      </div>
    );
  }

  const gpsRate = percent(route.gpsSignals, route.signals);

  return (
    <div className="rounded-[30px] border border-emerald-500/20 bg-emerald-500/10 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-4xl dark:bg-white/[0.07]">
          🧠
        </div>

        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            AI Ticaret Tavsiyesi
          </div>

          <h3 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
            {route.productName} rotası hareketli
          </h3>

          <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-700 dark:text-white/60">
            {route.buyerCity} tarafında {route.productName} ilgisi yükseliyor.
            Bu ilgi en çok {route.listingCity} ilanlarına yönelmiş. GPS güveni
            %{gpsRate}, toplam {fmt(route.signals)} sinyal ve {fmt(route.uniqueVisitors)}
            benzersiz kişi görünüyor.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarketPulseCards({
  data,
  tradeRoutes = [],
  topProducts = [],
  signals = [],
}: Props) {
  const [tab, setTab] = useState<"alarms" | "routes" | "products" | "buyers">(
    "alarms"
  );

  const activeRoutes = useMemo(
    () => tradeRoutes.filter((r) => Number(r.signals || 0) > 0),
    [tradeRoutes]
  );

  const maxRouteSignals = Math.max(...activeRoutes.map((r) => r.signals), 1);
  const maxProductSignals = Math.max(...topProducts.map((p) => p.signals), 1);

  const hotRoutes = useMemo(() => {
    return activeRoutes
      .map((r) => ({
        ...r,
        computedScore: routeScore(r, maxRouteSignals),
      }))
      .sort((a, b) => b.computedScore - a.computedScore)
      .slice(0, 4);
  }, [activeRoutes, maxRouteSignals]);

  const buyerMigration = useMemo(() => {
    const map = new Map<string, Map<string, number>>();

    for (const r of activeRoutes) {
      const city = r.buyerCity || "Bilinmeyen";
      const product = r.productName || "Ürün";

      if (!map.has(city)) map.set(city, new Map());

      const productMap = map.get(city)!;
      productMap.set(product, (productMap.get(product) ?? 0) + r.signals);
    }

    return Array.from(map.entries())
      .map(([city, productMap]) => ({
        city,
        products: Array.from(productMap.entries())
          .map(([productName, signals]) => ({ productName, signals }))
          .sort((a, b) => b.signals - a.signals),
      }))
      .sort(
        (a, b) =>
          b.products.reduce((s, p) => s + p.signals, 0) -
          a.products.reduce((s, p) => s + p.signals, 0)
      )
      .slice(0, 4);
  }, [activeRoutes]);

  const liveSignalCount = signals.length;
  const gpsCount = signals.filter((s) => normalize(s.locationSource) === "gps").length;
  const gpsRate = percent(gpsCount, liveSignalCount);

  const leaderRoute = hotRoutes[0];

  const tabs = [
    { key: "alarms", label: "Acil Talep", icon: "🚨" },
    { key: "routes", label: "Rotalar", icon: "🚚" },
    { key: "products", label: "Ürün Ateşi", icon: "🔥" },
    { key: "buyers", label: "Alıcı Göçü", icon: "🧲" },
  ] as const;

  return (
    <section className="overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
      <div className="border-b border-zinc-200 p-6 dark:border-white/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
              LIVE MARKET PULSE
            </div>

            <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
              Canlı Ticaret Merkezi
            </h2>

            <p className="mt-1 max-w-4xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
              Acil talep alarmı, sıcak ticaret rotaları, ürün ateş endeksi,
              alıcı göçü ve canlı ticaret tavsiyesini gerçek sinyal verisinden üretir.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniMetric label="Sinyal" value={fmt(liveSignalCount)} />
            <MiniMetric label="GPS" value={`%${gpsRate}`} />
            <MiniMetric label="Rota" value={fmt(activeRoutes.length)} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={[
                "rounded-full border px-4 py-2 text-xs font-black transition",
                tab === item.key
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-white/[0.08]",
              ].join(" ")}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeRoutes.length ? (
          <>
            {tab === "alarms" ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
                <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.025]">
                  <PulseSectionTitle
                    eyebrow="Demand Alert"
                    title="Acil Talep Alarmı"
                    badge="Canlı"
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                   {hotRoutes.map((r, index) => (
  <AlarmRow
    key={`${r.productName}-${r.buyerCity}-${r.listingCity}-${index}`}
    route={r}
    maxSignals={maxRouteSignals}
  />
))}
                  </div>
                </div>

                <InsightBox route={leaderRoute} />
              </div>
            ) : null}

            {tab === "routes" ? (
              <div>
                <PulseSectionTitle
                  eyebrow="Hot Routes"
                  title="En Sıcak Ticaret Rotaları"
                  badge="Gerçek rota"
                />

                <div className="grid gap-4 xl:grid-cols-2">
                 {hotRoutes.map((r, index) => (
  <HotRouteCard
    key={`${r.productName}-${r.buyerCity}-${r.listingCity}-${index}`}
    route={r}
    maxSignals={maxRouteSignals}
  />
))}
                </div>
              </div>
            ) : null}

            {tab === "products" ? (
              <div>
                <PulseSectionTitle
                  eyebrow="Product Fire Index"
                  title="Ürün Ateş Endeksi"
                  badge="Son 24 saat"
                />

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {topProducts.slice(0, 6).map((p) => (
                    <ProductFireRow
                      key={p.productName}
                      product={p}
                      maxSignals={maxProductSignals}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {tab === "buyers" ? (
              <div>
                <PulseSectionTitle
                  eyebrow="Buyer Migration"
                  title="Alıcı Göçü"
                  badge="Şehir ihtiyacı"
                />

                <div className="grid gap-4 xl:grid-cols-2">
                  {buyerMigration.map((b) => (
                    <BuyerCityCard
                      key={b.city}
                      city={b.city}
                      products={b.products}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-10 text-center dark:border-white/10 dark:bg-white/[0.035]">
            <div className="text-5xl">📡</div>

            <div className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
              Canlı pazar nabzı için veri bekleniyor
            </div>

            <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
              İlan görüntüleme ve ticaret rotaları geldikçe bu alan gerçek fırsatları gösterecek.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}