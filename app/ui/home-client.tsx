"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useMe } from "@/lib/me";

type MarketItem = {
  id: string;
  title: string;
  location: string;
  price: string;
  type: string;
  emoji: string;
  coverUrl?: string;
};

function productEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("avokado")) return "🥑";
  if (t.includes("limon")) return "🍋";
  if (t.includes("blue") || t.includes("yaban")) return "🫐";
  if (t.includes("ananas")) return "🍍";
  if (t.includes("domates")) return "🍅";
  if (t.includes("salatalık")) return "🥒";
  if (t.includes("portakal")) return "🍊";
  return "🛒";
}

function formatPrice(row: any) {
  const unit = row?.unit ? ` / ${row.unit}` : "";
  if (row?.price) return `${Number(row.price).toLocaleString("tr-TR")}₺${unit}`;

  if (row?.min_price || row?.max_price) {
    const min = row?.min_price ? Number(row.min_price).toLocaleString("tr-TR") : "-";
    const max = row?.max_price ? Number(row.max_price).toLocaleString("tr-TR") : "-";
    return `${min}₺ - ${max}₺`;
  }

  return "Fiyat yok";
}

function coverOf(row: any) {
  const media = Array.isArray(row?.listing_media) ? row.listing_media : [];
  if (!media.length) return "";

  const sorted = [...media].sort(
    (a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0)
  );

  return sorted[0]?.thumb_url || sorted[0]?.url || "";
}

function StatCard({
  value,
  label,
  text,
}: {
  value: string;
  label: string;
  text: string;
}) {
  return (
    <div className="min-h-[132px] rounded-[26px] border border-black/10 bg-white/70 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.055)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
      <div className="text-[28px] font-black leading-none tracking-tight text-zinc-950 dark:text-white">
        {value}
      </div>
      <div className="mt-3 text-[13px] font-black text-emerald-700 dark:text-emerald-300">
        {label}
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-600 dark:text-white/60">
        {text}
      </p>
    </div>
  );
}

function StepCard({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-black/10 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_90px_rgba(34,197,94,0.16)] dark:border-white/10 dark:bg-white/[0.045]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-500/12 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-black shadow-[0_18px_50px_rgba(34,197,94,.24)]">
          {n}
        </div>
        <h3 className="mt-5 text-lg font-black text-zinc-950 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/62">
          {text}
        </p>
      </div>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[30px] border border-black/10 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-2xl ring-1 ring-emerald-500/20">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-black text-zinc-950 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/60">
        {text}
      </p>
    </div>
  );
}

function AudienceCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <div className="rounded-[30px] border border-black/10 bg-white/75 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl transition hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.045]">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 text-lg font-black text-zinc-950 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/60">
        {text}
      </p>
    </div>
  );
}

function PriceCard({
  name,
  badge,
  price,
  desc,
  features,
  highlighted = false,
  button,
}: {
  name: string;
  badge?: string;
  price: string;
  desc: string;
  features: string[];
  highlighted?: boolean;
  button: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-[34px] border p-6 transition-all duration-300",
        highlighted
          ? "border-emerald-500/35 bg-gradient-to-br from-emerald-500/18 via-white/85 to-white/75 shadow-[0_30px_110px_rgba(34,197,94,0.20)] dark:from-emerald-500/18 dark:via-white/[0.06] dark:to-white/[0.03]"
          : "border-black/10 bg-white/75 shadow-[0_20px_80px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.045]",
      ].join(" ")}
    >
      {highlighted && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-400/25 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
        </div>
      )}

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-zinc-950 dark:text-white">
            {name}
          </h3>
          {badge && (
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-zinc-600 dark:text-white/60">
          {desc}
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
            {price}
          </span>
          {price !== "0₺" && (
            <span className="pb-1 text-sm font-bold text-zinc-500 dark:text-white/45">
              / ay
            </span>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {features.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm font-semibold text-zinc-700 dark:text-white/70">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
                ✓
              </span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <a
          href="/auth?next=/premium"
          className={[
            "mt-7 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition-all duration-300",
            highlighted
              ? "bg-emerald-500 text-black shadow-[0_20px_60px_rgba(34,197,94,.26)] hover:scale-[1.02] hover:bg-emerald-400"
              : "border border-black/10 bg-black/[0.035] text-zinc-900 hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]",
          ].join(" ")}
        >
          {button}
        </a>
      </div>
    </div>
  );
}
function MarketFlowCard({
  item,
  index,
}: {
  item: MarketItem;
  index: number;
}) {
  return (
    <Link
      href={`/pazar/${item.id}`}
      className="group flex items-center gap-4 rounded-[26px] border border-black/10 bg-white/75 p-4 shadow-[0_14px_45px_rgba(0,0,0,.07)] backdrop-blur-xl transition hover:scale-[1.015] hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:hover:bg-white/[0.11]"
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] bg-emerald-500/10 text-2xl ring-1 ring-emerald-500/15">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          item.emoji
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-200">
            {item.type}
          </span>
          {index < 2 && (
            <span className="rounded-full bg-orange-400/12 px-2.5 py-1 text-[10px] font-black text-orange-700 dark:text-orange-200">
              Yeni
            </span>
          )}
        </div>
        <div className="mt-1 truncate text-base font-black text-zinc-950 dark:text-white">
          {item.title}
        </div>
        <div className="truncate text-xs font-semibold text-zinc-500 dark:text-white/45">
          {item.location || "Konum belirtilmedi"}
        </div>
      </div>

      <div className="text-right">
        <div className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
          {item.price}
        </div>
        <div className="mt-2 text-[11px] font-black text-zinc-400 transition group-hover:text-emerald-600 dark:text-white/40 dark:group-hover:text-emerald-200">
          Detay →
        </div>
      </div>
    </Link>
  );
}

function AccountCTA() {
  const me = useMe();

  const displayName = useMemo(() => {
    const p: any = me.profile ?? null;
    return (p?.company_name || p?.full_name || "HalApp Kullanıcısı").toString();
  }, [me.profile]);

  const avatarUrl = useMemo(() => {
    const p: any = me.profile ?? null;
    return (p?.avatar_url ?? "") as string;
  }, [me.profile]);

  if (me.loading) {
    return (
      <div className="inline-flex h-14 items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-7 text-sm font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/50">
        Yükleniyor...
      </div>
    );
  }

  if (!me.authed) {
    return (
      <a
        href="/auth"
        className="inline-flex h-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-7 text-sm font-black text-emerald-800 transition hover:bg-emerald-500/15 dark:text-emerald-200"
      >
        Giriş Yap
      </a>
    );
  }

  return (
    <a
      href="/profile"
      className="inline-flex h-14 items-center gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 pr-6 text-sm font-black text-zinc-900 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
    >
      <span className="relative h-9 w-9 overflow-hidden rounded-2xl bg-emerald-500/12 ring-1 ring-emerald-500/20">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-black text-emerald-700 dark:text-emerald-200">
            HA
          </span>
        )}
      </span>
      <span className="max-w-[150px] truncate">{displayName}</span>
    </a>
  );
}

function HeroMarketPreview({ items }: { items: MarketItem[] }) {
  const list = items.length ? [...items, ...items] : [];

  return (
    <div className="relative hidden lg:block">
      <div className="absolute -inset-6 rounded-[44px] bg-emerald-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[38px] border border-black/10 bg-white/75 p-5 shadow-[0_30px_120px_rgba(0,0,0,.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-zinc-950 dark:text-white">Canlı Pazar</div>
            <div className="mt-1 text-xs font-semibold text-zinc-500 dark:text-white/45">
              Gerçek ilan akışı
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            LIVE
          </div>
        </div>

        <div className="relative mt-5 h-[420px] overflow-hidden">
          <div className="absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white to-transparent dark:from-[#101916]" />
          <div className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-white to-transparent dark:from-[#101916]" />

          {list.length ? (
            <div className="animate-[heroMarketFlow_18s_linear_infinite] space-y-3">
              {list.map((item, i) => (
                <MarketFlowCard key={`${item.id}-hero-${i}`} item={item} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[28px] border border-black/10 bg-white/60 text-sm font-black text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
              Canlı ilanlar yükleniyor...
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Anlık", "Akış"],
            ["Pazar", "Canlı"],
            ["Detay", "Tek tık"],
          ].map(([a, b]) => (
            <div
              key={a}
              className="rounded-2xl border border-black/10 bg-white/60 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">{a}</div>
              <div className="text-[11px] font-bold text-zinc-500 dark:text-white/45">{b}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes heroMarketFlow {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function HomeClient() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadMarketItems() {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          post_type,
          title,
          product_name,
          city,
          district,
          price,
          min_price,
          max_price,
          unit,
          created_at,
          listing_media(
            id,
            media_type,
            url,
            thumb_url,
            sort_order
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!alive) return;

      if (error) {
        console.log("home live market error:", error.message);
        setMarketItems([]);
        return;
      }

      setMarketItems(
        (data ?? []).map((row: any) => {
          const title = row.product_name || row.title || "İlan";
          return {
            id: row.id,
            title,
            location: [row.city, row.district].filter(Boolean).join(" / "),
            price: row.post_type === "request" ? "Talep" : formatPrice(row),
            type: row.post_type === "request" ? "Talep" : "Ürün",
            emoji: productEmoji(title),
            coverUrl: coverOf(row),
          };
        })
      );
    }

    loadMarketItems();

    const ch = supabase
      .channel("home-live-market")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, loadMarketItems)
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <main className="relative w-full max-w-full overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-52 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-[130px]" />
        <div className="absolute right-[-180px] top-[240px] h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
        <div className="absolute bottom-[180px] left-[-160px] h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-[130px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
        <section className="relative overflow-hidden rounded-[34px] border border-black/10 bg-white/74 p-5 shadow-[0_28px_120px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:rounded-[42px] sm:p-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/16 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm dark:text-emerald-200">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(34,197,94,.9)]" />
                Türkiye’nin Hal’i — HalApp Web
              </div>

              <h1 className="mt-6 max-w-5xl text-[34px] font-extrabold leading-[1.04] tracking-[-0.035em] text-zinc-950 dark:text-white sm:text-5xl lg:text-[64px]">
                HalApp ile{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-300 dark:to-teal-200">
                  canlı ilanları
                </span>{" "}
                takip et, üretici & alıcıyı{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-300 dark:to-teal-200">
                  anında
                </span>{" "}
                buluştur.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-650 dark:text-white/68 sm:text-xl">
                Türkiye’nin dijital hal sistemi. Canlı ürün ilanları, anlık pazar
                hareketleri ve premium satıcı ağı tek platformda.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="/pazar" className="inline-flex h-14 items-center justify-center rounded-2xl bg-emerald-500 px-7 text-sm font-black text-black shadow-[0_24px_70px_rgba(34,197,94,.28)] transition hover:scale-[1.02] hover:bg-emerald-400">
                  Pazarı Aç →
                </a>
                <AccountCTA />
                <a href="#pricing" className="inline-flex h-14 items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-7 text-sm font-black text-zinc-950 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-white">
                  Premium Paketler
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <StatCard value="81" label="İl Takibi" text="Türkiye genelinde hal ve pazar akışı." />
                <StatCard value="Canlı" label="Pazar Akışı" text="Yeni ilanlar ve piyasa hareketleri." />
                <StatCard value="Premium" label="Satıcı Ağı" text="Öne çıkan, güven veren profiller." />
                <StatCard value="Hızlı" label="Erişim" text="Alıcı ve satıcıya saniyeler içinde ulaş." />
              </div>
            </div>

            <div className="lg:col-span-5">
              <HeroMarketPreview items={marketItems} />
            </div>
          </div>
        </section>

        <section id="trust" className="mt-14">
          <div className="grid gap-5 md:grid-cols-3">
            <TrustCard icon="✅" title="Onaylı Satıcı" text="Profil ve satıcı bilgileriyle daha güven veren ticaret deneyimi." />
            <TrustCard icon="🛡️" title="Güvenli Ticaret" text="Alıcı ve satıcıyı tek platformda daha kontrollü şekilde buluşturur." />
            <TrustCard icon="📌" title="Gerçek İlan" text="Aktif ilan akışıyla ürün, talep ve pazar hareketlerini takip et." />
          </div>
        </section>

        <section id="features" className="mt-16">
          <div className="mb-7">
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
              KİMLER İÇİN?
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              HalApp, ticaretin her tarafını aynı pazarda buluşturur.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <AudienceCard icon="🌱" title="Üretici" text="Ürününü daha fazla alıcıya göster, pazar hareketini takip et." />
            <AudienceCard icon="🏪" title="Hal & Komisyoncu" text="Güncel ilan akışıyla alıcı ve satıcı bağlantısını hızlandır." />
            <AudienceCard icon="🚚" title="Tüccar" text="Şehir, ürün ve fiyat bilgileriyle doğru fırsatı daha hızlı bul." />
            <AudienceCard icon="🌍" title="İhracatçı" text="Kaliteli ürün, doğru satıcı ve güncel piyasa bilgisine ulaş." />
          </div>
        </section>

        <section id="pricing" className="mt-16">
          <div className="relative overflow-hidden rounded-[42px] border border-black/10 bg-white/75 p-6 shadow-[0_24px_100px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045] sm:p-10">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
                  NEDEN PREMIUM?
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                  Daha fazla görünürlük, daha hızlı bağlantı.
                </h2>
                <p className="mt-2 max-w-2xl text-zinc-600 dark:text-white/60">
                  Premium paketler ilanlarını daha öne çıkarır, satıcı profilini güçlendirir ve pazarda daha fazla alıcıya ulaşmanı sağlar.
                </p>
              </div>
              <a href="/auth?next=/premium" className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-black text-black shadow-[0_22px_70px_rgba(34,197,94,.25)] transition hover:scale-[1.02] hover:bg-emerald-400">
                Premium’a Geç
              </a>
            </div>

            <div className="relative mt-8 grid gap-5 lg:grid-cols-3">
              <PriceCard
                name="Ücretsiz"
                price="0₺"
                desc="Pazarı takip etmek ve canlı ilanları görüntülemek isteyen kullanıcılar için."
                features={["Canlı ilanları gör", "Temel arama ve filtre", "Pazar akışına erişim"]}
                button="Ücretsiz Başla"
              />
              <PriceCard
                name="Premium"
                badge="En Popüler"
                price="₺499"
                desc="İlanlarını daha fazla kişiye göstermek ve satıcı profilini güçlendirmek için."
                features={["Vitrin görünürlüğü", "Boost önceliği", "Premium satıcı rozeti", "Daha fazla alıcı erişimi"]}
                highlighted
                button="Premium’a Geç"
              />
              <PriceCard
                name="Kurumsal"
                badge="Firma Paketi"
                price="₺1.499"
                desc="Daha fazla ilan, daha güçlü görünürlük ve kurumsal satıcı algısı isteyen firmalar için."
                features={["Daha fazla ilan hakkı", "Yüksek boost önceliği", "Kurumsal satıcı görünümü", "Vitrin avantajı"]}
                button="Kurumsal Pakete Geç"
              />
            </div>
          </div>
        </section>

        <footer className="mt-16 rounded-[34px] border border-black/10 bg-white/75 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] sm:p-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="text-xl font-black text-zinc-950 dark:text-white">HalApp</div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-white/60">
                Türkiye’nin dijital hal ve canlı pazar platformu.
              </p>
            </div>

            <div>
              <div className="font-black text-zinc-950 dark:text-white">Platform</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-white/60">
                <a href="/pazar" className="block hover:text-emerald-600">Pazar</a>
                <a href="#pricing" className="block hover:text-emerald-600">Premium</a>
                <a href="/favorites" className="block hover:text-emerald-600">Favoriler</a>
              </div>
            </div>

            <div>
              <div className="font-black text-zinc-950 dark:text-white">Yasal</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-white/60">
                <a href="/privacy" className="block hover:text-emerald-600">KVKK & Gizlilik</a>
                <a href="/terms" className="block hover:text-emerald-600">Kullanım Koşulları</a>
              </div>
            </div>

            <div>
              <div className="font-black text-zinc-950 dark:text-white">Destek</div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-white/60">
                <a href="/support" className="block hover:text-emerald-600">Destek Merkezi</a>
                <a href="mailto:destek@halapp.com" className="block hover:text-emerald-600">destek@halapp.com</a>
                <span className="block">Instagram • LinkedIn</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-5 text-xs font-semibold text-zinc-500 dark:border-white/10 dark:text-white/45">
            ©️ 2026 HalApp • Tüm hakları saklıdır.
          </div>
        </footer>
      </div>
    </main>
  );
}