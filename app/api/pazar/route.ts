// app/api/pazar/route.ts
import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function toInt(v: string | null, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) ? Math.floor(n) : def;
}

function toNum(v: string | null, def: number) {
  const n = Number(v ?? "");
  return Number.isFinite(n) ? n : def;
}

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const q = (url.searchParams.get("q") ?? "").trim();
  const product = (url.searchParams.get("product") ?? "all").trim();
  const city = (url.searchParams.get("city") ?? "all").trim();
  const district = (url.searchParams.get("district") ?? "all").trim();

  const sort = (url.searchParams.get("sort") ?? "new").trim(); // new|cheap|expensive
  const liveOnly = (url.searchParams.get("live") ?? "0").trim() === "1";

  const priceEnabled = (url.searchParams.get("price") ?? "0").trim() === "1";
  const min = Math.max(0, toNum(url.searchParams.get("min"), 0));
  const max = Math.min(5000, Math.max(min, toNum(url.searchParams.get("max"), 5000)));

  const limit = Math.min(60, Math.max(1, toInt(url.searchParams.get("limit"), 12)));
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const offset = (page - 1) * limit;

  const sb = await supabaseRouteClient();

  let qb = sb
    .from("listings")
    .select(
      `
        id,
        title,
        description,
        product_name,
        product_type,
        post_type,
        city,
        district,
        neighborhood,
        market_name,
        price,
        price_per_unit,
        unit,
        quantity,
        min_quantity,
        is_active,
        is_boosted,
        expires_at,
        created_at,
        seller_id
      `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .eq("is_active", true);

  const today = todayYYYYMMDD();
  qb = qb.or(`expires_at.is.null,expires_at.gte.${today}`);

  if (liveOnly) qb = qb.eq("is_boosted", true);

  if (product && product !== "all") {
    qb = qb.or(`product_name.eq.${product},product_type.eq.${product}`);
  }

  if (city && city !== "all") qb = qb.eq("city", city);
  if (district && district !== "all") qb = qb.eq("district", district);

  if (priceEnabled) {
    qb = qb.gte("price", min).lte("price", max);
  }

  if (q) {
    const esc = q.replace(/,/g, " ");
    qb = qb.or(
      [
        `title.ilike.%${esc}%`,
        `description.ilike.%${esc}%`,
        `market_name.ilike.%${esc}%`,
        `city.ilike.%${esc}%`,
        `district.ilike.%${esc}%`,
        `product_name.ilike.%${esc}%`,
        `product_type.ilike.%${esc}%`,
      ].join(",")
    );
  }

  if (sort === "cheap") {
    qb = qb.order("price", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
  } else if (sort === "expensive") {
    qb = qb.order("price", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  } else {
    qb = qb.order("is_boosted", { ascending: false }).order("created_at", { ascending: false });
  }

  const from = offset;
  const to = offset + limit - 1;

  const { data, error, count } = await qb.range(from, to);
  if (error) return json({ error: error.message }, 400);

  const items = (data ?? []) as any[];

  const listingIds = items.map((x) => x.id).filter(Boolean);
  const sellerIds = Array.from(new Set(items.map((x) => x.seller_id).filter(Boolean)));

  // ✅ 1) MEDIA: önce listing_media dene, yoksa listing_photos fallback
  let coverByListing: Record<string, { url: string | null; thumb_url: string | null }> = {};

  async function loadMediaFrom(table: "listing_media" | "listing_photos") {
    const { data: rows, error: mErr } = await sb
      .from(table)
      .select("listing_id,url,thumb_url,media_type")
      .in("listing_id", listingIds);

    if (mErr || !rows) return false;

    for (const r of rows as any[]) {
      const lid = r.listing_id;
      if (!lid) continue;
      if (!coverByListing[lid]) {
        coverByListing[lid] = { url: r.url ?? null, thumb_url: r.thumb_url ?? null };
      }
    }
    return true;
  }

  if (listingIds.length) {
    const ok1 = await loadMediaFrom("listing_media");
    if (!ok1 || Object.keys(coverByListing).length === 0) {
      await loadMediaFrom("listing_photos");
    }
  }

  // ✅ 2) sellers: profile (name + avatar_url opsiyonel)
  let sellerById: Record<string, { id: string; full_name: string | null; company_name: string | null; avatar_url?: string | null }> = {};
  if (sellerIds.length) {
    const { data: sellers } = await sb.from("profiles").select("id,full_name,company_name,avatar_url").in("id", sellerIds);
    if (sellers) {
      for (const s of sellers as any[]) {
        sellerById[s.id] = {
          id: s.id,
          full_name: s.full_name ?? null,
          company_name: s.company_name ?? null,
          avatar_url: s.avatar_url ?? null,
        };
      }
    }
  }

  const merged = items.map((x) => {
    const photo = coverByListing[x.id] ?? { url: null, thumb_url: null };
    const seller = x.seller_id ? sellerById[x.seller_id] ?? null : null;

    return {
      ...x,
      cover_url: photo.thumb_url || photo.url || null,
      seller: seller
        ? {
            id: seller.id,
            name: seller.full_name || seller.company_name || "Satıcı",
            avatar_url: seller.avatar_url ?? null,
          }
        : null,
    };
  });

  return json({
    items: merged,
    total: count ?? 0,
    page,
    limit,
    priceEnabled,
    min,
    max,
    sort,
  });
}