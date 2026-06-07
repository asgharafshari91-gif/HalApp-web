"use client";

import Link from "next/link";
import type { SignalRow } from "@/types/signal";

type Props = {
  signal: SignalRow | null;
  onClose: () => void;
};

function clean(value?: string | null) {
  const v = String(value ?? "").trim();
  return v || "—";
}

function normalize(value?: string | null) {
  return String(value ?? "").toLocaleLowerCase("tr-TR").trim();
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

function shortId(id?: string | null) {
  const v = String(id ?? "");
  if (!v) return "—";
  return `${v.slice(0, 8)}...${v.slice(-5)}`;
}

function signalHash(id?: string | null) {
  const v = String(id ?? "").replaceAll("-", "");
  if (!v) return "0x000000000000000000";
  return `0x${v.slice(0, 30)}`;
}

function timeTR(value?: string | null) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function timeAgoTR(value?: string | null) {
  if (!value) return "az önce";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "az önce";

  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);

  if (min < 1) return "şimdi";
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;

  return `${Math.floor(hour / 24)} gün önce`;
}

function sourceLabel(value?: string | null) {
  return normalize(value) === "gps" ? "GPS Doğrulamalı" : "IP Tabanlı";
}

function sourceShort(value?: string | null) {
  return normalize(value) === "gps" ? "GPS" : "IP";
}

function deviceLabel(signal: SignalRow) {
  const d = normalize(signal.deviceType);
  const p = normalize(signal.platform);

  if (d.includes("mobile_web")) return "Mobile Web";
  if (d.includes("desktop")) return "Desktop Web";
  if (d.includes("mobile")) return "Mobil";
  if (p.includes("android")) return "Android";
  if (p.includes("ios")) return "iOS";
  if (p.includes("web")) return "Web";

  return signal.deviceType || signal.platform || "Bilinmiyor";
}

function typeLabel(signal: SignalRow) {
  return signal.postType === "request" ? "Talep Sinyali" : "İlan Görüntüleme";
}

function signalScore(signal: SignalRow) {
  const gpsBonus = normalize(signal.locationSource) === "gps" ? 10 : 2;
  const cityBonus = signal.city ? 8 : 0;
  const districtBonus = signal.district ? 7 : 0;
  const productBonus = signal.productName || signal.listingTitle ? 8 : 0;
  const deviceBonus = signal.deviceType || signal.platform ? 5 : 0;
  const idBonus = String(signal.id ?? "").length % 8;

  return Math.min(
    99,
    62 + gpsBonus + cityBonus + districtBonus + productBonus + deviceBonus + idBonus
  );
}

function dataQuality(signal: SignalRow) {
  const checks = [
    Boolean(signal.id),
    Boolean(signal.city),
    Boolean(signal.district),
    Boolean(signal.country),
    Boolean(signal.productName || signal.listingTitle),
    Boolean(signal.locationSource),
    Boolean(signal.deviceType || signal.platform),
    Boolean(signal.createdAt),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function confidenceText(score: number) {
  if (score >= 90) return "Çok güçlü";
  if (score >= 80) return "Güçlü";
  if (score >= 70) return "Orta";
  return "Düşük";
}

function mapQuery(signal: SignalRow) {
  const parts = [signal.district, signal.city, signal.country].filter(Boolean);
  return encodeURIComponent(parts.join(", "));
}

function InfoTile({
  icon,
  label,
  value,
  tone = "zinc",
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "emerald" | "cyan" | "orange" | "purple" | "rose" | "zinc";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-400/25 bg-emerald-400/12"
      : tone === "cyan"
      ? "border-cyan-400/25 bg-cyan-400/12"
      : tone === "orange"
      ? "border-orange-400/25 bg-orange-400/12"
      : tone === "purple"
      ? "border-purple-400/25 bg-purple-400/12"
      : tone === "rose"
      ? "border-rose-400/25 bg-rose-400/12"
      : "border-white/10 bg-white/[0.055]";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[24px] border p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.08]",
        toneClass,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.10] text-2xl shadow-lg">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
            {label}
          </div>

          <div className="mt-1 truncate text-base font-black text-white">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = "emerald",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "cyan" | "orange" | "purple" | "zinc";
}) {
  const cls =
    tone === "cyan"
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
      : tone === "orange"
      ? "border-orange-300/20 bg-orange-300/10 text-orange-100"
      : tone === "purple"
      ? "border-purple-300/20 bg-purple-300/10 text-purple-100"
      : tone === "zinc"
      ? "border-white/10 bg-white/[0.07] text-white/80"
      : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black",
        cls,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function SignalOrbit({ product }: { product: string }) {
  return (
    <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-[34px] border border-white/10 bg-black/20">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="absolute h-56 w-56 rounded-full border border-emerald-300/15" />
      <div className="absolute h-40 w-40 rounded-full border border-cyan-300/15" />
      <div className="absolute h-24 w-24 rounded-full border border-white/10" />

      <div className="absolute h-56 w-56 animate-[spinOrbit_7s_linear_infinite] rounded-full">
        <span className="absolute left-1/2 top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-400 text-sm shadow-[0_0_22px_rgba(52,211,153,.85)]">
          📡
        </span>
      </div>

      <div className="absolute h-40 w-40 animate-[spinOrbitReverse_9s_linear_infinite] rounded-full">
        <span className="absolute bottom-0 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-cyan-400 text-sm shadow-[0_0_22px_rgba(34,211,238,.85)]">
          🎯
        </span>
      </div>

      <div className="absolute h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative text-center">
        <div className="text-7xl drop-shadow-[0_0_34px_rgba(52,211,153,.65)]">
          {productEmoji(product)}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-white backdrop-blur">
          {product}
        </div>
      </div>
    </div>
  );
}

function ScorePanel({ score, quality }: { score: number; quality: number }) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.055] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
            Güven Skoru
          </div>

          <div className="mt-2 text-5xl font-black tracking-tight text-emerald-200">
            {score}/100
          </div>

          <div className="mt-2 text-sm font-bold text-white/75">
            {confidenceText(score)} sinyal kalitesi
          </div>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-3xl">
          🛡️
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs font-black text-white/55">
          <span>Sinyal güveni</span>
          <span>{score}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 shadow-[0_0_24px_rgba(103,232,249,.55)]"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs font-black text-white/55">
          <span>Veri bütünlüğü</span>
          <span>{quality}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-300 via-fuchsia-300 to-rose-300 shadow-[0_0_24px_rgba(217,70,239,.35)]"
            style={{ width: `${quality}%` }}
          />
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold leading-relaxed text-white/70">
        Skor; konum kaynağı, şehir/ilçe bilgisi, ürün eşleşmesi,
        cihaz/platform bilgisi ve kayıt bütünlüğüne göre hesaplanan arayüz
        güven göstergesidir.
      </p>
    </div>
  );
}

function TimelineStep({
  step,
  title,
  text,
  icon,
}: {
  step: string;
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <div className="relative rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-black text-zinc-950 shadow-[0_0_22px_rgba(52,211,153,.35)]">
          {step}
        </div>

        <div className="text-2xl">{icon}</div>
      </div>

      <div className="mt-4 text-sm font-black text-white">{title}</div>

      <div className="mt-1 text-xs font-semibold leading-relaxed text-white/60">
        {text}
      </div>
    </div>
  );
}

export default function SignalModal({ signal, onClose }: Props) {
  if (!signal) return null;

  const product = signal.productName || signal.listingTitle || "İlan";
  const score = signalScore(signal);
  const quality = dataQuality(signal);
  const isGps = normalize(signal.locationSource) === "gps";

  const locationTitle = `${clean(signal.city)}${
    signal.district ? ` / ${signal.district}` : ""
  }`;

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery(
    signal
  )}`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/78 p-4 backdrop-blur-xl">
      <div className="relative max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-[42px] border border-white/10 bg-[#050b14] text-white shadow-[0_40px_160px_rgba(0,0,0,.75)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-500/18 blur-[150px]" />
          <div className="absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-cyan-500/14 blur-[150px]" />
          <div className="absolute bottom-[-260px] left-1/3 h-[520px] w-[520px] rounded-full bg-purple-500/12 blur-[150px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>

        <div className="relative max-h-[94vh] overflow-y-auto">
          <div className="sticky top-0 z-30 border-b border-white/10 bg-[#050b14]/88 px-6 py-5 backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Signal Details</Badge>
                  <Badge tone={isGps ? "cyan" : "orange"}>
                    {sourceLabel(signal.locationSource)}
                  </Badge>
                  <Badge tone="purple">{typeLabel(signal)}</Badge>
                  <Badge tone="zinc">{timeAgoTR(signal.createdAt)}</Badge>
                </div>

                <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {locationTitle}
                </h2>

                <div className="mt-3 font-mono text-sm font-bold text-emerald-200">
                  {signalHash(signal.id)}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl font-black text-white transition hover:bg-white/[0.12]"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
              <div className="rounded-[36px] border border-white/10 bg-white/[0.045] p-5">
                <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                  <SignalOrbit product={product} />

                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
                        Ürün / İlan Hareketi
                      </div>

                      <h3 className="mt-3 text-4xl font-black tracking-tight text-white">
                        {product}
                      </h3>

                      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/70">
                        Bu sinyal, HalApp pazar ağında bir kullanıcı hareketinin
                        canlı olarak yakalandığını gösterir. Konum, cihaz,
                        platform ve ürün eşleşmesi üzerinden analiz edilir.
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                        <div className="text-xs font-black uppercase text-emerald-200">
                          Kaynak
                        </div>
                        <div className="mt-1 text-xl font-black text-white">
                          {sourceShort(signal.locationSource)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                        <div className="text-xs font-black uppercase text-cyan-200">
                          Cihaz
                        </div>
                        <div className="mt-1 text-xl font-black text-white">
                          {deviceLabel(signal)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-purple-300/20 bg-purple-300/10 p-4">
                        <div className="text-xs font-black uppercase text-purple-200">
                          İlçe
                        </div>
                        <div className="mt-1 text-xl font-black text-white">
                          {clean(signal.district)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ScorePanel score={score} quality={quality} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoTile icon="🧾" label="Signal ID" value={shortId(signal.id)} />
              <InfoTile
                icon="🏙️"
                label="Şehir"
                value={clean(signal.city)}
                tone="emerald"
              />
              <InfoTile
                icon="📍"
                label="İlçe"
                value={clean(signal.district)}
                tone="cyan"
              />
              <InfoTile
                icon="🌍"
                label="Ülke"
                value={clean(signal.country)}
                tone="purple"
              />
              <InfoTile
                icon="🎯"
                label="Konum Kaynağı"
                value={sourceLabel(signal.locationSource)}
                tone="emerald"
              />
              <InfoTile
                icon="💻"
                label="Cihaz"
                value={deviceLabel(signal)}
                tone="cyan"
              />
              <InfoTile
                icon="🧭"
                label="Platform"
                value={clean(signal.platform)}
                tone="orange"
              />
              <InfoTile
                icon="⏱️"
                label="Zaman"
                value={timeTR(signal.createdAt)}
                tone="rose"
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
              <div className="rounded-[34px] border border-white/10 bg-white/[0.045] p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-white/45">
                      Signal Path
                    </div>

                    <h3 className="mt-2 text-2xl font-black text-white">
                      Sinyal Yolculuğu
                    </h3>
                  </div>

                  <Badge>Verified</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <TimelineStep
                    step="1"
                    icon="🏙️"
                    title={clean(signal.city)}
                    text="Şehir bilgisi yakalandı."
                  />
                  <TimelineStep
                    step="2"
                    icon="📍"
                    title={clean(signal.district)}
                    text="İlçe bilgisi eşleşti."
                  />
                  <TimelineStep
                    step="3"
                    icon={productEmoji(product)}
                    title={product}
                    text="Ürün veya ilan bilgisi eşleşti."
                  />
                  <TimelineStep
                    step="4"
                    icon={isGps ? "🎯" : "🌍"}
                    title={sourceShort(signal.locationSource)}
                    text="Konum kaynağı sınıflandırıldı."
                  />
                </div>
              </div>

              <div className="rounded-[34px] border border-emerald-300/20 bg-emerald-300/10 p-5">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                  Market Insight
                </div>

                <h3 className="mt-2 text-2xl font-black text-white">
                  Pazar Yorumu
                </h3>

                <p className="mt-4 text-sm font-semibold leading-relaxed text-white/75">
                  {locationTitle} bölgesinden gelen bu hareket, {product} için
                  kullanıcı ilgisi olduğunu gösterir.{" "}
                  {isGps
                    ? "GPS doğrulamalı olduğu için konum güveni yüksektir."
                    : "IP tabanlı olduğu için bölge bilgisi yaklaşık kabul edilmelidir."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="text-xs font-black uppercase text-white/45">
                      Güven
                    </div>
                    <div className="mt-1 text-2xl font-black text-white">
                      {score}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <div className="text-xs font-black uppercase text-white/45">
                      Kalite
                    </div>
                    <div className="mt-1 text-2xl font-black text-white">
                      {quality}%
                    </div>
                  </div>
                </div>

                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-sm font-black text-white transition hover:bg-white/[0.13]"
                >
                  Haritada Aç →
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {signal.listingId ? (
                <Link
                  href={`/pazar/${signal.listingId}`}
                  className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-black text-zinc-950 shadow-[0_0_30px_rgba(52,211,153,.35)] transition hover:-translate-y-0.5 hover:bg-emerald-300"
                >
                  İlanı Aç →
                </Link>
              ) : null}

              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-6 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15"
              >
                Konumu Haritada Aç
              </a>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.12]"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spinOrbit {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes spinOrbitReverse {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}