// app/api/pazar/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  { auth: { persistSession: false } }
);

function safeId(v: any) {
  return String(v ?? "").trim();
}

type MediaType = "image" | "video";

function toMediaType(t: any): MediaType {
  return String(t) === "video" ? "video" : "image";
}

async function fetchListingMedia(listingId: string) {
  const { data, error } = await supabase
    .from("listing_media")
    .select("url,type,poster_url,sort_order")
    .eq("listing_id", listingId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  const media = (data ?? []).map((m: any) => ({
    url: String(m.url),
    type: toMediaType(m.type),
    poster_url: m.poster_url ? String(m.poster_url) : null,
    sort_order: Number(m.sort_order ?? 0) || 0,
  }));

  const media_urls = media.map((m) => m.url);
  const media_types = media.map((m) => m.type);

  return { media, media_urls, media_types };
}

async function fetchSellerProfile(sellerId: string) {
  if (!sellerId) return null;

  // sende RPC var: get_public_profiles(ids)
  const { data, error } = await supabase.rpc("get_public_profiles", { ids: [sellerId] });
  if (error) return null;

  const p = (data ?? [])[0];
  if (!p) return null;

  return {
    id: String(p.id),
    full_name: p.full_name ?? null,
    avatar_url: p.avatar_url ?? null,
    is_premium: p.is_premium ?? null,
  };
}

async function fetchViews(listingId: string) {
  try {
    const { data, error } = await supabase.rpc("get_listing_views", { ids: [listingId] });
    if (error) throw error;
    const r = (data ?? [])[0];
    return r ? (Number(r.views ?? 0) || 0) : 0;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const id = safeId(ctx?.params?.id);
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  try {
    // listing çek
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
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // ✅ TS hatasını bitiren garanti: listingObj her zaman object
    const listingObj: Record<string, any> =
      data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, any>) : {};

    // listing_media varsa override et
    const { media, media_urls, media_types } = await fetchListingMedia(id);

    // listing üzerinde media yoksa listing_media’dan doldur
    // varsa ama listing_media doluysa, listing_media öncelikli olsun
    const finalMediaUrls =
      media_urls.length > 0 ? media_urls : Array.isArray((listingObj as any).media_urls) ? (listingObj as any).media_urls : [];
    const finalMediaTypesRaw =
      media_types.length > 0 ? media_types : Array.isArray((listingObj as any).media_types) ? (listingObj as any).media_types : [];
    const finalMediaTypes: MediaType[] = finalMediaTypesRaw.map((t: any) => toMediaType(t));

    const sellerId = safeId(listingObj.seller_id);
    const [seller, views] = await Promise.all([fetchSellerProfile(sellerId), fetchViews(id)]);

    return NextResponse.json({
      listing: {
        ...listingObj, // ✅ artık TS hata vermez
        media_urls: finalMediaUrls,
        media_types: finalMediaTypes,
      },
      media, // detay için poster_url vs
      seller,
      views,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", message: e?.message ? String(e.message) : "unknown_error" },
      { status: 500 }
    );
  }
}