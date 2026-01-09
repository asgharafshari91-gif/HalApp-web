"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProfileMini = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  is_premium?: boolean | null;
};

type ListingRow = {
  id: string;
  user_id?: string | null;

  product_name?: string | null;
  title?: string | null;

  city?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  market_name?: string | null;

  price?: number | null;
  price_per_unit?: number | null;
  unit?: string | null;

  created_at?: string | null;

  profiles?: ProfileMini | null;

  [key: string]: any;
};

type MediaRow = {
  listing_id: string;
  url?: string | null;
  thumb_url?: string | null;
  sort_order?: number | null;
  media_type?: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmtMoney(v?: number | null) {
  if (v == null || Number.isNaN(v)) return "—";
  try {
    return new Intl.NumberFormat("tr-TR").format(v);
  } catch {
    return String(v);
  }
}

function relTimeTR(iso?: string | null) {
  if (!iso) return "az önce";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "az önce";
  const diff = Date.now() - t;

  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return `${sec} sn`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa`;

  const day = Math.floor(hr / 24);
  return `${day} g`;
}

function bestTitle(x: ListingRow) {
  const p = String(x.product_name ?? "").trim();
  const t = String(x.title ?? "").trim();
  return p || t || "İlan";
}

function bestLoc(x: ListingRow) {
  const c = String(x.city ?? "").trim();
  const d = String(x.district ?? "").trim();
  const n = String(x.neighborhood ?? "").trim();
  const m = String(x.market_name ?? "").trim();

  const loc1 = c && d ? `${c} / ${d}` : c || d;
  const loc2 = n ? ` • ${n}` : "";
  const loc3 = m ? ` • ${m}` : "";
  return (loc1 || "Konum yok") + loc2 + loc3;
}

function bestPrice(x: ListingRow) {
  const unit = String(x.unit ?? "kg").trim() || "kg";
  const price = (x.price_per_unit ?? x.price) as number | null | undefined;
  if (price == null) return "Fiyat yok";
  return `${fmtMoney(price)} ₺ / ${unit}`;
}

function sellerName(p?: ProfileMini | null) {
  if (!p) return "Kullanıcı";
  const c = String(p.company_name ?? "").trim();
  const f = String(p.full_name ?? "").trim();
  return c || f || "Kullanıcı";
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

export default function LivePreview() {
  const LISTINGS = "listings";
  const MEDIA = "listing_media";

  const LIMIT = 10;

  const [items, setItems] = useState<ListingRow[]>([]);
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [flash, setFlash] = useState<string | null>(null);
  const [marqueeKey, setMarqueeKey] = useState(0);

  const mountedRef = useRef(true);

  async function loadMediaFor(listingIds: string[]) {
    if (!listingIds.length) {
      setMediaMap({});
      return;
    }

    const { data, error } = await supabase
      .from(MEDIA)
      .select("listing_id, url, thumb_url, sort_order, media_type")
      .in("listing_id", listingIds)
      .order("sort_order", { ascending: true });

    if (!mountedRef.current) return;
    if (error) return;

    const map: Record<string, string> = {};
    for (const row of (data as MediaRow[]) ?? []) {
      const lid = row.listing_id;
      if (!lid) continue;
      if (map[lid]) continue;
      const u = (row.thumb_url || row.url || "").trim();
      if (u.startsWith("http")) map[lid] = u;
    }

    setMediaMap(map);
  }

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from(LISTINGS)
      .select("*, profiles:profiles(id, full_name, company_name, avatar_url, is_premium)")
      .order("created_at", { ascending: false })
      .limit(LIMIT);

    if (!mountedRef.current) return;

    const rows = ((data as any) ?? []) as ListingRow[];
    if (!error) {
      setItems(rows);
      await loadMediaFor(rows.map((x) => x.id).filter(Boolean));
    }

    setLoading(false);
  }

  useEffect(() => {
    mountedRef.current = true;
    load();

    const ch = supabase
      .channel("home-live-preview")
      .on("postgres_changes", { event: "*", schema: "public", table: LISTINGS }, (payload) => {
        const row: any = payload.new ?? null;
        if (!row?.id) return;

        setItems((prev) => {
          const prevItem = prev.find((x) => x.id === row.id);
          const merged: ListingRow = {
            ...(prevItem ?? {}),
            ...(row ?? {}),
            profiles: (prevItem?.profiles ?? null) as any,
          };

          const next = [merged, ...prev.filter((x) => x.id !== row.id)].slice(0, LIMIT);
          return next;
        });

        loadMediaFor([row.id]);

        setFlash(row.id);
        setMarqueeKey((k) => k + 1);
        window.setTimeout(() => {
          setFlash((cur) => (cur === row.id ? null : cur));
        }, 900);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: MEDIA }, (payload) => {
        const row: any = payload.new ?? payload.old ?? null;
        const lid = row?.listing_id;
        if (!lid) return;
        loadMediaFor([lid]);
      })
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topList = useMemo(() => items.slice(0, 6), [items]);
  const marqueeItems = useMemo(() => {
    const base = topList.length ? topList : [];
    return [...base, ...base];
  }, [topList]);

  const CARD_H = 96;
  const VIEW_COUNT = 3;
  const VIEW_H = CARD_H * VIEW_COUNT;
  const DURATION = 14;

  const skeleton = (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[96px] rounded-2xl border border-black/10 bg-white/70 p-4 animate-pulse dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-3 w-44 rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full min-w-0">
      <div className="relative w-full min-w-0 overflow-hidden rounded-3xl border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-zinc-950/40">
        <style>{`
          @keyframes halappMarquee {
            0%   { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
        `}</style>

        <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-emerald-500/12 blur-3xl" />

        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 text-sm font-black text-zinc-900 dark:text-white truncate">
            Canlı İlan Önizleme
          </div>

          <div className="shrink-0 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>
        </div>

        <div className="mt-2 text-xs text-zinc-600 dark:text-white/55">
          Realtime akış • yeni ilanlar otomatik üste gelir
        </div>

        {/* ✅ MOBİL FRAME (fotoğraftaki gibi içe gömülü, ortalı, taşma yok) */}
        <div className="mt-4 w-full min-w-0">
          <div
            className={clsx(
              "relative mx-auto w-full min-w-0 max-w-[420px]",
              "overflow-hidden rounded-[30px] border border-black/10",
              "bg-black/10 dark:border-white/10 dark:bg-white/[0.05]",
              "shadow-[0_18px_65px_rgba(0,0,0,0.35)]"
            )}
          >
            {/* premium glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_40%_0%,rgba(16,185,129,0.12),transparent_60%)] opacity-70" />

            {/* content area */}
            <div className="relative p-3">
              {loading ? (
                skeleton
              ) : topList.length === 0 ? (
                <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
                  Henüz ilan yok.
                </div>
              ) : (
                <div
                  className={clsx(
                    "relative w-full min-w-0 max-w-full overflow-hidden",
                    "rounded-2xl border border-black/10 bg-white/40",
                    "dark:border-white/10 dark:bg-white/[0.03]"
                  )}
                  style={{ height: VIEW_H }}
                >
                  {/* top/bottom fade */}
                  <div className="pointer-events-none absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/90 to-transparent dark:from-black/80 z-10" />
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white/90 to-transparent dark:from-black/80 z-10" />

                  <div
                    key={marqueeKey}
                    className="will-change-transform w-full min-w-0 max-w-full overflow-x-hidden"
                    style={{ animation: `halappMarquee ${DURATION}s linear infinite` }}
                  >
                    {marqueeItems.map((x, idx) => {
                      const p = (x.profiles ?? null) as ProfileMini | null;
                      const name = sellerName(p);
                      const photo = mediaMap[x.id] ?? null;

                      return (
                        <Link
                          href={`/pazar/${x.id}`}
                          key={`${x.id}-${idx}`}
                          className={clsx(
                            "group flex w-full min-w-0 items-center gap-3",
                            "border-b border-black/10 px-3 py-3 transition",
                            "hover:bg-white/70 dark:border-white/10 dark:hover:bg-white/[0.06]",
                            flash === x.id && "bg-emerald-500/10"
                          )}
                          style={{ height: CARD_H }}
                        >
                          {/* photo */}
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/30">
                            {photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photo}
                                alt={bestTitle(x)}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-[11px] font-black text-black/45 dark:text-white/45">
                                Foto
                              </div>
                            )}
                          </div>

                          {/* content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-extrabold text-emerald-700 dark:text-emerald-200">
                                  {bestTitle(x)}
                                </div>

                                <div className="mt-0.5 truncate text-[11px] text-zinc-600 dark:text-white/60">
                                  {bestLoc(x)}
                                </div>
                              </div>

                              <span className="shrink-0 rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[10px] font-black text-black/55 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                                {relTimeTR(x.created_at)}
                              </span>
                            </div>

                            <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
                              <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                                {bestPrice(x)}
                              </div>

                              <div className="flex min-w-0 items-center gap-2 text-[11px] text-black/55 dark:text-white/55">
                                <div className="inline-flex min-w-0 items-center gap-1.5">
                                  <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/30">
                                    {p?.avatar_url ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={p.avatar_url}
                                        alt={name}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="grid h-full w-full place-items-center text-[9px] font-black">
                                        {initials(name)}
                                      </div>
                                    )}
                                  </div>

                                  <span className="max-w-[140px] truncate font-bold">{name}</span>

                                  {p?.is_premium ? (
                                    <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 dark:text-emerald-200">
                                      Premium
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 text-xs text-zinc-600 dark:text-white/55 truncate">
            * Önizleme: son ilanlar + realtime akış
          </div>

          <Link
            href="/pazar"
            className="shrink-0 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-extrabold text-zinc-900 hover:bg-black/[0.06] transition dark:border-white/10 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10"
          >
            Tüm ilanlar →
          </Link>
        </div>
      </div>
    </div>
  );
}