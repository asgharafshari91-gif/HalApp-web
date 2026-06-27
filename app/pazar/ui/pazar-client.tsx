"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabaseClient";
import SellerChip from "./seller-chip";
import { Lightbox, SquareMedia } from "@/app/my-listings/ui/listing-card";

type MediaType = "image" | "video";
type LocationsMap = Record<string, Record<string, string[]>>;

const PRODUCTS = [
  "Elma",
  "Elma (Golden)",
  "Elma (Granny Smith)",
  "Elma (Starking)",
  "Armut",
  "Ayva",
  "Portakal",
  "Portakal (Sıkmalık)",
  "Portakal (Valencia Pak)",
  "Mandalina",
  "Mandarin",
  "Mandarin (Paket)",
  "Greyfurt",
  "Limon",
  "Lime Limon",
  "Muz",
  "Muz (Yerli)",
  "Muz İthal",
  "Karpuz",
  "Kavun",
  "Kavun (Kırkağaç)",
  "Üzüm",
  "Üzüm (Beyaz)",
  "Üzüm (Siyah)",
  "Çilek",
  "Altın Çilek",
  "Ahududu",
  "Böğürtlen",
  "Blue Berry",
  "Yaban Mersini",
  "Dut",
  "Kiraz",
  "Vişne",
  "Şeftali",
  "Kayısı",
  "Nektarin",
  "Erik",
  "Nar",
  "İncir",
  "Kivi",
  "Ananas",
  "Mango",
  "Avokado",
  "Hindistan Cevizi",
  "Hurma",
  "Amme (Cennet Meyvesi)",

  "Domates",
  "Domates (Ceri)",
  "Domates (Pembe)",
  "Domates Kokteyl",
  "Biber",
  "Biber Çarli",
  "Biber Kapya",
  "Biber Sivri",
  "Biber Üçburun",
  "Patlıcan",
  "Patlıcan (Topak)",
  "Salatalık",
  "Hıyar",
  "Kabak",
  "Kabak (Bal)",
  "Kabak (Sakız)",
  "Patates",
  "Patates (Baby)",
  "Patates (Kumpirlik)",
  "Soğan",
  "Soğan Kuru",
  "Soğan (Arpacık)",
  "Soğan (Kırmızı)",
  "Soğan (Yeşil) Bağ",
  "Sarımsak",
  "Sarımsak (Taze)",
  "Havuç",
  "Turp",
  "Turp (Kırmızı)",
  "Turp (Fındık)",
  "Pancar",
  "Brokoli",
  "Karnabahar",
  "Lahana",
  "Lahana (Beyaz)",
  "Lahana (Kırmızı)",
  "Marul",
  "Marul (Aysberk)",
  "Marul (Düz)",
  "Marul (Kıvırcık)",
  "Ispanak",
  "Pazı",
  "Pazı Bağ",
  "Kereviz",
  "Pırasa",
  "Karadeniz Yaprağı",
  "Kuzu Kulağı",
  "Semizotu",
  "Semizotu Bağ",
  "Enginar",
  "Bamya",
  "Fasulye",
  "Bezelye",
  "Bakla",
  "Mısır",
  "Mantar",
  "Kuşkonmaz",

  "Roka",
  "Roka Bağ",
  "Nane",
  "Maydanoz",
  "Maydonoz",
  "Dereotu",
  "Fesleğen",
  "Tere",
  "Tere Bağ",
  "Tere Su",

  "Ceviz",
  "Badem",
  "Fındık",
  "Antep Fıstığı",
  "Zencefil",
];

const productEmojiMap: [string[], string][] = [
  [["elma"], "🍎"],
  [["armut", "ayva"], "🍐"],
  [["portakal", "mandalina", "mandarin", "greyfurt"], "🍊"],
  [["limon", "lime"], "🍋"],
  [["muz", "banana"], "🍌"],
  [["karpuz"], "🍉"],
  [["kavun"], "🍈"],
  [["uzum", "üzüm"], "🍇"],
  [["cilek", "çilek", "altin cilek", "altın çilek"], "🍓"],
  [
    [
      "ahududu",
      "bogurtlen",
      "böğürtlen",
      "blue berry",
      "blueberry",
      "yaban mersini",
      "dut",
    ],
    "🫐",
  ],
  [["kiraz", "visne", "vişne"], "🍒"],
  [["seftali", "şeftali", "kayisi", "kayısı", "nektarin"], "🍑"],
  [["erik"], "🟣"],
  [["nar"], "🔴"],
  [["incir", "i̇ncir"], "🟣"],
  [["kivi"], "🥝"],
  [["ananas"], "🍍"],
  [["mango"], "🥭"],
  [["avokado"], "🥑"],
  [["hindistan cevizi"], "🥥"],
  [["hurma", "amme", "cennet"], "🌴"],

  [["domates"], "🍅"],
  [["biber"], "🌶️"],
  [["patlican", "patlıcan"], "🍆"],
  [["salatalik", "salatalık", "hiyar", "hıyar"], "🥒"],
  [["kabak"], "🎃"],
  [["patates"], "🥔"],
  [["sogan", "soğan"], "🧅"],
  [["sarimsak", "sarımsak"], "🧄"],
  [["havuc", "havuç", "turp", "pancar"], "🥕"],
  [["brokoli", "karnabahar"], "🥦"],
  [
    [
      "lahana",
      "marul",
      "ispanak",
      "ıspanak",
      "pazi",
      "pazı",
      "kereviz",
      "pirasa",
      "pırasa",
      "semizotu",
      "karadeniz yaprağı",
      "kuzu kulağı",
    ],
    "🥬",
  ],
  [["enginar", "bamya"], "🌿"],
  [["fasulye", "bezelye", "bakla"], "🫛"],
  [["misir", "mısır"], "🌽"],
  [["mantar"], "🍄"],
  [["kuskonmaz", "kuşkonmaz"], "🌱"],
  [
    [
      "roka",
      "nane",
      "maydanoz",
      "maydonoz",
      "dereotu",
      "feslegen",
      "fesleğen",
      "tere",
    ],
    "🌿",
  ],
  [["ceviz", "badem", "findik", "fındık", "antep fistigi", "antep fıstığı"], "🥜"],
  [["zencefil"], "🫚"],
];

function normalizeProductName(value?: string | null) {
  return String(value ?? "").toLocaleLowerCase("tr-TR").trim();
}

function getProductEmoji(value?: string | null) {
  const name = normalizeProductName(value);
  if (!name) return "🥬";

  for (const [keys, emoji] of productEmojiMap) {
    if (keys.some((k) => name.includes(k.toLocaleLowerCase("tr-TR")))) {
      return emoji;
    }
  }

  return "🥬";
}

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
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
  return dt.toLocaleDateString("tr-TR");
}

function daysLeft(expiresAt: any) {
  const s = String(expiresAt ?? "").trim();
  if (!s) return null;
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;
  const now = new Date();
  return Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

function isVideoType(t: any): t is "video" {
  return String(t) === "video";
}

function getMedia(listing: any): { urls: string[]; types: MediaType[] } {
  const urls: string[] = Array.isArray(listing?.media_urls)
    ? listing.media_urls
    : [];
  const typesRaw: any[] = Array.isArray(listing?.media_types)
    ? listing.media_types
    : [];
  const types: MediaType[] = typesRaw.map((t) =>
    isVideoType(t) ? "video" : "image"
  );
  const len = Math.min(urls.length, types.length);
  return { urls: urls.slice(0, len), types: types.slice(0, len) };
}

async function fetchListingMediaFor(listingIds: string[]) {
  const map = new Map<string, { urls: string[]; types: MediaType[] }>();
  const uniq = Array.from(new Set(listingIds)).filter(Boolean);
  if (!uniq.length) return map;

  const { data, error } = await supabase
    .from("listing_media")
    .select("listing_id,url,type,sort_order")
    .in("listing_id", uniq)
    .order("sort_order", { ascending: true });

  if (error || !data) return map;

  for (const r of data as any[]) {
    const id = String(r.listing_id);
    const url = String(r.url);
    const type: MediaType = String(r.type) === "video" ? "video" : "image";
    const cur = map.get(id) ?? { urls: [], types: [] };
    cur.urls.push(url);
    cur.types.push(type);
    map.set(id, cur);
  }

  return map;
}

type SellerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium?: boolean | null;
};

type SellerStats = {
  seller_id: string;
  listings_count: number;
  sales_count: number;
};

async function fetchSellerProfiles(sellerIds: string[]) {
  const map = new Map<string, SellerProfile>();
  const uniq = Array.from(new Set(sellerIds))
    .map((x) => String(x || "").trim())
    .filter((x) => x && x !== "null" && x !== "undefined");

  if (!uniq.length) return map;

  const { data, error } = await supabase.rpc("get_public_profiles", {
    ids: uniq,
  });

  if (error) {
    console.error("get_public_profiles error:", (error as any)?.message ?? error);
    return map;
  }

  for (const p of (data ?? []) as any[]) {
    map.set(String(p.id), {
      id: String(p.id),
      full_name: p.full_name ?? null,
      avatar_url: p.avatar_url ?? null,
      is_premium: p.is_premium ?? null,
    });
  }

  return map;
}

async function fetchSellerStats(sellerIds: string[]) {
  const map = new Map<string, SellerStats>();
  const uniq = Array.from(new Set(sellerIds))
    .map((x) => String(x || "").trim())
    .filter((x) => x && x !== "null" && x !== "undefined");

  if (!uniq.length) return map;

  try {
    const { data, error } = await supabase.rpc("get_seller_stats", {
      ids: uniq,
    });

    if (error) throw error;

    for (const r of (data ?? []) as any[]) {
      map.set(String(r.seller_id), {
        seller_id: String(r.seller_id),
        listings_count: Number(r.listings_count ?? 0) || 0,
        sales_count: Number(r.sales_count ?? 0) || 0,
      });
    }
  } catch {
    // boş
  }

  return map;
}

async function fetchListingViews(listingIds: string[]) {
  const map = new Map<string, number>();
  const uniq = Array.from(new Set(listingIds)).filter(Boolean);
  if (!uniq.length) return map;

  try {
    const { data, error } = await supabase.rpc("get_listing_views", {
      ids: uniq,
    });

    if (error) throw error;

    for (const r of (data ?? []) as any[]) {
      map.set(String(r.listing_id), Number(r.views ?? r.view_count ?? 0) || 0);
    }
  } catch {
    // boş
  }

  return map;
}

async function bumpView(listingId: string) {
  try {
    await supabase.rpc("increment_listing_view", { listing_id: listingId });
  } catch {
    // sessiz
  }
}

async function fetchMyFavoriteIds(userId: string) {
  const { data, error } = await supabase
    .from("listing_favorites")
    .select("listing_id")
    .eq("user_id", userId);

  if (error) throw error;

  return new Set((data ?? []).map((r: any) => String(r.listing_id)));
}

async function fetchFeaturedListings(limit = 12) {
  try {
    const { data, error } = await supabase.rpc("get_featured_listings", {
      lim: limit,
    });

    if (error) throw error;
    return (data ?? []) as any[];
  } catch {
    return [];
  }
}

function withinDays(d: any, days: number) {
  const s = String(d ?? "").trim();
  if (!s) return false;
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return false;
  const now = new Date();
  const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days;
}

function FeaturedCard({
  x,
  seller,
  isFav,
  busy,
  views,
  onFav,
  onOpenMedia,
}: {
  x: any;
  seller?: SellerProfile;
  isFav: boolean;
  busy: boolean;
  views?: number;
  onFav: () => void;
  onOpenMedia: (urls: string[], types: MediaType[], title: string) => void;
}) {
  const { urls, types } = getMedia(x);
  const priceView = fmtPrice(x);
  const sellerName =
    seller?.full_name?.trim() ||
    `Kullanıcı • ${String(x?.seller_id ?? "").slice(0, 6)}…`;
  const isPremiumSeller = !!seller?.is_premium;
  const left = daysLeft(x?.expires_at);
  const productLabel = x.product_name ?? x.product_type ?? "—";

  return (
    <div className="snap-start">
      <div className="w-[min(78vw,360px)] overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-950">
        <div className="p-4">
          <SquareMedia
            title={x.title ?? "İlan"}
            urls={urls}
            types={types}
            isBoosted={!!x.is_boosted}
            isPremiumSeller={isPremiumSeller}
            onOpen={() => onOpenMedia(urls, types, x.title ?? "İlan")}
          />

          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-base font-black text-zinc-900 dark:text-zinc-100">
                {x.title ?? "İlan"}
              </div>

              <div className="mt-1 truncate text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                {getProductEmoji(productLabel)} {productLabel}
              </div>
            </div>

            {left != null ? (
              <span
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-[11px] font-black",
                  left <= 3
                    ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
                    : "border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200"
                )}
              >
                {left <= 0 ? "Bitti" : `${left} gün`}
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <InfoBox label="Fiyat" value={priceView.main} sub={priceView.sub} />
            <InfoBox label="👁️ Görünt." value={views == null ? "—" : fmtNum(views)} />
          </div>

          <div className="mt-3 rounded-3xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/35">
            <SellerChip
              name={sellerName}
              avatarUrl={seller?.avatar_url ?? null}
              sub={[x.city, x.district].filter(Boolean).join(" / ") || "—"}
            />
          </div>

          <div className="mt-3 grid gap-2">
            <button
              disabled={busy}
              onClick={onFav}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-sm font-black disabled:opacity-50",
                isFav
                  ? "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/30"
                  : "border-black/10 bg-white text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
              )}
            >
              {busy ? "Bekle..." : isFav ? "❤️ Favoriden Çıkar" : "🤍 Favorile"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/pazar/${String(x.id)}`}
                onClick={() => bumpView(String(x.id))}
                className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-black text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
              >
                Detay
              </Link>

              <Link
                href={x?.seller_id ? `/chat/user/${String(x.seller_id)}` : "#"}
                className={cn(
                  "block w-full rounded-2xl border px-4 py-3 text-center text-sm font-black",
                  x?.seller_id
                    ? "border-black/10 bg-white text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
                    : "border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                )}
              >
                💬 Mesaj
              </Link>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-500">
            <span className="truncate">Oluşturma: {fmtDate(x.created_at)}</span>
            <span className="font-mono font-black">{String(x.id).slice(0, 8)}…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/35">
      <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">
        {label}
      </div>

      <div className="mt-1 flex items-end gap-2">
        <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
          {value}
        </div>

        {sub ? (
          <div className="pb-[2px] text-xs font-black text-zinc-500 dark:text-zinc-400">
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}
export default function PazarClient() {
  const [me, setMe] = useState<string | null>(null);
  const [favSet, setFavSet] = useState<Set<string>>(new Set());
  const [busyFav, setBusyFav] = useState<string | null>(null);

  const [rows, setRows] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [sellerMap, setSellerMap] = useState<Map<string, SellerProfile>>(new Map());
  const [sellerStats, setSellerStats] = useState<Map<string, SellerStats>>(new Map());
  const [viewsMap, setViewsMap] = useState<Map<string, number>>(new Map());

  const [loading, setLoading] = useState(true);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [product, setProduct] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const [locMap, setLocMap] = useState<LocationsMap>({});

  useEffect(() => {
    fetch("/locations.json")
      .then((r) => r.json())
      .then((j) => setLocMap(j || {}))
      .catch((e) => console.error("locations.json error", e));
  }, []);

  const cities = useMemo(
    () => Object.keys(locMap).sort((a, b) => a.localeCompare(b, "tr")),
    [locMap]
  );

  const districts = useMemo(() => {
    if (!city) return [];
    return Object.keys(locMap[city] || {}).sort((a, b) =>
      a.localeCompare(b, "tr")
    );
  }, [locMap, city]);

  const neighborhoods = useMemo(() => {
    if (!city || !district) return [];
    return locMap[city]?.[district] || [];
  }, [locMap, city, district]);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbTitle, setLbTitle] = useState("");
  const [lbUrls, setLbUrls] = useState<string[]>([]);
  const [lbTypes, setLbTypes] = useState<MediaType[]>([]);
  const [lbPosters, setLbPosters] = useState<Array<string | null>>([]);
  const [lbStart, setLbStart] = useState(0);

  const PAGE = 18;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const featuredWrapRef = useRef<HTMLDivElement | null>(null);

  function scrollFeatured(dir: "left" | "right") {
    const el = featuredWrapRef.current;
    if (!el) return;
    const by = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: dir === "left" ? -by : by, behavior: "smooth" });
  }

  async function loadFeatured() {
    setLoadingFeatured(true);

    try {
      let list = await fetchFeaturedListings(12);

      if (!list.length) {
        const since = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();

        const { data } = await supabase
          .from("listings")
          .select(
            [
              "id",
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
              "seller_id",
              "media_urls",
              "media_types",
              "deleted_at",
            ].join(",")
          )
          .is("deleted_at", null)
          .eq("is_active", true)
          .gte("created_at", since)
          .order("is_boosted", { ascending: false })
          .order("boost_score", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        list = data ?? [];
      }

      const ids = list.map((x: any) => String(x.id));
      const mediaMap = await fetchListingMediaFor(ids);

      const fixed = list.map((x: any) => {
        const cur = getMedia(x);
        if (cur.urls.length === 0 && mediaMap.has(String(x.id))) {
          const m = mediaMap.get(String(x.id))!;
          return { ...x, media_urls: m.urls, media_types: m.types };
        }
        return x;
      });

      setFeatured(fixed);

      const sellerIds = fixed
        .map((x: any) => String(x.seller_id))
        .filter(Boolean);

      const [pmapNew, vmapNew] = await Promise.all([
        fetchSellerProfiles(sellerIds),
        fetchListingViews(ids),
      ]);

      setSellerMap((prev) => {
        const n = new Map(prev);
        for (const [k, v] of pmapNew.entries()) n.set(k, v);
        return n;
      });

      setViewsMap((prev) => {
        const n = new Map(prev);
        for (const [k, v] of vmapNew.entries()) n.set(k, v);
        return n;
      });
    } finally {
      setLoadingFeatured(false);
    }
  }

  async function loadFirst() {
    setLoading(true);
    setErr(null);
    setPage(0);
    setHasMore(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setMe(user?.id ?? null);

      const { data, error } = await supabase
        .from("listings")
        .select(
          [
            "id",
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
            "seller_id",
            "media_urls",
            "media_types",
            "deleted_at",
          ].join(",")
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("is_boosted", { ascending: false })
        .order("boost_score", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, PAGE - 1);

      if (error) throw error;

      const list = data ?? [];
      const ids = list.map((x: any) => String(x.id));
      const mediaMap = await fetchListingMediaFor(ids);

      const fixed = list.map((x: any) => {
        const cur = getMedia(x);
        if (cur.urls.length === 0 && mediaMap.has(String(x.id))) {
          const m = mediaMap.get(String(x.id))!;
          return { ...x, media_urls: m.urls, media_types: m.types };
        }
        return x;
      });

      setRows(fixed);
      setHasMore(fixed.length >= PAGE);

      const sellerIds = fixed
        .map((x: any) => String(x.seller_id))
        .filter(Boolean);

      const [pmap, smap, vmap] = await Promise.all([
        fetchSellerProfiles(sellerIds),
        fetchSellerStats(sellerIds),
        fetchListingViews(ids),
      ]);

      setSellerMap(pmap);
      setSellerStats(smap);
      setViewsMap(vmap);

      if (user?.id) setFavSet(await fetchMyFavoriteIds(user.id));
      else setFavSet(new Set());
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Pazar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;

    setLoadingMore(true);
    setErr(null);

    const nextPage = page + 1;
    const from = nextPage * PAGE;
    const to = from + PAGE - 1;

    try {
      const { data, error } = await supabase
        .from("listings")
        .select(
          [
            "id",
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
            "seller_id",
            "media_urls",
            "media_types",
            "deleted_at",
          ].join(",")
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .order("is_boosted", { ascending: false })
        .order("boost_score", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const list = data ?? [];
      const ids = list.map((x: any) => String(x.id));
      const mediaMap = await fetchListingMediaFor(ids);

      const fixed = list.map((x: any) => {
        const cur = getMedia(x);
        if (cur.urls.length === 0 && mediaMap.has(String(x.id))) {
          const m = mediaMap.get(String(x.id))!;
          return { ...x, media_urls: m.urls, media_types: m.types };
        }
        return x;
      });

      setRows((prev) => {
        const seen = new Set(prev.map((r: any) => String(r.id)));
        const merged = [...prev];

        for (const r of fixed) {
          const id = String(r.id);
          if (!seen.has(id)) merged.push(r);
        }

        return merged;
      });

      setHasMore(fixed.length >= PAGE);
      setPage(nextPage);

      const sellerIds = fixed
        .map((x: any) => String(x.seller_id))
        .filter(Boolean);

      const [pmapNew, statsNew, vmapNew] = await Promise.all([
        fetchSellerProfiles(sellerIds),
        fetchSellerStats(sellerIds),
        fetchListingViews(ids),
      ]);

      setSellerMap((prev) => {
        const n = new Map(prev);
        for (const [k, v] of pmapNew.entries()) n.set(k, v);
        return n;
      });

      setSellerStats((prev) => {
        const n = new Map(prev);
        for (const [k, v] of statsNew.entries()) n.set(k, v);
        return n;
      });

      setViewsMap((prev) => {
        const n = new Map(prev);
        for (const [k, v] of vmapNew.entries()) n.set(k, v);
        return n;
      });
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Daha fazla yüklenemedi");
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFeatured();
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) loadMore();
      },
      { rootMargin: "600px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, loadingMore, page]);

  const featuredIds = useMemo(() => {
    const ids = new Set<string>();

    for (const x of featured) ids.add(String(x.id));

    if (!ids.size) {
      for (const x of rows) {
        const boosted = !!x?.is_boosted;
        const score = Number(x?.boost_score ?? 0) || 0;
        const week = withinDays(x?.created_at, 7);

        if (boosted || score >= 10 || week) ids.add(String(x.id));
      }
    }

    return ids;
  }, [featured, rows]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLocaleLowerCase("tr-TR");
    const minP = minPrice.trim() ? Number(minPrice) : null;
    const maxP = maxPrice.trim() ? Number(maxPrice) : null;

    const okNum = (n: any) => n != null && Number.isFinite(Number(n));

    function listingBasePrice(x: any) {
      if (okNum(x?.price_per_unit)) return Number(x.price_per_unit);
      if (okNum(x?.price)) return Number(x.price);
      if (okNum(x?.min_price)) return Number(x.min_price);
      if (okNum(x?.max_price)) return Number(x.max_price);
      return null;
    }

    return rows.filter((x) => {
      if (onlyFeatured && !featuredIds.has(String(x.id))) return false;

      if (qq) {
        const hay = `${x.title ?? ""} ${x.description ?? ""} ${
          x.product_name ?? ""
        } ${x.product_type ?? ""} ${x.city ?? ""} ${x.district ?? ""} ${
          x.neighborhood ?? ""
        } ${x.market_name ?? ""}`.toLocaleLowerCase("tr-TR");

        if (!hay.includes(qq)) return false;
      }

      if (product) {
        const pn = String(x.product_name ?? x.product_type ?? "").trim();
        if (pn !== product) return false;
      }

      if (city && String(x.city ?? "") !== city) return false;
      if (district && String(x.district ?? "") !== district) return false;
      if (neighborhood && String(x.neighborhood ?? "") !== neighborhood) return false;

      const base = listingBasePrice(x);

      if (minP != null && (base == null || base < minP)) return false;
      if (maxP != null && (base == null || base > maxP)) return false;

      return true;
    });
  }, [
    rows,
    q,
    product,
    city,
    district,
    neighborhood,
    minPrice,
    maxPrice,
    onlyFeatured,
    featuredIds,
  ]);

  async function toggleFavorite(listingId: string) {
    if (!me) {
      setErr("Favorilemek için giriş yapmalısın.");
      return;
    }

    setBusyFav(listingId);
    setErr(null);

    try {
      const isFav = favSet.has(String(listingId));

      if (isFav) {
        const { error } = await supabase
          .from("listing_favorites")
          .delete()
          .eq("user_id", me)
          .eq("listing_id", listingId);

        if (error) throw error;

        setFavSet((prev) => {
          const n = new Set(prev);
          n.delete(String(listingId));
          return n;
        });
      } else {
        const { error } = await supabase.from("listing_favorites").insert([
          {
            user_id: me,
            listing_id: listingId,
          },
        ]);

        if (error) throw error;

        setFavSet((prev) => {
          const n = new Set(prev);
          n.add(String(listingId));
          return n;
        });
      }
    } catch (e: any) {
      setErr(e?.message ? String(e.message) : "Favori işlemi başarısız");
    } finally {
      setBusyFav(null);
    }
  }

  function clearFilters() {
    setQ("");
    setProduct("");
    setCity("");
    setDistrict("");
    setNeighborhood("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyFeatured(false);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-7 md:py-10">
      <Lightbox
        open={lbOpen}
        title={lbTitle}
        urls={lbUrls}
        types={lbTypes}
        posters={lbPosters}
        startIndex={lbStart}
        onClose={() => setLbOpen(false)}
      />

      <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Pazar
              </div>

              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
                Premium görünüm
              </span>

              <button
                onClick={() => setOnlyFeatured((p) => !p)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-black",
                  onlyFeatured
                    ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
                    : "border-black/10 bg-white text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-white/5"
                )}
              >
                🏆 {onlyFeatured ? "Öne çıkanlar: Açık" : "Öne çıkanlar"}
              </button>
            </div>

            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              🔍 Gelişmiş filtreler • 🚀 Boost rozetleri • ⭐ Premium satıcı •
              ⚡ Infinite scroll
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              onClick={() => {
                loadFeatured();
                loadFirst();
              }}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-white/5"
            >
              Yenile
            </button>

            <button
              onClick={clearFilters}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-white/5"
            >
              Filtreyi Sıfırla
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ara: başlık, ürün, şehir..."
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100 dark:focus:border-white/25"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100"
            >
              <option value="">Ürün (tümü)</option>
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>
                  {getProductEmoji(p)} {p}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setDistrict("");
                setNeighborhood("");
              }}
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100"
            >
              <option value="">Şehir</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={district}
              disabled={!city}
              onChange={(e) => {
                setDistrict(e.target.value);
                setNeighborhood("");
              }}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none",
                !city
                  ? "border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                  : "border-black/10 bg-white/80 text-zinc-900 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100"
              )}
            >
              <option value="">İlçe</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={neighborhood}
              disabled={!district}
              onChange={(e) => setNeighborhood(e.target.value)}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none",
                !district
                  ? "border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                  : "border-black/10 bg-white/80 text-zinc-900 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100"
              )}
            >
              <option value="">Mahalle</option>
              {neighborhoods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <input
              value={minPrice}
              onChange={(e) =>
                setMinPrice(e.target.value.replace(/[^\d.]/g, ""))
              }
              inputMode="numeric"
              placeholder="Min fiyat"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100 dark:focus:border-white/25"
            />
          </div>

          <div className="lg:col-span-2">
            <input
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value.replace(/[^\d.]/g, ""))
              }
              inputMode="numeric"
              placeholder="Max fiyat"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black/25 dark:border-white/10 dark:bg-zinc-900/45 dark:text-zinc-100 dark:focus:border-white/25"
            />
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </div>
        ) : null}
      </div>
      <div className="mt-6">
        <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  🏆 Haftanın İlanları
                </div>

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                  Boost + Son 7 gün + Views
                </span>
              </div>

              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Yatay kaydır • Snap’li carousel • Premium kartlar
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollFeatured("left")}
                className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-white/5"
                aria-label="Sola kaydır"
              >
                ‹
              </button>

              <button
                onClick={() => scrollFeatured("right")}
                className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-100 dark:hover:bg-white/5"
                aria-label="Sağa kaydır"
              >
                ›
              </button>

              <button
                onClick={loadFeatured}
                className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-black text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
              >
                Yenile
              </button>
            </div>
          </div>

          <div
            ref={featuredWrapRef}
            className={cn(
              "mt-4 flex gap-4 overflow-x-auto pb-2",
              "snap-x snap-mandatory",
              "scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10"
            )}
          >
            {loadingFeatured ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="snap-start w-[min(78vw,360px)] animate-pulse rounded-[26px] border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950"
                  >
                    <div className="aspect-square w-full rounded-2xl bg-black/5 dark:bg-white/5" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-black/5 dark:bg-white/5" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-black/5 dark:bg-white/5" />
                    <div className="mt-3 h-10 w-full rounded-2xl bg-black/5 dark:bg-white/5" />
                  </div>
                ))}
              </>
            ) : featured.length ? (
              featured.map((x) => {
                const sellerId = String(x.seller_id ?? "");
                const seller = sellerId ? sellerMap.get(sellerId) : undefined;
                const isFav = favSet.has(String(x.id));
                const busy = busyFav === String(x.id);
                const views = viewsMap.get(String(x.id));

                return (
                  <FeaturedCard
                    key={String(x.id)}
                    x={x}
                    seller={seller}
                    isFav={isFav}
                    busy={busy}
                    views={views}
                    onFav={() => toggleFavorite(String(x.id))}
                    onOpenMedia={(urls, types, title) => {
                      setLbTitle(title);
                      setLbUrls(urls);
                      setLbTypes(types);
                      setLbPosters(
                        urls.map((u, idx) =>
                          types[idx] === "video" ? null : u
                        )
                      );
                      setLbStart(0);
                      setLbOpen(true);
                    }}
                  />
                );
              })
            ) : (
              <div className="w-full rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                Haftanın ilanı bulunamadı.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-[28px] border border-black/10 bg-white p-6 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
            Yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-black/10 bg-white p-6 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
            İlan bulunamadı.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((x) => {
                const { urls, types } = getMedia(x);
                const priceView = fmtPrice(x);

                const sellerId = String(x.seller_id ?? "");
                const seller = sellerId ? sellerMap.get(sellerId) : undefined;

                const sellerName =
                  seller?.full_name?.trim() ||
                  (sellerId
                    ? `Kullanıcı • ${sellerId.slice(0, 6)}…`
                    : "Kullanıcı");

                const sellerSub =
                  [x.city, x.district].filter(Boolean).join(" / ") ||
                  (sellerId ? `ID: ${sellerId.slice(0, 6)}…` : "—");

                const isFav = favSet.has(String(x.id));
                const busy = busyFav === String(x.id);

                const left = daysLeft(x.expires_at);
                const views = viewsMap.get(String(x.id));

                const stats = sellerId ? sellerStats.get(sellerId) : undefined;
                const isPremiumSeller = !!seller?.is_premium;

                const productLabel = x.product_name ?? x.product_type ?? "—";

                return (
                  <div
                    key={x.id}
                    className="group relative overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-950"
                  >
                    <div className="p-4">
                      <SquareMedia
                        title={x.title ?? "İlan"}
                        urls={urls}
                        types={types}
                        isBoosted={!!x.is_boosted}
                        isPremiumSeller={isPremiumSeller}
                        onOpen={(startIndex, posters) => {
                          setLbTitle(x.title ?? "İlan");
                          setLbUrls(urls);
                          setLbTypes(types);
                          setLbPosters(posters);
                          setLbStart(startIndex);
                          setLbOpen(true);
                        }}
                      />

                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-zinc-900 dark:text-zinc-100">
                            {x.title ?? "İlan"}
                          </div>

                          <div className="mt-1 truncate text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                            {getProductEmoji(productLabel)} {productLabel}
                          </div>
                        </div>

                        {left != null ? (
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-black",
                              left <= 3
                                ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
                                : "border-black/10 bg-white text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200"
                            )}
                          >
                            {left <= 0 ? "Süresi doldu" : `${left} gün`}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <InfoBox
                          label="Fiyat"
                          value={priceView.main}
                          sub={priceView.sub}
                        />

                        <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/35">
                          <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">
                            Konum
                          </div>

                          <div className="mt-1 line-clamp-2 text-xs font-black text-zinc-900 dark:text-zinc-100">
                            {[x.city, x.district, x.neighborhood]
                              .filter(Boolean)
                              .join(" / ") || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-3xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/35">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] font-black text-zinc-600 dark:text-zinc-400">
                            Satıcı
                          </div>

                          {isPremiumSeller ? (
                            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200">
                              ⭐ Premium satıcı
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2">
                          <SellerChip
                            name={sellerName}
                            avatarUrl={seller?.avatar_url ?? null}
                            sub={sellerSub}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-200">
                            📦 {stats ? stats.listings_count : "—"} ilan
                          </span>

                          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-200">
                            🧾 {stats ? stats.sales_count : "—"} satış
                          </span>

                          <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-black text-zinc-700 dark:border-white/10 dark:bg-zinc-950/35 dark:text-zinc-200">
                            👁️ {views == null ? "—" : fmtNum(views)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <button
                          disabled={busy}
                          onClick={() => toggleFavorite(String(x.id))}
                          className={cn(
                            "w-full rounded-2xl border px-4 py-3 text-sm font-black disabled:opacity-50",
                            isFav
                              ? "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/30"
                              : "border-black/10 bg-white text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
                          )}
                        >
                          {busy
                            ? "Bekle..."
                            : isFav
                              ? "❤️ Favoriden Çıkar"
                              : "🤍 Favorile"}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/pazar/${String(x.id)}`}
                            onClick={() => bumpView(String(x.id))}
                            className="block w-full rounded-2xl bg-zinc-900 px-4 py-3 text-center text-sm font-black text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
                          >
                            Detay
                          </Link>

                          <Link
                            href={sellerId ? `/chat/user/${sellerId}` : "#"}
                            className={cn(
                              "block w-full rounded-2xl border px-4 py-3 text-center text-sm font-black",
                              sellerId
                                ? "border-black/10 bg-white text-zinc-900 hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-white/5"
                                : "border-black/10 bg-zinc-50 text-zinc-400 dark:border-white/10 dark:bg-zinc-900/20 dark:text-zinc-500"
                            )}
                          >
                            💬 Mesaj
                          </Link>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-500">
                        <span className="truncate">
                          Oluşturma: {fmtDate(x.created_at)}
                        </span>

                        <span className="font-mono font-black">
                          {String(x.id).slice(0, 8)}…
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div ref={sentinelRef} className="h-10" />

            {loadingMore ? (
              <div className="mt-4 rounded-[28px] border border-black/10 bg-white p-4 text-sm font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                Daha fazla yükleniyor...
              </div>
            ) : null}

            {!hasMore ? (
              <div className="mt-4 rounded-[28px] border border-black/10 bg-white p-4 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
                Hepsi bu kadar ✅
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}