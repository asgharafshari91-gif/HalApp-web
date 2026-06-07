"use client";

import { useMemo, useState } from "react";

type CityStat = {
  city: string;
  signals: number;
  gps?: number;
  ip?: number;
  mobile?: number;
  desktop?: number;
  lastAt?: string;
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
  cities: CityStat[];
  tradeRoutes: TradeRoute[];
};

type ProductHeat = {
  productName: string;
  totalSignals: number;
  routeCount: number;
  buyerCities: number;
  listingCities: number;
  gpsSignals: number;
  mobileSignals: number;
  uniqueVisitors: number;
  lastAt: string;
  routes: TradeRoute[];
};

type CityHeat = {
  city: string;
  totalSignals: number;
  products: Array<{
    productName: string;
    signals: number;
  }>;
};

type Opportunity = {
  productName: string;
  buyerCity: string;
  buyerDistrict: string;
  listingCity: string;
  listingDistrict: string;
  signals: number;
  gpsSignals: number;
  mobileSignals: number;
  uniqueVisitors: number;
  score: number;
  lastAt: string;
  route: TradeRoute;
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

  const icons: Record<string, string> = {
    adana: "🌶️",
    adiyaman: "🏺",
    afyonkarahisar: "🥚",
    agri: "🏔️",
    amasya: "🍎",
    ankara: "🏛️",
    antalya: "🔥",
    artvin: "🌲",
    aydin: "🌿",
    balikesir: "🧀",
    bilecik: "🏞️",
    bingol: "🌄",
    bitlis: "🏔️",
    bolu: "🌲",
    burdur: "🌊",
    bursa: "📈",
    canakkale: "🏰",
    cankiri: "🧂",
    corum: "🌾",
    denizli: "🐓",
    diyarbakir: "🧱",
    edirne: "🌉",
    elazig: "🍇",
    erzincan: "🧀",
    erzurum: "❄️",
    eskisehir: "🚄",
    gaziantep: "🌶️",
    giresun: "🌰",
    gumushane: "⛰️",
    hakkari: "🏔️",
    hatay: "🫒",
    isparta: "🌹",
    mersin: "🍋",
    istanbul: "🚀",
    izmir: "⚡",
    kars: "🧀",
    kastamonu: "🌲",
    kayseri: "⛰️",
    kirklareli: "🌻",
    kirsehir: "🎶",
    kocaeli: "🏭",
    konya: "🌾",
    kutahya: "🏺",
    malatya: "🍑",
    manisa: "🍇",
    kahramanmaras: "🍦",
    mardin: "🕌",
    mugla: "🌊",
    mus: "🏔️",
    nevsehir: "🎈",
    nigde: "🍏",
    ordu: "🌰",
    rize: "🍵",
    sakarya: "🚜",
    samsun: "⚓",
    siirt: "🥜",
    sinop: "🌊",
    sivas: "🐑",
    tekirdag: "🌻",
    tokat: "🍅",
    trabzon: "⛰️",
    tunceli: "🏞️",
    sanliurfa: "🌾",
    usak: "🧶",
    van: "🐈",
    yozgat: "🌾",
    zonguldak: "⛏️",
    aksaray: "🏜️",
    bayburt: "⛰️",
    karaman: "🍎",
    kirikkale: "🏭",
    batman: "🛢️",
    sirnak: "⛰️",
    bartin: "🌊",
    ardahan: "❄️",
    igdir: "🍑",
    yalova: "🌊",
    karabuk: "🏭",
    kilis: "🫒",
    osmaniye: "🌲",
    duzce: "🌲",
  };

  return icons[c] ?? "📍";
}

function routeScore(route: TradeRoute, maxSignals: number) {
  const signalPower = score(route.signals, maxSignals);
  const gpsRate = percent(route.gpsSignals, route.signals);
  const mobileRate = percent(route.mobileSignals, route.signals);
  const visitorPower = Math.min(100, route.uniqueVisitors * 12);

  return Math.min(
    100,
    Math.round(
      signalPower * 0.48 +
        gpsRate * 0.22 +
        mobileRate * 0.18 +
        visitorPower * 0.12
    )
  );
}

function opportunityTone(value: number) {
  if (value >= 85) {
    return {
      label: "Fırsat Tespit Edildi",
      short: "Çok Sıcak",
      icon: "🔥",
      border: "border-rose-500/25",
      bg: "bg-rose-500/10",
      text: "text-rose-700 dark:text-rose-300",
      bar: "from-rose-500 via-orange-400 to-yellow-300",
      glow: "bg-rose-500/20",
    };
  }

  if (value >= 70) {
    return {
      label: "Yükselen Ticaret Rotası",
      short: "Yükseliyor",
      icon: "⚡",
      border: "border-orange-500/25",
      bg: "bg-orange-500/10",
      text: "text-orange-700 dark:text-orange-300",
      bar: "from-orange-500 via-yellow-400 to-emerald-400",
      glow: "bg-orange-500/20",
    };
  }

  if (value >= 50) {
    return {
      label: "Takip Edilecek Hareket",
      short: "Takip Et",
      icon: "📈",
      border: "border-emerald-500/25",
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      bar: "from-emerald-500 via-cyan-400 to-blue-400",
      glow: "bg-emerald-500/15",
    };
  }

  return {
    label: "Düşük Sinyal",
    short: "Düşük",
    icon: "👁️",
    border: "border-zinc-300 dark:border-white/10",
    bg: "bg-zinc-100 dark:bg-white/[0.04]",
    text: "text-zinc-600 dark:text-white/55",
    bar: "from-zinc-400 to-zinc-300",
    glow: "bg-zinc-500/10",
  };
}

function routeInsight(route: TradeRoute, value: number) {
  const gpsRate = percent(route.gpsSignals, route.signals);
  const mobileRate = percent(route.mobileSignals, route.signals);

  const buyer = route.buyerDistrict
    ? `${route.buyerCity}/${route.buyerDistrict}`
    : route.buyerCity;

  const seller = route.listingDistrict
    ? `${route.listingCity}/${route.listingDistrict}`
    : route.listingCity;

  if (value >= 85) {
    return `${buyer} tarafından ${seller} ${route.productName} ilanlarına çok güçlü ilgi var. Bu rota tüccar için sıcak fırsat.`;
  }

  if (value >= 70) {
    return `${buyer} → ${seller} ${route.productName} hareketi yükseliyor. Stok, fiyat ve satıcı teması kontrol edilmeli.`;
  }

  if (gpsRate >= 60) {
    return `${route.productName} rotasında GPS doğrulamalı ilgi var. Veri güveni yüksek, rota takip edilmeli.`;
  }

  if (mobileRate >= 70) {
    return `${route.productName} için mobil ağırlıklı hareket var. Sahadan gelen hızlı alıcı ilgisi olabilir.`;
  }

  return `${route.productName} için ${buyer} → ${seller} rotasında sinyal oluştu. Henüz düşük ama takip edilmeye değer.`;
}

function productInsight(product: ProductHeat) {
  const top = product.routes[0];

  if (!top) return `${product.productName} için henüz güçlü rota oluşmadı.`;

  return `${product.productName} en çok ${top.buyerCity} tarafından ${top.listingCity} ilanlarında hareket görüyor. ${fmt(
    product.totalSignals
  )} sinyal, ${product.buyerCities} alıcı şehir ve ${product.listingCities} ilan şehri ile takip ediliyor.`;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
      <div className="truncate text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function OpportunityCard({
  item,
  index,
  onClick,
}: {
  item: Opportunity;
  maxSignals: number;
  index: number;
  onClick: () => void;
}) {
  const tone = opportunityTone(item.score);
  const gpsRate = percent(item.gpsSignals, item.signals);
  const mobileRate = percent(item.mobileSignals, item.signals);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative overflow-hidden rounded-[32px] border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
        tone.border,
        tone.bg,
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl",
          tone.glow,
        ].join(" ")}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/40 bg-white/70 text-4xl dark:border-white/10 dark:bg-white/[0.08]">
                {productEmoji(item.productName)}
              </div>

              <div className="min-w-0">
                <div className="truncate text-2xl font-black text-zinc-950 dark:text-white">
                  {item.productName}
                </div>

                <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
                  Son hareket: {timeAgo(item.lastAt)}
                </div>
              </div>
            </div>
          </div>

          <div
            className={[
              "shrink-0 rounded-full px-3 py-1 text-xs font-black",
              "bg-white/70 dark:bg-white/[0.08]",
              tone.text,
            ].join(" ")}
          >
            {tone.icon} {tone.short}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-zinc-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.055]">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0">
              <div className="truncate text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
                İhtiyaç sinyali
              </div>

              <div className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
                {cityIcon(item.buyerCity)} {item.buyerCity}
              </div>

              {item.buyerDistrict ? (
                <div className="mt-0.5 truncate text-xs font-semibold text-zinc-500 dark:text-white/40">
                  {item.buyerDistrict}
                </div>
              ) : null}
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white shadow-lg dark:bg-white dark:text-zinc-950">
              →
            </div>

            <div className="min-w-0 text-right">
              <div className="truncate text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
                İlan pazarı
              </div>

              <div className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">
                {cityIcon(item.listingCity)} {item.listingCity}
              </div>

              {item.listingDistrict ? (
                <div className="mt-0.5 truncate text-xs font-semibold text-zinc-500 dark:text-white/40">
                  {item.listingDistrict}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
              Fırsat Skoru
            </div>

            <div className="mt-1 text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              {item.score}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
              Sinyal
            </div>

            <div className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
              {fmt(item.signals)}
            </div>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
          <div
            className={[
              "h-full rounded-full bg-gradient-to-r transition-all duration-700",
              tone.bar,
            ].join(" ")}
            style={{ width: `${item.score}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniMetric label="GPS" value={`%${gpsRate}`} />
          <MiniMetric label="Mobil" value={`%${mobileRate}`} />
          <MiniMetric label="Kişi" value={fmt(item.uniqueVisitors)} />
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white/70 p-3 text-xs font-bold leading-relaxed text-zinc-600 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/55">
          {routeInsight(item.route, item.score)}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-black text-zinc-500 dark:text-white/40">
            #{index + 1} fırsat motoru
          </span>

          <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white dark:bg-white dark:text-zinc-950">
            Fırsatı Aç →
          </span>
        </div>
      </div>
    </button>
  );
}

function ProductHeatTable({
  products,
  maxSignals,
  onSelect,
}: {
  products: ProductHeat[];
  maxSignals: number;
  onSelect: (product: ProductHeat) => void;
}) {
  return (
    <div className="space-y-3">
      {products.map((product) => {
        const heat = score(product.totalSignals, maxSignals);
        const gpsRate = percent(product.gpsSignals, product.totalSignals);
        const mobileRate = percent(product.mobileSignals, product.totalSignals);
        const topRoute = product.routes[0];

        return (
          <button
            key={product.productName}
            type="button"
            onClick={() => onSelect(product)}
            className="w-full rounded-[26px] border border-zinc-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-white/[0.08]">
                  {productEmoji(product.productName)}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-base font-black text-zinc-950 dark:text-white">
                    {product.productName}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
                    {product.routeCount} rota • {product.buyerCities} alıcı şehir
                  </div>
                </div>
              </div>

              <div className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                {heat}/100
              </div>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
                style={{ width: `${heat}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniMetric label="Sinyal" value={fmt(product.totalSignals)} />
              <MiniMetric label="GPS" value={`%${gpsRate}`} />
              <MiniMetric label="Mobil" value={`%${mobileRate}`} />
            </div>

            {topRoute ? (
              <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-[10px] font-black uppercase tracking-wide text-zinc-400 dark:text-white/35">
                  En sıcak rota
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-sm font-black text-zinc-950 dark:text-white">
                  <span className="min-w-0 truncate">
                    {cityIcon(topRoute.buyerCity)} {topRoute.buyerCity}
                  </span>

                  <span className="shrink-0 text-zinc-400">→</span>

                  <span className="min-w-0 truncate text-right">
                    {cityIcon(topRoute.listingCity)} {topRoute.listingCity}
                  </span>
                </div>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
function CityHeatCard({ city, maxSignals }: { city: CityHeat; maxSignals: number }) {
  const heat = score(city.totalSignals, maxSignals);
  const topProduct = city.products[0];

  return (
    <div className="rounded-[26px] border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
            {cityIcon(city.city)} {city.city}
          </div>

          <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
            {topProduct ? `${topProduct.productName} öne çıkıyor` : "Ürün bekleniyor"}
          </div>
        </div>

        <div className="shrink-0 text-right text-sm font-black text-zinc-950 dark:text-white">
          {fmt(city.totalSignals)}
        </div>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
          style={{ width: `${heat}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {city.products.slice(0, 3).map((p) => (
          <span
            key={`${city.city}-${p.productName}`}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-black text-zinc-600 dark:bg-white/[0.06] dark:text-white/60"
          >
            {productEmoji(p.productName)} {p.productName}
          </span>
        ))}
      </div>
    </div>
  );
}

function OpportunityModal({
  item,
  onClose,
}: {
  item: Opportunity;
  maxSignals: number;
  onClose: () => void;
}) {
  const tone = opportunityTone(item.score);
  const gpsRate = percent(item.gpsSignals, item.signals);
  const mobileRate = percent(item.mobileSignals, item.signals);
  const desktopRate = percent(item.route.desktopSignals, item.signals);
  const ipRate = percent(item.route.ipSignals, item.signals);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[38px] border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1021]">
        <div className="relative overflow-hidden border-b border-zinc-200 p-6 dark:border-white/10">
          <div
            className={[
              "absolute -right-20 -top-20 h-60 w-60 rounded-full blur-[90px]",
              tone.glow,
            ].join(" ")}
          />

          <div className="relative flex items-start justify-between gap-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500 dark:text-white/40">
                Opportunity Engine
              </div>

              <h3 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
                {tone.icon} {item.productName} Fırsatı
              </h3>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
                {item.buyerCity}
                {item.buyerDistrict ? ` / ${item.buyerDistrict}` : ""} alıcı ilgisi,{" "}
                {item.listingCity}
                {item.listingDistrict ? ` / ${item.listingDistrict}` : ""} ilanlarına yönelmiş.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-black text-zinc-700 dark:bg-white/[0.06] dark:text-white"
            >
              ×
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MiniMetric label="Fırsat Skoru" value={`${item.score}/100`} />
            <MiniMetric label="Sinyal" value={fmt(item.signals)} />
            <MiniMetric label="Kişi" value={fmt(item.uniqueVisitors)} />
            <MiniMetric label="GPS" value={`%${gpsRate}`} />
            <MiniMetric label="Son Aktivite" value={timeAgo(item.lastAt)} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className={["rounded-[30px] border p-5", tone.border, tone.bg].join(" ")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={["text-xs font-black uppercase tracking-[0.22em]", tone.text].join(" ")}>
                    Fırsat Yorumu
                  </div>

                  <h4 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
                    {tone.label}
                  </h4>
                </div>

                <div className="text-5xl">{productEmoji(item.productName)}</div>
              </div>

              <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-700 dark:text-white/60">
                {routeInsight(item.route, item.score)}
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                <div
                  className={["h-full rounded-full bg-gradient-to-r", tone.bar].join(" ")}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>

            <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/40">
                Rota Veri Kalitesi
              </div>

              <div className="mt-4 space-y-4">
                {[
                  ["GPS", gpsRate, "from-emerald-500 to-cyan-400"],
                  ["Mobil", mobileRate, "from-orange-500 to-yellow-400"],
                  ["Desktop", desktopRate, "from-blue-500 to-cyan-400"],
                  ["IP", ipRate, "from-purple-500 to-fuchsia-400"],
                ].map(([label, val, bar]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex justify-between text-xs font-black text-zinc-500 dark:text-white/45">
                      <span>{label}</span>
                      <span>%{val}</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                      <div
                        className={["h-full rounded-full bg-gradient-to-r", bar as string].join(" ")}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-3xl">🧭</div>

              <div className="mt-3 text-lg font-black text-zinc-950 dark:text-white">
                İhtiyaç Nerede?
              </div>

              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                {item.buyerCity} tarafından {item.productName} ilgisi oluşmuş.
              </p>
            </div>

            <div className="rounded-[26px] border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-3xl">📦</div>

              <div className="mt-3 text-lg font-black text-zinc-950 dark:text-white">
                Ürün Kaynağı
              </div>

              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                {item.listingCity} ilanlarında {fmt(item.signals)} gerçek görüntüleme sinyali var.
              </p>
            </div>

            <div className="rounded-[26px] border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-3xl">🎯</div>

              <div className="mt-3 text-lg font-black text-zinc-950 dark:text-white">
                Güven Sinyali
              </div>

              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                GPS %{gpsRate}, mobil %{mobileRate}; sahadan gelen ilgi böyle okunur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({
  product,
  maxSignals,
  onClose,
}: {
  product: ProductHeat;
  maxSignals: number;
  onClose: () => void;
}) {
  const heat = score(product.totalSignals, maxSignals);
  const gpsRate = percent(product.gpsSignals, product.totalSignals);
  const mobileRate = percent(product.mobileSignals, product.totalSignals);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[38px] border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1021]">
        <div className="flex items-start justify-between border-b border-zinc-200 p-6 dark:border-white/10">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500 dark:text-white/40">
              Product Heat Map
            </div>

            <h3 className="mt-3 text-4xl font-black text-zinc-950 dark:text-white">
              {productEmoji(product.productName)} {product.productName}
            </h3>

            <p className="mt-2 max-w-3xl text-sm font-semibold text-zinc-500 dark:text-white/55">
              {productInsight(product)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-black text-zinc-700 dark:bg-white/[0.06] dark:text-white"
          >
            ×
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <MiniMetric label="Ürün Skoru" value={`${heat}/100`} />
            <MiniMetric label="Sinyal" value={fmt(product.totalSignals)} />
            <MiniMetric label="GPS" value={`%${gpsRate}`} />
            <MiniMetric label="Mobil" value={`%${mobileRate}`} />
          </div>

          <div className="mt-6 space-y-3">
            {product.routes.slice(0, 8).map((route, i) => (
              <div
                key={`${route.productName}-${route.buyerCity}-${route.listingCity}-${i}`}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.035]"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_120px] md:items-center">
                  <div>
                    <div className="text-xs font-black uppercase text-zinc-400 dark:text-white/35">
                      Alıcı
                    </div>
                    <div className="mt-1 font-black text-zinc-950 dark:text-white">
                      {cityIcon(route.buyerCity)} {route.buyerCity}
                    </div>
                  </div>

                  <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white md:flex dark:bg-white dark:text-zinc-950">
                    →
                  </div>

                  <div>
                    <div className="text-xs font-black uppercase text-zinc-400 dark:text-white/35">
                      İlan
                    </div>
                    <div className="mt-1 font-black text-zinc-950 dark:text-white">
                      {cityIcon(route.listingCity)} {route.listingCity}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-xs font-black uppercase text-zinc-400 dark:text-white/35">
                      Sinyal
                    </div>
                    <div className="mt-1 font-black text-zinc-950 dark:text-white">
                      {fmt(route.signals)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopCities({ cities, tradeRoutes }: Props) {
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductHeat | null>(
    null
  );

  const activeRoutes = useMemo(
    () => tradeRoutes.filter((r) => Number(r.signals || 0) > 0),
    [tradeRoutes]
  );

  const maxRouteSignals = Math.max(...activeRoutes.map((x) => x.signals), 1);

  const opportunities = useMemo<Opportunity[]>(() => {
    return activeRoutes
      .map((route) => ({
        productName: route.productName,
        buyerCity: route.buyerCity,
        buyerDistrict: route.buyerDistrict,
        listingCity: route.listingCity,
        listingDistrict: route.listingDistrict,
        signals: route.signals,
        gpsSignals: route.gpsSignals,
        mobileSignals: route.mobileSignals,
        uniqueVisitors: route.uniqueVisitors,
        score: routeScore(route, maxRouteSignals),
        lastAt: route.lastAt,
        route,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [activeRoutes, maxRouteSignals]);

  const productHeat = useMemo<ProductHeat[]>(() => {
    const map = new Map<string, ProductHeat>();

    for (const r of activeRoutes) {
      const key = normalize(r.productName);
      const prev =
        map.get(key) ??
        ({
          productName: r.productName,
          totalSignals: 0,
          routeCount: 0,
          buyerCities: 0,
          listingCities: 0,
          gpsSignals: 0,
          mobileSignals: 0,
          uniqueVisitors: 0,
          lastAt: r.lastAt,
          routes: [],
        } satisfies ProductHeat);

      prev.totalSignals += r.signals;
      prev.routeCount += 1;
      prev.gpsSignals += r.gpsSignals;
      prev.mobileSignals += r.mobileSignals;
      prev.uniqueVisitors += r.uniqueVisitors;
      prev.routes.push(r);

      if (
        r.lastAt &&
        (!prev.lastAt || new Date(r.lastAt).getTime() > new Date(prev.lastAt).getTime())
      ) {
        prev.lastAt = r.lastAt;
      }

      map.set(key, prev);
    }

    return Array.from(map.values())
      .map((p) => ({
        ...p,
        buyerCities: new Set(p.routes.map((r) => normalize(r.buyerCity))).size,
        listingCities: new Set(p.routes.map((r) => normalize(r.listingCity))).size,
        routes: p.routes.sort((a, b) => b.signals - a.signals),
      }))
      .sort((a, b) => b.totalSignals - a.totalSignals)
      .slice(0, 6);
  }, [activeRoutes]);

  const cityHeat = useMemo<CityHeat[]>(() => {
    const map = new Map<string, CityHeat>();

    for (const r of activeRoutes) {
      const key = normalize(r.buyerCity);
      const prev =
        map.get(key) ??
        ({
          city: r.buyerCity,
          totalSignals: 0,
          products: [],
        } satisfies CityHeat);

      prev.totalSignals += r.signals;

      const product = prev.products.find(
        (p) => normalize(p.productName) === normalize(r.productName)
      );

      if (product) product.signals += r.signals;
      else prev.products.push({ productName: r.productName, signals: r.signals });

      map.set(key, prev);
    }

    return Array.from(map.values())
      .map((c) => ({
        ...c,
        products: c.products.sort((a, b) => b.signals - a.signals),
      }))
      .sort((a, b) => b.totalSignals - a.totalSignals)
      .slice(0, 6);
  }, [activeRoutes]);

  const totalRouteSignals = useMemo(
    () => activeRoutes.reduce((sum, r) => sum + Number(r.signals || 0), 0),
    [activeRoutes]
  );

  const activeBuyerCities = useMemo(
    () => new Set(activeRoutes.map((r) => normalize(r.buyerCity)).filter(Boolean)).size,
    [activeRoutes]
  );

  const activeProducts = useMemo(
    () => new Set(activeRoutes.map((r) => normalize(r.productName)).filter(Boolean)).size,
    [activeRoutes]
  );

  const maxProductSignals = Math.max(...productHeat.map((x) => x.totalSignals), 1);
  const maxCitySignals = Math.max(...cityHeat.map((x) => x.totalSignals), 1);

  const leader = opportunities[0];

  return (
    <>
      <section className="overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
        <div className="border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                OPPORTUNITY ENGINE
              </div>

              <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
                Ticaret Akışları & Fırsat Motoru
              </h2>

              <p className="mt-1 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                Hangi şehir hangi ürüne ihtiyaç gösteriyor, hangi ilin ilanlarına yöneliyor ve hangi ürün ısınıyor; gerçek tıklama sinyallerinden hesaplanır.
              </p>
            </div>

            {leader ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <div className="text-xs font-black uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  Fırsat Tespit Edildi
                </div>

                <div className="mt-1 text-sm font-black text-zinc-950 dark:text-white">
                  {productEmoji(leader.productName)} {leader.buyerCity} → {leader.listingCity}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Rota Sinyali" value={fmt(totalRouteSignals)} />
            <MiniMetric label="Alıcı Şehir" value={fmt(activeBuyerCities)} />
            <MiniMetric label="Aktif Ürün" value={fmt(activeProducts)} />
          </div>
        </div>

        <div className="p-6">
          {activeRoutes.length ? (
            <div className="grid gap-6">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
                      Fırsat Motoru
                    </div>

                    <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                      Bugünün En Sıcak Ticaret Akışları
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                    Gerçek tıklama verisi
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {opportunities.map((item, index) => (
                    <OpportunityCard
                      key={`${item.productName}-${item.buyerCity}-${item.listingCity}-${index}`}
                      item={item}
                      maxSignals={maxRouteSignals}
                      index={index}
                      onClick={() => setSelectedOpportunity(item)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_.85fr]">
                <div className="min-w-0 rounded-[32px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.025]">
                  <div className="mb-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
                      Ürün Isı Haritası
                    </div>

                    <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                      En Çok Alıcı Çeken Ürünler
                    </div>
                  </div>

                  <ProductHeatTable
                    products={productHeat}
                    maxSignals={maxProductSignals}
                    onSelect={setSelectedProduct}
                  />
                </div>

                <div className="min-w-0 rounded-[32px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.025]">
                  <div className="mb-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-white/40">
                      İhtiyaç Haritası
                    </div>

                    <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">
                      Şehir Bazlı Ürün İlgisi
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cityHeat.map((c) => (
                      <CityHeatCard
                        key={c.city}
                        city={c}
                        maxSignals={maxCitySignals}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-10 text-center dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-5xl">📡</div>

              <div className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Henüz ticaret akışı oluşmadı
              </div>

              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                İlan şehirleri ve ziyaretçi şehirleri eşleşince gerçek ürün rotaları burada görünecek.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-6 py-4 dark:border-white/10">
          <div className="flex flex-col gap-2 text-xs font-bold text-zinc-500 dark:text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <span>Skor = rota sinyali + GPS güveni + mobil hareket + benzersiz kişi</span>
            <span>{opportunities.length} sıcak fırsat listeleniyor</span>
          </div>
        </div>
      </section>

      {selectedOpportunity ? (
        <OpportunityModal
          item={selectedOpportunity}
          maxSignals={maxRouteSignals}
          onClose={() => setSelectedOpportunity(null)}
        />
      ) : null}

      {selectedProduct ? (
        <ProductModal
          product={selectedProduct}
          maxSignals={maxProductSignals}
          onClose={() => setSelectedProduct(null)}
        />
      ) : null}
    </>
  );
}