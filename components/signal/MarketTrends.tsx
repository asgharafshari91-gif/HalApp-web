"use client";

import { useMemo, useState } from "react";

type ProductRow = {
  productName: string;
  signals: number;
};

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
  products: ProductRow[];
  cities: CityStat[];
  tradeRoutes?: TradeRoute[];
};

type ProductTrend = {
  productName: string;
  signals: number;
  routeCount: number;
  buyerCities: string[];
  listingCities: string[];
  gpsSignals: number;
  mobileSignals: number;
  uniqueVisitors: number;
  score: number;
  status: string;
  action: string;
  lastAt: string;
  routes: TradeRoute[];
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

function trendStatus(scoreValue: number) {
  if (scoreValue >= 85) return "Çok Sıcak";
  if (scoreValue >= 70) return "Yükseliyor";
  if (scoreValue >= 50) return "Takip Et";
  return "Düşük";
}

function trendAction(scoreValue: number) {
  if (scoreValue >= 85) return "Satıcı ara / stok bağla";
  if (scoreValue >= 70) return "Fiyat ve stok kontrol et";
  if (scoreValue >= 50) return "Takibe al";
  return "Veri birikmesini bekle";
}

function tone(scoreValue: number) {
  if (scoreValue >= 85) {
    return {
      border: "border-rose-500/25",
      bg: "bg-rose-500/10",
      text: "text-rose-700 dark:text-rose-300",
      bar: "from-rose-500 via-orange-400 to-yellow-300",
      icon: "🔥",
    };
  }

  if (scoreValue >= 70) {
    return {
      border: "border-orange-500/25",
      bg: "bg-orange-500/10",
      text: "text-orange-700 dark:text-orange-300",
      bar: "from-orange-500 via-yellow-400 to-emerald-400",
      icon: "⚡",
    };
  }

  if (scoreValue >= 50) {
    return {
      border: "border-emerald-500/25",
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      bar: "from-emerald-500 via-cyan-400 to-blue-400",
      icon: "📈",
    };
  }

  return {
    border: "border-zinc-300 dark:border-white/10",
    bg: "bg-zinc-100 dark:bg-white/[0.04]",
    text: "text-zinc-600 dark:text-white/55",
    bar: "from-zinc-400 to-zinc-300",
    icon: "👁️",
  };
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

function buildInsight(row: ProductTrend) {
  const topRoute = row.routes[0];
  const gpsRate = percent(row.gpsSignals, row.signals);
  const mobileRate = percent(row.mobileSignals, row.signals);

  if (!topRoute) {
    return `${row.productName} için ${fmt(row.signals)} sinyal var. Rota verisi oluşunca alıcı ve satıcı şehir analizi netleşir.`;
  }

  return `${row.productName} en çok ${topRoute.buyerCity} tarafından ${topRoute.listingCity} ilanlarında hareket görüyor. GPS güveni %${gpsRate}, mobil hareket %${mobileRate}. Aksiyon: ${row.action}.`;
}

function TrendCard({
  row,
  onClick,
}: {
  row: ProductTrend;
  onClick: () => void;
}) {
  const t = tone(row.score);
  const gpsRate = percent(row.gpsSignals, row.signals);
  const mobileRate = percent(row.mobileSignals, row.signals);
  const topRoute = row.routes[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative overflow-hidden rounded-[30px] border p-5 text-left transition hover:-translate-y-1 hover:shadow-2xl",
        t.border,
        t.bg,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/40 blur-3xl dark:bg-white/10" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/40 bg-white/70 text-4xl dark:border-white/10 dark:bg-white/[0.08]">
              {productEmoji(row.productName)}
            </div>

            <div className="min-w-0">
              <div className="truncate text-2xl font-black text-zinc-950 dark:text-white">
                {row.productName}
              </div>

              <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
                {row.routeCount} rota • {row.buyerCities.length} alıcı şehir
              </div>
            </div>
          </div>

          <span
            className={[
              "shrink-0 rounded-full bg-white/70 px-3 py-1 text-xs font-black dark:bg-white/[0.08]",
              t.text,
            ].join(" ")}
          >
            {t.icon} {row.status}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
              Trend Skoru
            </div>

            <div className="mt-1 text-5xl font-black tracking-tight text-zinc-950 dark:text-white">
              {row.score}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
              Sinyal
            </div>

            <div className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">
              {fmt(row.signals)}
            </div>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
          <div
            className={["h-full rounded-full bg-gradient-to-r", t.bar].join(" ")}
            style={{ width: `${row.score}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniMetric label="GPS" value={`%${gpsRate}`} />
          <MiniMetric label="Mobil" value={`%${mobileRate}`} />
          <MiniMetric label="Kişi" value={fmt(row.uniqueVisitors)} />
        </div>

        {topRoute ? (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.055]">
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

        <div className="mt-5 rounded-2xl border border-zinc-200 bg-white/70 p-3 text-xs font-bold leading-relaxed text-zinc-600 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/55">
          {buildInsight(row)}
        </div>
      </div>
    </button>
  );
}

function TrendTable({
  rows,
  onSelect,
}: {
  rows: ProductTrend[];
  onSelect: (row: ProductTrend) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/[0.035]">
      <div className="hidden grid-cols-[1.4fr_90px_1fr_110px_130px] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40 md:grid">
        <div>Ürün</div>
        <div>Skor</div>
        <div>Alıcı şehir</div>
        <div>Sinyal</div>
        <div>Aksiyon</div>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-white/10">
        {rows.map((row, index) => (
          <button
            key={`${row.productName}-${index}`}
            type="button"
            onClick={() => onSelect(row)}
            className="w-full px-4 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
          >
            <div className="grid gap-3 md:grid-cols-[1.4fr_90px_1fr_110px_130px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-white/[0.07]">
                  {productEmoji(row.productName)}
                </span>

                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                    {row.productName}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
                    {row.routeCount} rota • {row.listingCities.length} ilan şehri
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-zinc-950 dark:text-white">
                  {row.score}/100
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500"
                    style={{ width: `${row.score}%` }}
                  />
                </div>
              </div>

              <div className="text-sm font-black text-zinc-950 dark:text-white">
                {row.buyerCities.slice(0, 2).join(", ") || "—"}
              </div>

              <div className="text-sm font-black text-zinc-950 dark:text-white">
                {fmt(row.signals)}
              </div>

              <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                {row.action}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TrendModal({
  row,
  onClose,
}: {
  row: ProductTrend;
  onClose: () => void;
}) {
  const t = tone(row.score);
  const gpsRate = percent(row.gpsSignals, row.signals);
  const mobileRate = percent(row.mobileSignals, row.signals);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[38px] border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1021]">
        <div className="relative overflow-hidden border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-[90px]" />

          <div className="relative flex items-start justify-between gap-5">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500 dark:text-white/40">
                Product Trend Intelligence
              </div>

              <h3 className="mt-3 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
                {productEmoji(row.productName)} {row.productName}
              </h3>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/55">
                {buildInsight(row)}
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
            <MiniMetric label="Trend Skoru" value={`${row.score}/100`} />
            <MiniMetric label="Sinyal" value={fmt(row.signals)} />
            <MiniMetric label="GPS" value={`%${gpsRate}`} />
            <MiniMetric label="Mobil" value={`%${mobileRate}`} />
            <MiniMetric label="Kişi" value={fmt(row.uniqueVisitors)} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className={["rounded-[30px] border p-5", t.border, t.bg].join(" ")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={["text-xs font-black uppercase tracking-[0.22em]", t.text].join(" ")}>
                    AI Trend Yorumu
                  </div>

                  <h4 className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
                    {t.icon} {row.status}
                  </h4>
                </div>

                <div className="text-5xl">{productEmoji(row.productName)}</div>
              </div>

              <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-700 dark:text-white/60">
                {buildInsight(row)}
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                <div
                  className={["h-full rounded-full bg-gradient-to-r", t.bar].join(" ")}
                  style={{ width: `${row.score}%` }}
                />
              </div>
            </div>

            <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/40">
                Tüccar Aksiyonu
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 text-2xl font-black text-zinc-950 dark:bg-white/[0.05] dark:text-white">
                {row.action}
              </div>

              <div className="mt-4 text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                Bu öneri; görüntüleme sinyali, rota sayısı, alıcı şehir çeşitliliği, GPS güveni ve mobil hareketten üretilir.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <div className="mb-4 text-xl font-black text-zinc-950 dark:text-white">
              Ürün Rotaları
            </div>

            <div className="space-y-3">
              {row.routes.slice(0, 10).map((route, index) => (
                <div
                  key={`${route.productName}-${route.buyerCity}-${route.listingCity}-${index}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_100px] md:items-center">
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
    </div>
  );
}

export default function MarketTrends({
  products,
  cities,
  tradeRoutes = [],
}: Props) {
  const [selected, setSelected] = useState<ProductTrend | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  const activeRoutes = useMemo(
    () => tradeRoutes.filter((r) => Number(r.signals || 0) > 0),
    [tradeRoutes]
  );

  const maxProductSignals = Math.max(...products.map((p) => p.signals), 1);

  const rows = useMemo<ProductTrend[]>(() => {
    const map = new Map<string, ProductTrend>();

    for (const p of products) {
      const key = normalize(p.productName);

      map.set(key, {
        productName: p.productName,
        signals: Number(p.signals || 0),
        routeCount: 0,
        buyerCities: [],
        listingCities: [],
        gpsSignals: 0,
        mobileSignals: 0,
        uniqueVisitors: 0,
        score: score(p.signals, maxProductSignals),
        status: "",
        action: "",
        lastAt: "",
        routes: [],
      });
    }

    for (const r of activeRoutes) {
      const key = normalize(r.productName);
      const prev =
        map.get(key) ??
        ({
          productName: r.productName,
          signals: 0,
          routeCount: 0,
          buyerCities: [],
          listingCities: [],
          gpsSignals: 0,
          mobileSignals: 0,
          uniqueVisitors: 0,
          score: 0,
          status: "",
          action: "",
          lastAt: r.lastAt,
          routes: [],
        } satisfies ProductTrend);

      prev.signals += r.signals;
      prev.routeCount += 1;
      prev.gpsSignals += r.gpsSignals;
      prev.mobileSignals += r.mobileSignals;
      prev.uniqueVisitors += r.uniqueVisitors;
      prev.routes.push(r);

      if (!prev.buyerCities.includes(r.buyerCity)) prev.buyerCities.push(r.buyerCity);
      if (!prev.listingCities.includes(r.listingCity)) prev.listingCities.push(r.listingCity);

      if (
        r.lastAt &&
        (!prev.lastAt || new Date(r.lastAt).getTime() > new Date(prev.lastAt).getTime())
      ) {
        prev.lastAt = r.lastAt;
      }

      map.set(key, prev);
    }

    const maxSignals = Math.max(...Array.from(map.values()).map((x) => x.signals), 1);
    const maxRoutes = Math.max(...Array.from(map.values()).map((x) => x.routeCount), 1);

    return Array.from(map.values())
      .map((row) => {
        const signalPower = score(row.signals, maxSignals);
        const routePower = score(row.routeCount, maxRoutes);
        const gpsRate = percent(row.gpsSignals, row.signals);
        const mobileRate = percent(row.mobileSignals, row.signals);
        const cityPower = Math.min(100, row.buyerCities.length * 18);

        const finalScore = Math.min(
          100,
          Math.round(
            signalPower * 0.38 +
              routePower * 0.22 +
              gpsRate * 0.16 +
              mobileRate * 0.14 +
              cityPower * 0.1
          )
        );

        return {
          ...row,
          routes: row.routes.sort((a, b) => b.signals - a.signals),
          score: finalScore,
          status: trendStatus(finalScore),
          action: trendAction(finalScore),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [products, activeRoutes, maxProductSignals]);

  const leader = rows[0];

  return (
    <>
      <section className="overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
        <div className="border-b border-zinc-200 p-6 dark:border-white/10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                PRODUCT INTELLIGENCE
              </div>

              <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
                Ürün Trendleri
              </h2>

              <p className="mt-1 max-w-4xl text-sm font-semibold leading-relaxed text-zinc-500 dark:text-white/50">
                Ürünleri sadece popülerliğe göre değil; rota sayısı, alıcı şehir,
                GPS güveni, mobil hareket ve tüccar aksiyonuna göre analiz eder.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView("cards")}
                className={[
                  "rounded-full px-4 py-2 text-xs font-black",
                  view === "cards"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-white/50",
                ].join(" ")}
              >
                Kart
              </button>

              <button
                type="button"
                onClick={() => setView("table")}
                className={[
                  "rounded-full px-4 py-2 text-xs font-black",
                  view === "table"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-white/50",
                ].join(" ")}
              >
                Tablo
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Trend Ürün" value={fmt(rows.length)} />
            <MiniMetric label="Aktif Rota" value={fmt(activeRoutes.length)} />
            <MiniMetric label="Lider Ürün" value={leader?.productName || "—"} />
          </div>
        </div>

        <div className="p-6">
          {rows.length ? (
            view === "cards" ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {rows.slice(0, 4).map((row) => (
                  <TrendCard
                    key={row.productName}
                    row={row}
                    onClick={() => setSelected(row)}
                  />
                ))}
              </div>
            ) : (
              <TrendTable rows={rows} onSelect={setSelected} />
            )
          ) : (
            <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-10 text-center dark:border-white/10 dark:bg-white/[0.035]">
              <div className="text-5xl">📈</div>
              <div className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                Trend verisi bekleniyor
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
                Ürün sinyalleri ve ticaret rotaları geldikçe trend motoru çalışacak.
              </p>
            </div>
          )}
        </div>
      </section>

      {selected ? (
        <TrendModal row={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}