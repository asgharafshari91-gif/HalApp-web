"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type SellerMini = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
};

type Listing = {
  id: string;
  title: string | null;
  product_name: string | null;
  city: string | null;
  district: string | null;
  market_name: string | null;
  price: number | null;
  price_per_unit: number | null;
  unit: string | null;
  created_at: string | null;
  is_boosted: boolean | null;
  seller: SellerMini | null;

  cover_url: string | null;
  cover_thumb: string | null;
};

type ListingMediaRow = {
  listing_id: string | null;
  url: string | null;
  thumb_url: string | null;
  media_type: string | null;
  sort_order: number | null;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function fmtMoney(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("tr-TR").format(n);
}

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} dk önce`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs} saat önce`;
  const days = Math.floor(diff / 86400000);
  return `${Math.max(1, days)} gün önce`;
}

function safeUrl(u: any) {
  const s = String(u ?? "").trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  return s;
}

function isProbablyImage(url?: string | null) {
  const u = (url ?? "").toLowerCase();
  return u.includes(".jpg") || u.includes(".jpeg") || u.includes(".png") || u.includes(".webp") || u.includes(".gif");
}

export default function LivePreviewMarquee({
  limit = 16,
  speedMs = 24,
  withRealtime = true,
}: {
  limit?: number;
  speedMs?: number;
  withRealtime?: boolean;
}) {
  const [items, setItems] = useState<Listing[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        id,
        title,
        product_name,
        city,
        district,
        market_name,
        price,
        price_per_unit,
        unit,
        created_at,
        is_boosted,
        seller:profiles!listings_seller_id_fkey (
          id,
          full_name,
          company_name,
          avatar_url,
          is_premium
        )
      `
      )
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return;

    const rows = (Array.isArray(data) ? data : []) as any[];
    const base: Listing[] = rows.map((r) => ({
      id: String(r.id ?? ""),
      title: r.title ?? null,
      product_name: r.product_name ?? null,
      city: r.city ?? null,
      district: r.district ?? null,
      market_name: r.market_name ?? null,
      price: r.price ?? null,
      price_per_unit: r.price_per_unit ?? null,
      unit: r.unit ?? null,
      created_at: r.created_at ?? null,
      is_boosted: Boolean(r.is_boosted),
      seller: r.seller
        ? {
            id: String(r.seller.id ?? ""),
            full_name: r.seller.full_name ?? null,
            company_name: r.seller.company_name ?? null,
            avatar_url: r.seller.avatar_url ?? null,
            is_premium: Boolean(r.seller.is_premium),
          }
        : null,
      cover_url: null,
      cover_thumb: null,
    }));

    const ids = base.map((x) => x.id).filter(Boolean);
    if (ids.length === 0) {
      setItems(base);
      return;
    }

    const { data: media, error: mediaErr } = await supabase
      .from("listing_media")
      .select("listing_id,url,thumb_url,media_type,sort_order")
      .in("listing_id", ids)
      .order("sort_order", { ascending: true });

    if (mediaErr) {
      setItems(base);
      return;
    }

    const mediaRows = (Array.isArray(media) ? media : []) as ListingMediaRow[];

    const coverMap = new Map<string, { thumb: string | null; url: string | null }>();

    for (const m of mediaRows) {
      const lid = String(m.listing_id ?? "").trim();
      if (!lid) continue;

      const thumb = safeUrl(m.thumb_url);
      const url = safeUrl(m.url);

      const candidate = (thumb || url) ?? null;
      const isImg = isProbablyImage(candidate);

      if (!coverMap.has(lid)) {
        if (candidate) coverMap.set(lid, { thumb, url });
        continue;
      }

      const existing = coverMap.get(lid)!;
      const existingCandidate = (existing.thumb || existing.url) ?? null;
      const existingIsImg = isProbablyImage(existingCandidate);

      if (!existingIsImg && isImg) coverMap.set(lid, { thumb, url });
    }

    const merged = base.map((x) => {
      const c = coverMap.get(x.id);
      return { ...x, cover_thumb: c?.thumb ?? null, cover_url: c?.url ?? null };
    });

    setItems(merged);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await load();
      if (!alive) return;
    })();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (withRealtime) {
      channel = supabase
        .channel("marquee_listings")
        .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => load())
        .on("postgres_changes", { event: "*", schema: "public", table: "listing_media" }, () => load())
        .subscribe();
    }

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, withRealtime]);

  // Sonsuz akış
  const track = useMemo(() => [...items, ...items], [items]);

  // ✅ smooth scroll
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let raf = 0;
    let last = 0;

    const step = (ts: number) => {
      if (!last) last = ts;
      const dt = ts - last;
      last = ts;

      if (dt >= speedMs) {
        el.scrollLeft += 1;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft = 0;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speedMs, items.length]);

  if (!items.length) return null;

  return (
    // ✅ CRITICAL: outer wrapper body taşmasını engeller
    <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="rounded-[26px] border border-black/10 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 text-sm font-black text-black/90 dark:text-white/90">🔥 Canlı Akış</div>
          <div className="shrink-0 text-xs font-semibold text-black/60 dark:text-white/60">Realtime • yeni ilanlar otomatik akar</div>
        </div>

        {/* ✅ CRITICAL: scroll container mutlaka w-full + max-w-full + min-w-0 */}
        <div
          ref={wrapRef}
          className={cn(
            "w-full max-w-full min-w-0",
            "relative overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-2xl",
            "[-webkit-overflow-scrolling:touch]"
          )}
          style={{
            scrollbarWidth: "none" as any,
            WebkitOverflowScrolling: "touch" as any,
          }}
        >
          {/* ✅ içerik genişler, ama sadece bu container içinde */}
          <div className="inline-flex gap-3 pr-4">
            {track.map((x, idx) => {
              const price = x.price ?? x.price_per_unit;
              const unit = x.unit ? `/${x.unit}` : "";
              const loc = [x.city, x.district].filter(Boolean).join(" / ");
              const sellerName = x.seller?.company_name || x.seller?.full_name || "Satıcı";
              const cover = x.cover_thumb || x.cover_url;

              return (
                <Link
                  key={`${x.id}-${idx}`}
                  href={`/pazar/${encodeURIComponent(x.id)}`}
                  className={cn(
                    // ✅ min-w: akış için OK; body taşmaz çünkü yukarıda container sabit
                    "group inline-flex w-[320px] max-w-[360px] shrink-0 flex-col overflow-hidden",
                    "rounded-2xl border border-black/10 bg-white/70",
                    "hover:bg-white transition",
                    "dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                  )}
                >
                  <div className="relative h-28 w-full bg-black/5 dark:bg-white/5">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="cover" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-black/35 dark:text-white/35">
                        Foto yok
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      {x.is_boosted ? (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/12 px-2.5 py-1 text-[10px] font-black text-amber-900 backdrop-blur dark:text-amber-200">
                          GOLD
                        </span>
                      ) : null}
                      {x.seller?.is_premium ? (
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-black text-emerald-900 backdrop-blur dark:text-emerald-200">
                          PREMIUM
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-extrabold text-emerald-700 dark:text-emerald-200">
                        {x.product_name || x.title || "İlan"}
                      </div>

                      <div className="shrink-0 text-[11px] font-semibold text-black/50 dark:text-white/50">
                        {timeAgo(x.created_at)}
                      </div>
                    </div>

                    <div className="mt-1 truncate text-xs text-black/55 dark:text-white/55">
                      {loc || "—"} • {sellerName}
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div className="text-base font-black text-black/90 dark:text-white/90">
                        {price == null ? "—" : `${fmtMoney(price)} ₺${unit}`}
                      </div>

                      <div className="text-xs font-extrabold text-black/60 group-hover:text-black/80 dark:text-white/60 dark:group-hover:text-white/80">
                        Detaya git →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* scrollbar gizle (webkit) */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>

        <div className="mt-3 text-[11px] text-black/45 dark:text-white/45">
          Not: Kapak foto <b>listing_media</b> tablosundan (thumb_url → url) alınır.
        </div>
      </div>
    </div>
  );
}