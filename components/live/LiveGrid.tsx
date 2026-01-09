"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import LiveCard from "@/components/live/LiveCard";

type LiveGridProps = {
  limit?: number;
  withRealtime?: boolean;
};

type SellerProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  kyc_status: string | null;
  is_online: boolean;
  last_seen_at: string | null;
};

type ListingRow = {
  id: string;
  title: string | null;
  description: string | null;

  product_type: string | null;
  product_name: string | null;
  post_type: string | null;

  city: string | null;
  district: string | null;
  neighborhood: string | null;
  market_name: string | null;

  price_per_unit: number | null;
  price: number | null;
  unit: string | null;

  quantity: number | null;
  min_quantity: number | null;

  is_active: boolean | null;
  is_boosted: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  deleted_at: string | null;

  seller_id: string | null;
  seller?: SellerProfile | null;

  // ✅ cover (listing_media’den)
  cover_url?: string | null;
  cover_thumb?: string | null;
};

type MediaRow = {
  listing_id: string | null;
  url: string | null;
  thumb_url: string | null;
  media_type: string | null;
  sort_order: number | null;
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: ListingRow[] };

type LocationsTR = Record<string, Record<string, string[]>>;

// ✅ local hide/block keys (LiveCard ile aynı)
const LS_HIDE = "halapp_hide_listing_ids_v1";
const LS_BLOCK = "halapp_block_seller_ids_v1";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function isVerified(kycStatus: string | null | undefined) {
  const v = (kycStatus ?? "").toLowerCase().trim();
  return v === "approved" || v === "verified" || v === "ok";
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
  return (
    u.includes(".jpg") ||
    u.includes(".jpeg") ||
    u.includes(".png") ||
    u.includes(".webp") ||
    u.includes(".gif") ||
    u.includes("storage")
  );
}

function getLSSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr.map((x) => String(x)) : []);
  } catch {
    return new Set();
  }
}

function normalizeSeller(s: unknown): SellerProfile | null {
  if (!s) return null;
  const obj = Array.isArray(s) ? s[0] : s;
  if (!obj || typeof obj !== "object") return null;
  const o = obj as any;
  return {
    id: String(o.id ?? ""),
    full_name: (o.full_name ?? null) as any,
    company_name: (o.company_name ?? null) as any,
    avatar_url: (o.avatar_url ?? null) as any,
    is_premium: Boolean(o.is_premium),
    kyc_status: (o.kyc_status ?? null) as any,
    is_online: Boolean(o.is_online),
    last_seen_at: (o.last_seen_at ?? null) as any,
  };
}

function normalizeListing(r: any): ListingRow | null {
  if (!r || typeof r !== "object") return null;
  return {
    id: String(r.id ?? ""),
    title: (r.title ?? null) as any,
    description: (r.description ?? null) as any,

    product_type: (r.product_type ?? null) as any,
    product_name: (r.product_name ?? null) as any,
    post_type: (r.post_type ?? null) as any,

    city: (r.city ?? null) as any,
    district: (r.district ?? null) as any,
    neighborhood: (r.neighborhood ?? null) as any,
    market_name: (r.market_name ?? null) as any,

    price_per_unit: (r.price_per_unit ?? null) as any,
    price: (r.price ?? null) as any,
    unit: (r.unit ?? null) as any,

    quantity: (r.quantity ?? null) as any,
    min_quantity: (r.min_quantity ?? null) as any,

    is_active: (r.is_active ?? null) as any,
    is_boosted: (r.is_boosted ?? null) as any,
    expires_at: (r.expires_at ?? null) as any,
    created_at: (r.created_at ?? null) as any,
    deleted_at: (r.deleted_at ?? null) as any,

    seller_id: (r.seller_id ?? null) as any,
    seller: normalizeSeller(r.seller),

    cover_url: null,
    cover_thumb: null,
  };
}

function pillTR(postType?: string | null) {
  const v = (postType ?? "").toLowerCase().trim();
  if (!v) return "urun";
  if (v.includes("buy") || v.includes("talep")) return "talep";
  return "urun";
}

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
}

const PRODUCT_OPTIONS = [
  "Ahududu","Altınçilek","Amme(Cennet Meyvesi)","Ananas","Armut","Avokado","Ayva","Biber","Biber Çarli","Biber Kapya","Biber Sivri","Biber Üçburun",
  "Blue Berry","Böğürtlen","Brokoli","Çilek","Dereotu","Domates","Domates (Ceri)","Domates (Pembe)","Domates Kokteyl",
  "Elma (Golden)","Elma (Grann Smith)","Elma (Starking)","Fasulye","Fesleğen","Frenk Üzümü","Greyfurt","Havuç","Hıyar","Hindistan Cevizi",
  "Ispanak","Kabak (Bal)","Kabak (Sakız)","Karadeniz Yaprağı","Karnabahar","Kavun(Kırkağaç)","Kereviz","Kivi","Kuzu Kulağı",
  "Lahana (Beyaz)","Lahana (Kırmızı)","Lime Limon","Limon","Mandarin(Paket)","Mango","Mantar","Marul (Aysberk)","Marul (Düz)","Marul (Kıvırcık)",
  "Maydonoz","Muz (Yerli)","Muz İthal","Nane","Nar","Pancar","Patates","Patates (Baby)","Patates (Kumpirlik)","Patlıcan","Patlıcan (Topak)",
  "Pazı Bağ","Pırasa","Portakal (Sıkmalık)","Portakal (Valencia Pak)","Roka Bağ","Sarımsak (Taze)","Semizotu Bağ","Soğan (Arpacık)","Soğan (Kırmız)",
  "Soğan (Yeşil) Bağ","Soğan Kuru","Tere Bağ","Tere Su","Turp (Kırmızı)","Turp(Fındık)","Üzüm (Beyaz)","Üzüm (Siyah)","Zencefil",
];

function normalizeLocations(raw: any): LocationsTR | null {
  if (!raw || typeof raw !== "object") return null;
  const top = raw as Record<string, any>;
  const cityKeys = Object.keys(top).filter(Boolean);
  const firstCity = cityKeys[0];
  if (!firstCity) return null;
  if (!top[firstCity] || typeof top[firstCity] !== "object") return null;

  const out: LocationsTR = {};
  for (const c of cityKeys) {
    const districtsObj = top[c];
    if (!districtsObj || typeof districtsObj !== "object") continue;

    const dKeys = Object.keys(districtsObj).filter(Boolean);
    const safeDistricts: Record<string, string[]> = {};

    for (const d of dKeys) {
      const arr = districtsObj[d];
      safeDistricts[d] = Array.isArray(arr)
        ? arr.map((x) => String(x ?? "").trim()).filter(Boolean)
        : [];
    }
    out[c] = safeDistricts;
  }

  return Object.keys(out).length ? out : null;
}

export default function LiveGrid({ limit = 12, withRealtime = true }: LiveGridProps) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [loc, setLoc] = useState<LocationsTR | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "urun" | "talep">("all");
  const [city, setCity] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [product, setProduct] = useState<string>("all");
  const [market, setMarket] = useState<string>("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyPremiumSeller, setOnlyPremiumSeller] = useState(false);

  const featuredRef = useRef<HTMLDivElement | null>(null);

  // ✅ local filters state (hide/block) — event ile güncellenir
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [blockedSellerIds, setBlockedSellerIds] = useState<Set<string>>(new Set());

  const refreshLocalFilters = useCallback(() => {
    try {
      setHiddenIds(getLSSet(LS_HIDE));
      setBlockedSellerIds(getLSSet(LS_BLOCK));
    } catch {
      setHiddenIds(new Set());
      setBlockedSellerIds(new Set());
    }
  }, []);

  useEffect(() => {
    refreshLocalFilters();

    // LiveCard gibi yerlerden manuel event
    function onLocalUpdate() {
      refreshLocalFilters();
    }

    // başka tab/sekmede değişince
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (e.key === LS_HIDE || e.key === LS_BLOCK) refreshLocalFilters();
    }

    window.addEventListener("halapp:local-filters-updated", onLocalUpdate as any);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("halapp:local-filters-updated", onLocalUpdate as any);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshLocalFilters]);

  // ✅ locations.json yükle
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/locations.json", { cache: "no-store" });
        if (!r.ok) return;
        const raw = await r.json();
        const n = normalizeLocations(raw);
        if (!alive) return;
        if (n) setLoc(n);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ Cover merge helper (listing_media)
  async function attachCovers(items: ListingRow[]) {
    const ids = items.map((x) => x.id).filter(Boolean);
    if (!ids.length) return items;

    const { data: media, error: mediaErr } = await supabase
      .from("listing_media")
      .select("listing_id,url,thumb_url,media_type,sort_order")
      .in("listing_id", ids)
      .order("sort_order", { ascending: true });

    if (mediaErr) return items;

    const rows = (Array.isArray(media) ? media : []) as MediaRow[];

    const coverMap = new Map<string, { thumb: string | null; url: string | null }>();

    for (const m of rows) {
      const lid = String(m.listing_id ?? "").trim();
      if (!lid) continue;

      const thumb = safeUrl(m.thumb_url);
      const url = safeUrl(m.url);
      const candidate = (thumb || url) ?? null;
      if (!candidate) continue;

      const isImg = isProbablyImage(candidate);

      if (!coverMap.has(lid)) {
        coverMap.set(lid, { thumb, url });
        continue;
      }

      const ex = coverMap.get(lid)!;
      const exCandidate = (ex.thumb || ex.url) ?? null;
      const exIsImg = isProbablyImage(exCandidate);
      if (!exIsImg && isImg) {
        coverMap.set(lid, { thumb, url });
      }
    }

    return items.map((it) => {
      const c = coverMap.get(it.id);
      return {
        ...it,
        cover_thumb: c?.thumb ?? null,
        cover_url: c?.url ?? null,
      };
    });
  }

  // ✅ listings load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          id,
          title,
          description,
          product_type,
          product_name,
          post_type,
          city,
          district,
          neighborhood,
          market_name,
          price_per_unit,
          price,
          unit,
          min_quantity,
          quantity,
          is_active,
          is_boosted,
          expires_at,
          created_at,
          seller_id,
          deleted_at,
          seller:profiles!listings_seller_id_fkey (
            id,
            full_name,
            company_name,
            avatar_url,
            is_premium,
            kyc_status,
            is_online,
            last_seen_at
          )
        `
        )
        .is("deleted_at", null)
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
        .order("is_boosted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;

      if (error) {
        setState({ status: "error", message: error.message });
        return;
      }

      const rows = Array.isArray(data) ? data : [];
      const base = rows.map(normalizeListing).filter(Boolean) as ListingRow[];

      const merged = await attachCovers(base);
      if (cancelled) return;

      setState({ status: "ready", items: merged });
    }

    load();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (withRealtime) {
      channel = supabase
        .channel("live_listings_grid")
        .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => load())
        .on("postgres_changes", { event: "*", schema: "public", table: "listing_media" }, () => load())
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [limit, withRealtime]);

  const cities = useMemo(() => {
    if (!loc) return [];
    return uniqSorted(Object.keys(loc));
  }, [loc]);

  const districts = useMemo(() => {
    if (!loc) return [];
    if (city === "all") return [];
    const dObj = loc[city];
    if (!dObj) return [];
    return uniqSorted(Object.keys(dObj));
  }, [loc, city]);

  const markets = useMemo(() => {
    if (state.status !== "ready") return [];
    let base = state.items;

    // ✅ local hide/block apply here too (market list doğru olsun)
    base = base.filter((x) => {
      if (hiddenIds.has(String(x.id))) return false;
      const sid = String(x.seller_id ?? x.seller?.id ?? "").trim();
      if (sid && blockedSellerIds.has(sid)) return false;
      return true;
    });

    if (city !== "all") base = base.filter((x) => (x.city ?? "").trim() === city);
    if (district !== "all") base = base.filter((x) => (x.district ?? "").trim() === district);
    return uniqSorted(base.map((x) => (x.market_name ?? "").trim()).filter(Boolean));
  }, [state, city, district, hiddenIds, blockedSellerIds]);

  useEffect(() => {
    setDistrict("all");
    setMarket("all");
  }, [city]);

  useEffect(() => {
    setMarket("all");
  }, [district]);

  const filtered = useMemo(() => {
    if (state.status !== "ready") return [];
    const qq = q.trim().toLowerCase();

    return state.items.filter((x) => {
      // ✅ local hide
      if (hiddenIds.has(String(x.id))) return false;

      // ✅ local block seller
      const sid = String(x.seller_id ?? x.seller?.id ?? "").trim();
      if (sid && blockedSellerIds.has(sid)) return false;

      const seller = x.seller ?? null;
      const verified = isVerified(seller?.kyc_status);
      const sellerPremium = Boolean(seller?.is_premium);

      if (city !== "all" && (x.city ?? "").trim() !== city) return false;
      if (district !== "all" && (x.district ?? "").trim() !== district) return false;
      if (market !== "all" && (x.market_name ?? "").trim() !== market) return false;

      if (type !== "all") {
        const t = pillTR(x.post_type);
        if (t !== type) return false;
      }

      if (product !== "all") {
        const p = (x.product_name || x.product_type || "").trim();
        if (!p) return false;
        if (p.toLowerCase() !== product.toLowerCase()) return false;
      }

      if (onlyVerified && !verified) return false;
      if (onlyPremiumSeller && !sellerPremium) return false;

      if (qq) {
        const hay = [
          x.product_name,
          x.title,
          x.description,
          x.city,
          x.district,
          x.market_name,
          x.neighborhood,
          x.product_type,
          seller?.company_name,
          seller?.full_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!hay.includes(qq)) return false;
      }

      return true;
    });
  }, [
    state,
    q,
    type,
    city,
    district,
    market,
    product,
    onlyVerified,
    onlyPremiumSeller,
    hiddenIds,
    blockedSellerIds,
  ]);

  const featured = useMemo(() => filtered.filter((x) => Boolean(x.is_boosted)), [filtered]);
  const normal = useMemo(() => filtered.filter((x) => !x.is_boosted), [filtered]);

  function scrollFeatured(dir: "left" | "right") {
    const el = featuredRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  const content = useMemo(() => {
    if (state.status === "loading") {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[26px] border border-black/10 bg-white/70 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.06)] animate-pulse dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="h-24 w-full rounded-2xl bg-black/10 dark:bg-white/10" />
              <div className="mt-4 h-4 w-28 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-3 h-5 w-2/3 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-4 w-1/2 rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-6 h-10 w-full rounded-2xl bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      );
    }

    if (state.status === "error") {
      return (
        <div className="rounded-[26px] border border-black/10 bg-white/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.5)]">
          <div className="text-sm font-black text-red-700 dark:text-red-300">Canlı ilanlar yüklenemedi</div>
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">{state.message}</div>

          <button
            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
            onClick={() => window.location.reload()}
          >
            Yenile
          </button>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="rounded-[26px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-black text-black/90 dark:text-white/90">Sonuç bulunamadı</div>
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">Filtreleri değiştir veya aramayı temizle.</div>

          <button
            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
            onClick={() => {
              setQ("");
              setCity("all");
              setDistrict("all");
              setMarket("all");
              setType("all");
              setProduct("all");
              setOnlyVerified(false);
              setOnlyPremiumSeller(false);
            }}
          >
            Filtreleri sıfırla
          </button>
        </div>
      );
    }

    return (
      <>
        {featured.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-black text-black/90 dark:text-white/90">Öne Çıkanlar</div>
                <div className="mt-1 text-xs text-black/60 dark:text-white/60">Premium vitrin – hızlı görünürlük</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollFeatured("left")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-black/70 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
                  aria-label="Sola kaydır"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => scrollFeatured("right")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-black/70 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
                  aria-label="Sağa kaydır"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <span className="rounded-full border border-amber-500/30 bg-amber-500/12 px-3 py-1 text-[11px] font-black text-amber-900 dark:text-amber-200">
                  {featured.length} ilan
                </span>
              </div>
            </div>

            <div
              ref={featuredRef}
              className={cn("flex gap-4 overflow-x-auto pb-2", "snap-x snap-mandatory", "[-webkit-overflow-scrolling:touch]")}
              style={{ scrollbarWidth: "none" as any }}
            >
              {featured.map((item) => (
                <div key={item.id} className="snap-start min-w-[320px] max-w-[360px] flex-1">
                  <LiveCard
                    item={
                      {
                        ...item,
                        seller: item.seller
                          ? ({
                              ...item.seller,
                              verified: isVerified(item.seller.kyc_status),
                            } as any)
                          : null,
                      } as any
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {normal.map((item) => (
            <LiveCard
              key={item.id}
              item={
                {
                  ...item,
                  seller: item.seller
                    ? ({
                        ...item.seller,
                        verified: isVerified(item.seller.kyc_status),
                      } as any)
                    : null,
                } as any
              }
            />
          ))}
        </div>
      </>
    );
  }, [state, filtered, featured, normal]);

  return (
    <section id="canli-ilanlar" className="mt-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-black/95 dark:text-white/95">Canlı İlanlar</h2>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Premium ilanlar üstte görünür • Güncel akış</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-900 dark:text-emerald-200">
            {withRealtime ? "Realtime açık" : "Realtime kapalı"}
          </span>

          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
          >
            Fiyatlar →
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 rounded-[28px] border border-black/10 bg-white/75 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="grid gap-3 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Ara</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ürün, şehir, hal, satıcı..."
              className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">İl</div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
            >
              <option value="all">Tümü</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">İlçe</div>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={city === "all"}
              className={cn(
                "mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80",
                city === "all" && "opacity-60 cursor-not-allowed"
              )}
            >
              <option value="all">{city === "all" ? "Önce il seç" : "Tümü"}</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Ürün</div>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
            >
              <option value="all">Tümü</option>
              {PRODUCT_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Tür</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
            >
              <option value="all">Tümü</option>
              <option value="urun">Ürün</option>
              <option value="talep">Talep</option>
            </select>
          </div>

          <div className="sm:col-span-12">
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">Hal</div>
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-black/80 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-white/10 dark:bg-zinc-950/50 dark:text-white/80"
                  >
                    <option value="all">Tümü</option>
                    {markets.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <label className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-sm font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                  Onaylı Satıcı
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="h-5 w-5 accent-emerald-500"
                  />
                </label>

                <label className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-sm font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                  Premium Satıcı
                  <input
                    type="checkbox"
                    checked={onlyPremiumSeller}
                    onChange={(e) => setOnlyPremiumSeller(e.target.checked)}
                    className="h-5 w-5 accent-emerald-500"
                  />
                </label>

                <span className="mt-5 text-xs text-black/55 dark:text-white/55">
                  Sonuç: <b className="text-black/80 dark:text-white/80">{filtered.length}</b>
                </span>
              </div>

              <button
                className="mt-5 inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                onClick={() => {
                  setQ("");
                  setCity("all");
                  setDistrict("all");
                  setMarket("all");
                  setType("all");
                  setProduct("all");
                  setOnlyVerified(false);
                  setOnlyPremiumSeller(false);
                }}
              >
                Temizle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">{content}</div>
    </section>
  );
}