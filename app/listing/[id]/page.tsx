export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ListingActions from "@/components/listing/ListingActions";
import SimilarListings from "@/components/listing/SimilarListings";
type SellerProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  kyc_status: string | null;
  is_online: boolean;
  last_seen_at: string | null;
  phone?: string | null;
  phone_number?: string | null;
};

type ListingRow = {
  id: string;
  title: string | null;
  description: string | null;
  product_type: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  market_name: string | null;
  price_per_unit: number | null;
  unit: string | null;
  min_quantity: number | null;
  is_active: boolean | null;
  is_boosted: boolean | null;
  expires_at: string | null; // date
  created_at: string | null; // timestamptz
  seller_id: string | null;
  post_type: string | null;
  product_name: string | null;
  quantity: number | null;
  price: number | null;
  min_price: number | null;
  max_price: number | null;
  deleted_at: string | null;
  seller?: SellerProfile | null;
};

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, { auth: { persistSession: false } });
}
async function trackListingViewServer(listingId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!baseUrl || !anonKey) return;

    await fetch(`${baseUrl}/functions/v1/track-listing-view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        listing_id: listingId,
        source: "detail",
        platform: "web",
        device_type: "mobile_web",
      }),
      cache: "no-store",
    });
  } catch {
    // sessiz
  }
}
function safeText(v: any, fallback: string) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : fallback;
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

function isVerified(kycStatus: string | null | undefined) {
  const v = (kycStatus ?? "").toLowerCase().trim();
  return v === "approved" || v === "verified" || v === "ok";
}

function fmtTRY(n: any) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(num);
}

function fmtUnitPrice(pricePerUnit: any, unit?: string | null) {
  const u = (unit ?? "").trim();
  if (pricePerUnit === null || pricePerUnit === undefined || pricePerUnit === "")
    return "—";
  const num = Number(pricePerUnit);
  if (!Number.isFinite(num)) return "—";
  const p = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(num);
  return u ? `${p} / ${u}` : p;
}

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}g önce`;
  if (hr > 0) return `${hr}s önce`;
  if (min > 0) return `${min}dk önce`;
  return "az önce";
}

function pillTR(postType?: string | null) {
  const v = (postType ?? "").toLowerCase().trim();
  if (!v) return "İlan";
  if (v.includes("buy") || v.includes("talep")) return "Talep";
  if (v.includes("sell") || v.includes("ürün") || v.includes("urun")) return "Ürün";
  return "İlan";
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sb = supabaseServer();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await sb
    .from("listings")
    .select(
      `
      id,
      title,
      description,
      product_type,
      city,
      district,
      neighborhood,
      market_name,
      price_per_unit,
      unit,
      min_quantity,
      is_active,
      is_boosted,
      expires_at,
      created_at,
      seller_id,
      post_type,
      product_name,
      quantity,
      price,
      min_price,
      max_price,
      deleted_at,
      seller:profiles!listings_seller_id_fkey (
        id,
        full_name,
        company_name,
        avatar_url,
        is_premium,
        kyc_status,
        is_online,
        last_seen_at,
        phone,
        phone_number
      )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .maybeSingle<ListingRow>();

  if (error || !data) {
    return (
      <div className="mt-6">
        <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.5)]">
          <div className="text-sm font-black text-red-700 dark:text-red-300">
            İlan bulunamadı
          </div>
          <div className="mt-2 text-sm text-black/60 dark:text-white/60">
            {error?.message ?? "Bu ilan kaldırılmış veya süresi dolmuş olabilir."}
          </div>

          <div className="mt-5 flex gap-2">
            <Link
              href="/#canli-ilanlar"
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
            >
              ← Canlı ilanlara dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const listing = data;
  const seller = listing.seller ?? null;
trackListingViewServer(listing.id);
  const sellerName = safeText(
    seller?.company_name?.trim() ? seller?.company_name : seller?.full_name,
    "Satıcı"
  );

  const verified = isVerified(seller?.kyc_status);
  const typeLabel = pillTR(listing.post_type);

  const locParts = [
    listing.city,
    listing.district,
    listing.market_name,
    listing.neighborhood,
  ].filter(Boolean);

  const created = timeAgo(listing.created_at ?? null);
  const lastSeen = timeAgo(seller?.last_seen_at ?? null);

  const title = safeText(listing.product_name || listing.title, "İlan Detayı");

  return (
    <div className="mt-6">
      {/* Top */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/#canli-ilanlar"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition"
          >
            <span className="text-lg">←</span> Canlı ilanlar
          </Link>

          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-black/95 dark:text-white/95">
            {title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/60 dark:text-white/60">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              {typeLabel}
            </span>

            {listing.is_boosted ? (
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/12 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                Öne Çıkan
              </span>
            ) : null}

            {created ? <span>• {created}</span> : null}

            {locParts.length ? (
              <span className="truncate">• {locParts.slice(0, 3).join(" • ")}</span>
            ) : null}
          </div>
        </div>
<SimilarListings
  currentId={listing.id}
  city={listing.city}
  productName={listing.product_name}
  productType={listing.product_type}
/>
        {/* ✅ DOĞRU PROPS */}
        <ListingActions
          listingId={listing.id}
          title={title}
          sellerPhone={seller?.phone ?? null}
          sellerPhoneNumber={seller?.phone_number ?? null}
        />
      </div>

      {/* Content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left main */}
        <div className="lg:col-span-8">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-black/55 dark:text-white/55">
                  Birim fiyat
                </div>
                <div className="mt-1 text-xl font-black text-black/95 dark:text-white/95">
                  {fmtUnitPrice(listing.price_per_unit, listing.unit)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">
                    Min
                  </div>
                  <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">
                    {fmtTRY(listing.min_price)}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">
                    Max
                  </div>
                  <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">
                    {fmtTRY(listing.max_price)}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">
                    Miktar
                  </div>
                  <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">
                    {listing.quantity ?? listing.min_quantity ?? "—"}{" "}
                    {(listing.unit ?? "").trim()}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <div className="text-sm font-black text-black/90 dark:text-white/90">
                Açıklama
              </div>
              <div className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">
                {listing.description?.trim()
                  ? listing.description
                  : "Satıcı açıklama eklememiş."}
              </div>
            </div>

            {/* Location */}
            <div className="mt-6">
              <div className="text-sm font-black text-black/90 dark:text-white/90">
                Konum
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">
                    Şehir / İlçe
                  </div>
                  <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">
                    {safeText(listing.city, "—")} / {safeText(listing.district, "—")}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-[11px] font-extrabold text-black/55 dark:text-white/55">
                    Hal / Mahalle
                  </div>
                  <div className="mt-1 text-sm font-black text-black/85 dark:text-white/85">
                    {safeText(listing.market_name, "—")} •{" "}
                    {safeText(listing.neighborhood, "—")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust / note */}
          <div className="mt-6 rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="text-sm font-black text-emerald-900 dark:text-emerald-100">
              HalApp Güven Notu
            </div>
            <div className="mt-1 text-sm text-emerald-900/70 dark:text-emerald-100/70">
              Satıcı doğrulaması ve Premium rozetleri sayfada görünür. İşlem yapmadan önce ilan detaylarını ve satıcı bilgilerini kontrol et.
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="lg:col-span-4">
          <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative h-14 w-14 shrink-0">
                <div className="h-14 w-14 overflow-hidden rounded-3xl ring-1 ring-black/10 bg-black/5 dark:ring-white/10 dark:bg-white/5">
                  {seller?.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={safeText(sellerName, "Profil")}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black text-black/70 dark:text-white/75">
                      {initials(sellerName)}
                    </div>
                  )}
                </div>

                {seller?.is_online ? (
                  <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-black" />
                ) : null}
              </div>

              {/* Seller meta */}
              <div className="min-w-0">
                <div className="truncate text-base font-black text-black/95 dark:text-white/95">
                  {sellerName}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-200">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 7L10.5 16.5L4 10"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Onaylı Satıcı
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-[11px] font-extrabold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                      Standart Satıcı
                    </span>
                  )}

                  {seller?.is_premium ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 17.5l-6.2 3.3 1.2-7-5-4.9 7-1 3-6.3 3 6.3 7 1-5 4.9 1.2 7L12 17.5z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Premium
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 text-xs text-black/60 dark:text-white/60">
                  {seller?.is_online
                    ? "Şu an online"
                    : lastSeen
                    ? `Son görülme: ${lastSeen}`
                    : ""}
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-black/55 dark:text-white/55">
              İlan ID: <span className="font-mono">{listing.id}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}