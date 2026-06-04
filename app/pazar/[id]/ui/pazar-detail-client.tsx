"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SellerChip from "@/app/pazar/ui/seller-chip";
import { Lightbox, SquareMedia } from "@/app/my-listings/ui/listing-card";

type MediaType = "image" | "video";

type SellerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium?: boolean | null;
};

type ListingRow = {
  id: string;
  seller_id: string | null;

  title: string | null;
  description: string | null;

  product_name: string | null;
  product_type: string | null;

  city: string | null;
  district: string | null;
  neighborhood: string | null;

  market_name: string | null;

  unit: string | null;
  price_per_unit: number | null;
  price: number | null;
  min_price: number | null;
  max_price: number | null;

  min_quantity: number | null;
  quantity: number | null;

  is_active: boolean | null;
  is_boosted: boolean | null;
  boost_score: number | null;
  boost_until: string | null;

  expires_at: string | null;
  created_at: string | null;

  media_urls: string[] | null;
  media_types: Array<"image" | "video"> | null;

  deleted_at: string | null;
};

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function productEmoji(name: any) {
  const s = String(name ?? "").toLowerCase().trim();
  if (!s) return "🧺";

  // 🍉 Fruits
  if (s.includes("portakal") || s.includes("mandarin")) return "🍊";
  if (s.includes("limon") || s.includes("lime")) return "🍋";
  if (s.includes("muz")) return "🍌";
  if (s.includes("elma")) return "🍎";
  if (s.includes("armut")) return "🍐";
  if (s.includes("üzüm")) return "🍇";
  if (s.includes("çilek")) return "🍓";
  if (s.includes("nar")) return "🍎"; // (nar emojisi her cihazda stabil değil)
  if (s.includes("kivi")) return "🥝";
  if (s.includes("ananas")) return "🍍";
  if (s.includes("mango")) return "🥭";
  if (s.includes("avokado")) return "🥑";
  if (s.includes("hindistan cevizi")) return "🥥";
  if (s.includes("kavun")) return "🍈";
  if (s.includes("greyfurt")) return "🍊";
  if (s.includes("zencefil")) return "🫚";
  if (
    s.includes("blue berry") ||
    s.includes("blueberry") ||
    s.includes("ahududu") ||
    s.includes("böğürtlen") ||
    s.includes("frenk üzümü")
  )
    return "🫐";
  if (s.includes("altınçilek")) return "🍓";
  if (s.includes("ayva")) return "🍐";
  if (s.includes("amme") || s.includes("cennet")) return "🍈";

  // 🥕 Vegetables
  if (s.includes("domates")) return "🍅";
  if (s.includes("biber")) return "🌶️";
  if (s.includes("patlıcan")) return "🍆";
  if (s.includes("havuç")) return "🥕";
  if (s.includes("hıyar") || s.includes("salatalık")) return "🥒";
  if (s.includes("patates")) return "🥔";
  if (s.includes("soğan")) return "🧅";
  if (s.includes("sarımsak")) return "🧄";
  if (s.includes("mantar")) return "🍄";
  if (s.includes("brokoli") || s.includes("karnabahar")) return "🥦";
  if (s.includes("lahana") || s.includes("marul") || s.includes("ıspanak") || s.includes("pazı")) return "🥬";
  if (s.includes("kabak")) return "🎃";
  if (s.includes("kereviz") || s.includes("pırasa")) return "🥬";
  if (s.includes("turp")) return "🥕";
  if (s.includes("pancar")) return "🥕";

  // 🌿 Herbs & greens
  if (
    s.includes("nane") ||
    s.includes("maydonoz") ||
    s.includes("roka") ||
    s.includes("dereotu") ||
    s.includes("fesleğen") ||
    s.includes("tere")
  )
    return "🌿";

  return "🧺";
}

function fmtNum(v: any) {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR");
}

function fmtDate(d: any) {
  const s = String(d ?? "").trim();
  if (!s) return "—";
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  return dt.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

function fmtDateTime(d: any) {
  const s = String(d ?? "").trim();
  if (!s) return "—";
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  return dt.toLocaleString("tr-TR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function daysLeft(expiresAt: any) {
  const s = String(expiresAt ?? "").trim();
  if (!s) return null;
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;
  const now = new Date();
  const diff = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function isVideoType(t: any): t is "video" {
  return String(t) === "video";
}

function getMedia(listing: any): { urls: string[]; types: MediaType[] } {
  const urls: string[] = Array.isArray(listing?.media_urls) ? listing.media_urls : [];
  const typesRaw: any[] = Array.isArray(listing?.media_types) ? listing.media_types : [];
  const types: MediaType[] = typesRaw.map((t) => (isVideoType(t) ? "video" : "image"));
  const len = Math.min(urls.length, types.length);
  return { urls: urls.slice(0, len), types: types.slice(0, len) };
}

function fmtPrice(x: any) {
  const unit = x?.unit ? String(x.unit) : null;

  const ppu = x?.price_per_unit;
  const price = x?.price;
  const minP = x?.min_price;
  const maxP = x?.max_price;

  const hasPPU = ppu != null && Number.isFinite(Number(ppu));
  const hasPrice = price != null && Number.isFinite(Number(price));
  const hasMin = minP != null && Number.isFinite(Number(minP));
  const hasMax = maxP != null && Number.isFinite(Number(maxP));

  if (hasPPU) return { main: fmtNum(ppu), sub: unit ? `/ ${unit}` : "" };
  if (hasPrice) return { main: fmtNum(price), sub: "Toplam" };
  if (hasMin && hasMax) return { main: `${fmtNum(minP)} - ${fmtNum(maxP)}`, sub: "Aralık" };
  if (hasMin) return { main: fmtNum(minP), sub: "Min" };
  if (hasMax) return { main: fmtNum(maxP), sub: "Max" };
  return { main: "—", sub: "" };
}

/** listing_media tablosundan medya çek (varsa) */
async function fetchListingMediaFor(listingId: string) {
  const { data, error } = await supabase
    .from("listing_media")
    .select("url,type,sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });

  if (error || !data) return { urls: [] as string[], types: [] as MediaType[] };

  const urls: string[] = [];
  const types: MediaType[] = [];
  for (const r of data as any[]) {
    urls.push(String(r.url));
    types.push(String(r.type) === "video" ? "video" : "image");
  }
  return { urls, types };
}

async function fetchSellerProfile(sellerId: string) {
  try {
    const { data, error } = await supabase.rpc("get_public_profiles", { ids: [sellerId] });
    if (error) return null;
    const p = (data ?? [])?.[0];
    if (!p) return null;
    return {
      id: String(p.id),
      full_name: p.full_name ?? null,
      avatar_url: p.avatar_url ?? null,
      is_premium: p.is_premium ?? null,
    } as SellerProfile;
  } catch {
    return null;
  }
}

async function fetchViews(listingId: string) {
  try {
    const { data, error } = await supabase.rpc("get_listing_views", { ids: [listingId] });
    if (error) return null;
    const row = (data ?? [])?.[0];
    const v = Number(row?.views ?? row?.view_count ?? 0);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return null;
  }
}

async function bumpView(listingId: string) {
  try {
    await supabase.rpc("increment_listing_view", { listing_id: listingId });
  } catch {
    // sessiz
  }
}
function trackListingViewPixel(listingId: string) {
  try {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

    const isMobileWeb =
      /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) return;

    const params = new URLSearchParams({
      listing_id: listingId,
      source: "detail",
      platform: "web",
      device_type: isMobileWeb ? "mobile_web" : "desktop_web",
      t: String(Date.now()),
    });

    const img = new Image();
    img.src = `${baseUrl}/functions/v1/track-listing-view?${params.toString()}`;
  } catch {}
}
async function fetchMyFavoriteIds(userId: string) {
  const { data, error } = await supabase.from("listing_favorites").select("listing_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => String(r.listing_id)));
}

export default function PazarDetailClient({ id }: { id: string }) {
  const router = useRouter();

  // data
  const [row, setRow] = useState<ListingRow | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [views, setViews] = useState<number | null>(null);

  // auth + favorite
  const [me, setMe] = useState<string | null>(null);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [busyFav, setBusyFav] = useState(false);

  // ui
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbTitle, setLbTitle] = useState("");
  const [lbUrls, setLbUrls] = useState<string[]>([]);
  const [lbTypes, setLbTypes] = useState<MediaType[]>([]);
  const [lbPosters, setLbPosters] = useState<Array<string | null>>([]);
  const [lbStart, setLbStart] = useState(0);

  // load
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);

      try {
        // auth
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user ?? null;
        if (!cancelled) setMe(user?.id ?? null);

        // listing
        const { data, error } = await supabase
          .from("listings")
          .select(
            [
              "id",
              "seller_id",
              "title",
              "description",
              "product_name",
              "product_type",
              "city",
              "district",
              "neighborhood",
              "market_name",
              "unit",
              "price_per_unit",
              "price",
              "min_price",
              "max_price",
              "min_quantity",
              "quantity",
              "is_active",
              "is_boosted",
              "boost_score",
              "boost_until",
              "expires_at",
              "created_at",
              "media_urls",
              "media_types",
              "deleted_at",
            ].join(",")
          )
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;

        const listing = (data ?? null) as ListingRow | null;
        if (!listing) throw new Error("İlan bulunamadı");

        if (cancelled) return;

        // listing_media override (varsa)
        const cur = getMedia(listing);
        if (cur.urls.length === 0) {
          const m = await fetchListingMediaFor(String(listing.id));
          if (!cancelled && m.urls.length) {
            listing.media_urls = m.urls as any;
            listing.media_types = m.types as any;
          }
        }

        setRow(listing);

        // seller
        const sid = String(listing.seller_id ?? "").trim();
        if (sid) {
          const prof = await fetchSellerProfile(sid);
          if (!cancelled) setSeller(prof);
        } else {
          setSeller(null);
        }

        // views
// views
const v = await fetchViews(String(listing.id));
if (!cancelled) setViews(v);

bumpView(String(listing.id));
trackListingViewPixel(String(listing.id));

        // favorites
        if (user?.id) {
          try {
            const set = await fetchMyFavoriteIds(user.id);
            if (!cancelled) setFavSet(set);
          } catch {
            // sessiz
          }
        } else {
          setFavSet(new Set());
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ? String(e.message) : "Detay yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleFavorite() {
    if (!me || !row?.id) {
      setErr("Favorilemek için giriş yapmalısın.");
      return;
    }
    setBusyFav(true);
    setErr(null);
    try {
      const listingId = String(row.id);
      const isFav = favSet.has(listingId);

      if (isFav) {
        const { error } = await supabase.from("listing_favorites").delete().eq("user_id", me).eq("listing_id", listingId);
        if (error) throw error;
        setFavSet((prev) => {
          const n = new Set(prev);
          n.delete(listingId);
          return n;
        });
      } else {
        const { error } = await supabase.from("listing_favorites").insert([{ user_id: me, listing_id: listingId }]);
        if (error) throw error;
        setFavSet((prev) => {
          const n = new Set(prev);
          n.add(listingId);
          return n;
        });
      }
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Favori işlemi başarısız");
    } finally {
      setBusyFav(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = window.location.href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  const left = useMemo(() => daysLeft(row?.expires_at), [row?.expires_at]);
  const priceView = useMemo(() => fmtPrice(row), [row]);
  const isFav = row?.id ? favSet.has(String(row.id)) : false;

  const { urls, types } = useMemo(() => getMedia(row), [row]);
  const posters = useMemo(() => urls.map((u, idx) => (types[idx] === "video" ? null : u)), [urls, types]);

  const sellerName = useMemo(() => {
    const sid = String(row?.seller_id ?? "");
    return seller?.full_name?.trim() || (sid ? `Kullanıcı • ${sid.slice(0, 6)}…` : "Kullanıcı");
  }, [seller, row?.seller_id]);

  const sellerSub = useMemo(() => {
    const a = [row?.city, row?.district].filter(Boolean).join(" / ");
    return a || "—";
  }, [row?.city, row?.district]);

  const isPremiumSeller = !!seller?.is_premium;
  const isBoosted = !!row?.is_boosted;
  const score = Number(row?.boost_score ?? 0) || 0;

  const locStr = useMemo(() => {
    const parts = [row?.city, row?.district, row?.neighborhood].filter(Boolean).map(String);
    return parts.join(" / ") || "—";
  }, [row?.city, row?.district, row?.neighborhood]);

  const mapHref = useMemo(() => {
    const q = encodeURIComponent([row?.market_name, row?.neighborhood, row?.district, row?.city].filter(Boolean).join(" "));
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [row?.market_name, row?.neighborhood, row?.district, row?.city]);

  const stateBadge = useMemo(() => {
    if (!row) return null;
    const expired = left != null && left <= 0;
    if (expired) return { text: "Süresi doldu", tone: "rose" as const };
    if (left != null && left <= 3) return { text: `${left} gün kaldı`, tone: "rose" as const };
    if (left != null) return { text: `${left} gün`, tone: "neutral" as const };
    return null;
  }, [row, left]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-7 md:py-10">
        <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="h-6 w-2/3 animate-pulse rounded bg-black/5 dark:bg-white/5" />
          <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-black/5 dark:bg-white/5" />
          <div className="mt-6 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="aspect-square w-full animate-pulse rounded-3xl bg-black/5 dark:bg-white/5" />
            </div>
            <div className="lg:col-span-5">
              <div className="h-24 animate-pulse rounded-3xl bg-black/5 dark:bg-white/5" />
              <div className="mt-4 h-24 animate-pulse rounded-3xl bg-black/5 dark:bg-white/5" />
              <div className="mt-4 h-48 animate-pulse rounded-3xl bg-black/5 dark:bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !row) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-7 md:py-10">
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {err ?? "İlan bulunamadı"}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/pazar")}
            className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-black text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
          >
            Pazara dön
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
          >
            Geri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 md:py-10">
      <Lightbox
        open={lbOpen}
        title={lbTitle}
        urls={lbUrls}
        types={lbTypes}
        posters={lbPosters}
        startIndex={lbStart}
        onClose={() => setLbOpen(false)}
      />

      {/* Top Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
          >
            ← Geri
          </button>

          <Link
            href="/pazar"
            prefetch={false}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
          >
            Pazar
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyLink}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
          >
            🔗 Link kopyala
          </button>

          <button
            disabled={busyFav}
            onClick={toggleFavorite}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm font-black disabled:opacity-50",
              isFav
                ? "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/30"
                : "border-black/10 bg-white text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
            )}
            title={me ? "" : "Favorilemek için giriş yap"}
          >
            {busyFav ? "Bekle..." : isFav ? "❤️ Favori" : "🤍 Favorile"}
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
        {/* Header */}
        <div className="p-5 md:p-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {row.title ?? "İlan"}
                </div>

                {isBoosted ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                    🚀 Boost
                  </span>
                ) : null}

                {isPremiumSeller ? (
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-black text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200">
                    ⭐ Premium satıcı
                  </span>
                ) : null}

                {score >= 10 ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                    🔥 Trend
                  </span>
                ) : null}

                {stateBadge ? (
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-black",
                      stateBadge.tone === "rose"
                        ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
                        : "border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200"
                    )}
                  >
                    ⏳ {stateBadge.text}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
                  🥬 {row.product_name ?? row.product_type ?? "—"}
                </span>

                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
                  📍 {locStr}
                </span>

                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
                  👁️ {views == null ? "—" : fmtNum(views)}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Link
                prefetch={false}
                href={row.seller_id ? `/chat/user/${String(row.seller_id)}` : "#"}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-black",
                  row.seller_id
                    ? "bg-zinc-900 text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
                    : "border border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                )}
              >
                💬 Satıcıya Mesaj
              </Link>

              {mapHref ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
                >
                  🗺️ Harita
                </a>
              ) : null}
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="grid gap-0 border-t border-black/10 dark:border-white/10 lg:grid-cols-12">
          {/* Media */}
          <div className="p-5 md:p-7 lg:col-span-7 lg:border-r lg:border-black/10 dark:lg:border-white/10">
            <SquareMedia
              title={row.title ?? "İlan"}
              urls={urls}
              types={types}
              isBoosted={!!row.is_boosted}
              isPremiumSeller={isPremiumSeller}
              onOpen={(startIndex) => {
                setLbTitle(row.title ?? "İlan");
                setLbUrls(urls);
                setLbTypes(types);
                setLbPosters(posters);
                setLbStart(startIndex);
                setLbOpen(true);
              }}
            />

            {/* Small meta strip */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/35">
                <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">İlan No</div>
                <div className="mt-1 font-mono text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {String(row.id).slice(0, 8)}…
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/35">
                <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Oluşturma</div>
                <div className="mt-1 text-sm font-black text-zinc-900 dark:text-zinc-100">{fmtDateTime(row.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-5 md:p-7 lg:col-span-5">
            {/* Price */}
            <div className="rounded-[26px] border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-zinc-900/35">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Fiyat</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      {priceView.main}
                    </div>
                    {priceView.sub ? (
                      <div className="pb-1 text-sm font-black text-zinc-500 dark:text-zinc-400">{priceView.sub}</div>
                    ) : null}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Birim</div>
                  <div className="mt-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm font-black text-zinc-900 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-100">
                    {row.unit ?? "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/35">
                  <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Min. Miktar</div>
                  <div className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-100">{fmtNum(row.min_quantity)}</div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-950/35">
                  <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Stok / Miktar</div>
                  <div className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-100">{fmtNum(row.quantity)}</div>
                </div>
              </div>

              {row.boost_until ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                  🚀 Boost bitiş: <span className="font-black">{fmtDateTime(row.boost_until)}</span>
                </div>
              ) : null}
            </div>

            {/* Seller */}
            <div className="mt-4 rounded-[26px] border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-zinc-900/35">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Satıcı</div>
                {isPremiumSeller ? (
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200">
                    ⭐ Premium
                  </span>
                ) : null}
              </div>

              <div className="mt-3">
                <SellerChip name={sellerName} avatarUrl={seller?.avatar_url ?? null} sub={sellerSub} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  prefetch={false}
                  href={row.seller_id ? `/chat/user/${String(row.seller_id)}` : "#"}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-center text-sm font-black",
                    row.seller_id
                      ? "bg-zinc-900 text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
                      : "border border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                  )}
                >
                  💬 Mesaj
                </Link>

                <button
                  onClick={toggleFavorite}
                  disabled={busyFav}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-black disabled:opacity-50",
                    isFav
                      ? "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/30"
                      : "border-black/10 bg-white text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
                  )}
                >
                  {busyFav ? "Bekle..." : isFav ? "❤️ Favori" : "🤍 Favorile"}
                </button>
              </div>
            </div>

            {/* Location / Market */}
            <div className="mt-4 rounded-[26px] border border-black/10 bg-white/70 p-5 dark:border-white/10 dark:bg-zinc-900/35">
              <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">Konum</div>
              <div className="mt-2 text-sm font-black text-zinc-900 dark:text-zinc-100">{locStr}</div>

              <div className="mt-4 text-[11px] font-black text-zinc-600 dark:text-zinc-400">Pazar</div>
              <div className="mt-2 text-sm font-black text-zinc-900 dark:text-zinc-100">{row.market_name ?? "—"}</div>

              <div className="mt-4 flex flex-wrap gap-2">
                {mapHref ? (
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-100 dark:hover:bg-white/5"
                  >
                    🗺️ Haritada aç
                  </a>
                ) : null}

                <button
                  onClick={copyLink}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-100 dark:hover:bg-white/5"
                >
                  🔗 Link kopyala
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-black/10 p-5 dark:border-white/10 dark:bg-zinc-950 md:p-7">
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">Açıklama</div>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
              🛡️ Güvenli alışveriş: Detayları mesajda netleştir
            </span>
          </div>

          {row.description ? (
            <div className="mt-3 whitespace-pre-wrap rounded-[22px] border border-black/10 bg-white/70 p-5 text-sm leading-relaxed text-zinc-800 dark:border-white/10 dark:bg-zinc-900/35 dark:text-zinc-200">
              {row.description}
            </div>
          ) : (
            <div className="mt-3 rounded-[22px] border border-black/10 bg-white/70 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-900/35 dark:text-zinc-200">
              Açıklama girilmemiş.
            </div>
          )}

          {/* Bottom actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              prefetch={false}
              href="/pazar"
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
            >
              Pazara dön
            </Link>

            <Link
              prefetch={false}
              href={row.seller_id ? `/chat/user/${String(row.seller_id)}` : "#"}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-black",
                row.seller_id
                  ? "bg-zinc-900 text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
                  : "border border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
              )}
            >
              💬 Satıcıya mesaj
            </Link>
          </div>
        </div>
      </div>

      {/* Footer tiny */}
      <div className="mt-4 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-500">
        İlan ID: <span className="font-mono font-black">{String(row.id)}</span> • Güncellendi:{" "}
        <span className="font-black">{fmtDateTime(row.created_at)}</span>
      </div>
    </div>
  );
}
