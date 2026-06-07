"use client";

import type { SignalRow } from "@/types/signal";

type FilterType = "all" | "gps" | "ip";

type Props = {
  signals: SignalRow[];
  query: string;
  setQuery: (v: string) => void;
  filter: FilterType;
  setFilter: (v: FilterType) => void;
  onSelect: (signal: SignalRow) => void;
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString("tr-TR");
}

function timeOnly(value?: string | null) {
  if (!value) return "--:--";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgoTR(value?: string | null) {
  if (!value) return "şimdi";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "şimdi";

  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);

  if (min < 1) return "şimdi";
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} sa önce`;

  return `${Math.floor(hour / 24)} gün önce`;
}

function productEmoji(name?: string | null) {
  const s = String(name ?? "").toLocaleLowerCase("tr-TR");

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

function shortId(id?: string | null) {
  const v = String(id ?? "");
  if (!v) return "—";
  return `${v.slice(0, 8)}...${v.slice(-4)}`;
}

function sourceLabel(value?: string | null) {
  return String(value ?? "").toLowerCase() === "gps" ? "GPS" : "IP";
}

function sourceClass(value?: string | null) {
  return String(value ?? "").toLowerCase() === "gps"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300";
}

function deviceLabel(signal: SignalRow) {
  const d = String(signal.deviceType ?? "").toLowerCase();
  const p = String(signal.platform ?? "").toLowerCase();

  if (d.includes("mobile_web")) return "Mobile Web";
  if (d.includes("desktop")) return "Desktop Web";
  if (d.includes("mobile")) return "Mobil";
  if (p.includes("android")) return "Android";
  if (p.includes("ios")) return "iOS";
  if (p.includes("web")) return "Web";

  return signal.deviceType || signal.platform || "Bilinmiyor";
}

function signalType(signal: SignalRow) {
  return signal.postType === "request" ? "Talep" : "Görüntüleme";
}

function signalScore(signal: SignalRow, index: number) {
  const gpsBonus = signal.locationSource === "gps" ? 8 : 0;
  const cityBonus = signal.city ? 4 : 0;
  const productBonus = signal.productName || signal.listingTitle ? 5 : 0;
  return Math.min(99, Math.max(62, 74 + gpsBonus + cityBonus + productBonus - index));
}

function scoreTone(score: number) {
  if (score >= 90) return "from-emerald-500 to-cyan-400";
  if (score >= 80) return "from-blue-500 to-cyan-400";
  if (score >= 70) return "from-orange-500 to-yellow-400";
  return "from-zinc-500 to-zinc-400";
}

export default function SignalTable({
  signals,
  query,
  setQuery,
  filter,
  setFilter,
  onSelect,
}: Props) {
  const total = signals.length;
  const gpsCount = signals.filter((s) => String(s.locationSource ?? "").toLowerCase() === "gps").length;
  const ipCount = total - gpsCount;

  return (
    <section className="overflow-hidden rounded-[34px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
      <div className="border-b border-zinc-200 p-5 dark:border-white/10 sm:p-6">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500 dark:text-white/45">
              SIGNAL LEDGER
            </div>

            <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
              Canlı Sinyal Kayıtları
            </h2>

            <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-white/50">
              Görüntüleme, talep, GPS/IP ve cihaz bilgileri tek tabloda.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 2xl:w-[520px]">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="text-[10px] font-black uppercase text-zinc-400 dark:text-white/35">Toplam</div>
              <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">{fmt(total)}</div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <div className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">GPS</div>
              <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">{fmt(gpsCount)}</div>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
              <div className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-300">IP</div>
              <div className="mt-1 text-xl font-black text-zinc-950 dark:text-white">{fmt(ipCount)}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                🔎
              </span>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Şehir, ürün, cihaz veya ilan ara..."
                className="h-13 min-h-13 w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-11 pr-4 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/40 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35 dark:focus:bg-white/[0.06]"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="h-13 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-black text-zinc-950 outline-none transition focus:border-emerald-500/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              <option value="all">Tüm Sinyaller</option>
              <option value="gps">GPS Doğrulamalı</option>
              <option value="ip">IP Tabanlı</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "📡", "Tümü"],
              ["gps", "🎯", "GPS"],
              ["ip", "🌍", "IP"],
            ].map(([key, icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as FilterType)}
                className={[
                  "rounded-full border px-4 py-2 text-xs font-black transition",
                  filter === key
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55 dark:hover:bg-white/[0.07]",
                ].join(" ")}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04]">
            <tr>
              <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                Ürün / İlan
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                Konum
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                Kaynak
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                Cihaz
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                Tür
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                Skor
              </th>
              <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
                Zaman
              </th>
            </tr>
          </thead>

          <tbody>
            {signals.length ? (
              signals.map((row, index) => {
                const product = row.productName || row.listingTitle || "İlan";
                const score = signalScore(row, index);

                return (
                  <tr
                    key={`${row.id}-${index}`}
                    onClick={() => onSelect(row)}
                    className="group cursor-pointer border-b border-zinc-100 transition hover:bg-zinc-50 dark:border-white/5 dark:hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-2xl transition group-hover:scale-105 dark:bg-white/[0.06]">
                          {productEmoji(product)}
                        </div>

                        <div className="min-w-0">
                          <div className="max-w-[260px] truncate text-sm font-black text-zinc-950 dark:text-white">
                            {product}
                          </div>

                          <div className="mt-1 font-mono text-xs font-semibold text-zinc-500 dark:text-white/40">
                            #{shortId(row.id)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-black text-zinc-950 dark:text-white">
                        {row.city || "Türkiye"}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">
                        {row.district || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-black",
                          sourceClass(row.locationSource),
                        ].join(" ")}
                      >
                        {sourceLabel(row.locationSource)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-black text-zinc-900 dark:text-white">
                        {deviceLabel(row)}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">
                        {row.platform || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                        {signalType(row)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex min-w-[130px] items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                          <div
                            className={["h-full rounded-full bg-gradient-to-r", scoreTone(score)].join(" ")}
                            style={{ width: `${score}%` }}
                          />
                        </div>

                        <div className="w-8 text-right text-sm font-black text-zinc-950 dark:text-white">
                          {score}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-black text-zinc-950 dark:text-white">
                        {timeOnly(row.createdAt)}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">
                        {timeAgoTR(row.createdAt)}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="text-5xl">📡</div>
                  <div className="mt-3 text-lg font-black text-zinc-950 dark:text-white">
                    Sinyal bulunamadı
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-500 dark:text-white/45">
                    Arama veya filtreyi değiştir.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 xl:hidden">
        {signals.length ? (
          signals.map((row, index) => {
            const product = row.productName || row.listingTitle || "İlan";
            const score = signalScore(row, index);

            return (
              <button
                key={`${row.id}-mobile-${index}`}
                type="button"
                onClick={() => onSelect(row)}
                className="w-full rounded-[26px] border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
              >
                <div className="flex gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl dark:bg-white/[0.06]">
                    {productEmoji(product)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-zinc-950 dark:text-white">
                      {product}
                    </div>

                    <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
                      {row.city || "Türkiye"} {row.district ? `/ ${row.district}` : ""}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[11px] font-black",
                          sourceClass(row.locationSource),
                        ].join(" ")}
                      >
                        {sourceLabel(row.locationSource)}
                      </span>

                      <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-black text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                        {deviceLabel(row)}
                      </span>

                      <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-black text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                        {timeAgoTR(row.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                        <div
                          className={["h-full rounded-full bg-gradient-to-r", scoreTone(score)].join(" ")}
                          style={{ width: `${score}%` }}
                        />
                      </div>

                      <div className="text-sm font-black text-zinc-950 dark:text-white">
                        {score}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-10 text-center">
            <div className="text-5xl">📡</div>
            <div className="mt-3 text-lg font-black text-zinc-950 dark:text-white">
              Sinyal bulunamadı
            </div>
          </div>
        )}
      </div>
    </section>
  );
}