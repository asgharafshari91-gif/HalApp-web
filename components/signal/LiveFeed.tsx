"use client";

import type { SignalRow } from "@/types/signal";

type Props = {
  signals: SignalRow[];
  onSelect: (signal: SignalRow) => void;
};

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

function sourceLabel(value?: string | null) {
  return String(value ?? "").toLowerCase() === "gps" ? "GPS" : "IP";
}

function sourceClass(value?: string | null) {
  return String(value ?? "").toLowerCase() === "gps"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/55";
}

function deviceLabel(signal: SignalRow) {
  const d = String(signal.deviceType ?? "").toLowerCase();
  const p = String(signal.platform ?? "").toLowerCase();

  if (d.includes("mobile_web")) return "Mobile Web";
  if (d.includes("desktop")) return "Desktop";
  if (d.includes("mobile")) return "Mobile App";
  if (p.includes("android")) return "Android";
  if (p.includes("ios")) return "iOS";
  if (p.includes("web")) return "Web";

  return signal.deviceType || signal.platform || "Bilinmiyor";
}

function viewCount(index: number) {
  return Math.max(6, 23 - index + ((index * 3) % 7));
}

function pinColor(index: number) {
  const colors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-cyan-600",
    "text-emerald-600",
    "text-purple-500",
  ];

  return colors[index % colors.length];
}

export default function LiveFeed({ signals, onSelect }: Props) {
  const rows = signals.slice(0, 6);

  return (
    <section className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1021]">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
        <div>
          <h2 className="text-xl font-black text-zinc-950 dark:text-white">
            Canlı Sinyal Akışı
          </h2>

          <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
            Son görüntüleme ve talep hareketleri
          </p>
        </div>

        <button className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.07]">
          Tümünü Gör
        </button>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-white/5">
        {rows.length ? (
          rows.map((signal, index) => {
            const product = signal.productName || signal.listingTitle || "İlan";
            const city = signal.city || "Türkiye";
            const district = signal.district || "";
            const isGps = sourceLabel(signal.locationSource) === "GPS";

            return (
              <button
                key={`${signal.id}-${index}`}
                onClick={() => onSelect(signal)}
                className="group grid w-full grid-cols-[74px_1fr_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.035]"
              >
                <div>
                  <div className="text-sm font-black text-zinc-950 dark:text-white">
                    {timeOnly(signal.createdAt)}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/40">
                    {timeAgoTR(signal.createdAt)}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="relative mt-1 flex h-7 w-7 shrink-0 items-center justify-center">
                      <span
                        className={[
                          "text-lg leading-none",
                          pinColor(index),
                        ].join(" ")}
                      >
                        {isGps ? "📍" : "▲"}
                      </span>

                      {isGps ? (
                        <span className="absolute inset-0 animate-ping rounded-full border border-emerald-400/30" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-black text-zinc-950 dark:text-white">
                          {city}
                          {district ? ` / ${district}` : ""}
                        </span>

                        <span className="shrink-0 text-lg">
                          {productEmoji(product)}
                        </span>
                      </div>

                      <div className="mt-1 truncate text-sm font-semibold text-zinc-700 dark:text-white/70">
                        {product}{" "}
                        {signal.postType === "request"
                          ? "talebi açıldı"
                          : "ilanı görüntülendi"}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "rounded-full border px-2.5 py-1 text-[11px] font-black",
                            sourceClass(signal.locationSource),
                          ].join(" ")}
                        >
                          {sourceLabel(signal.locationSource)}
                        </span>

                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-black text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                          {deviceLabel(signal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-black text-zinc-500 dark:text-white/45">
                  <span>👁</span>
                  <span>{viewCount(index)}</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-10 text-center">
            <div className="text-5xl">📡</div>

            <div className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
              Canlı sinyal bekleniyor
            </div>

            <div className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/45">
              Yeni görüntüleme ve talep hareketleri burada listelenecek.
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 px-5 py-3 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Canlı akış devam ediyor...
        </div>
      </div>
    </section>
  );
}