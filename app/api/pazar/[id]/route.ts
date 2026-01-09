import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeId(v: any) {
  const s = String(v ?? "").trim();
  return s;
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const id = safeId(ctx?.params?.id);
  if (!id) return json({ error: "missing_id" }, 400);

  const sb = await supabaseRouteClient();

  const { data: item, error } = await sb
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
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return json({ error: error.message }, 400);
  if (!item) return json({ error: "not_found" }, 404);

  // photos
  const { data: photos, error: pErr } = await sb
    .from("listing_photos")
    .select("url,thumb_url,media_type,listing_id")
    .eq("listing_id", item.id);

  if (pErr) return json({ error: pErr.message }, 400);

  // seller
  let seller: any = null;
  if (item.seller_id) {
    const { data: s, error: sErr } = await sb
      .from("profiles")
      .select("id,full_name,company_name,avatar_url,is_premium,is_verified")
      .eq("id", item.seller_id)
      .maybeSingle();

    if (sErr) return json({ error: sErr.message }, 400);

    if (s) {
      seller = {
        id: s.id,
        name: s.full_name || s.company_name || "Satıcı",
        avatar_url: s.avatar_url ?? null,
        is_premium: Boolean(s.is_premium ?? false),
      };
    }
  }

  return json({
    item: {
      ...item,
      seller,
      photos: (photos ?? []).map((p: any) => ({
        url: p.url ?? null,
        thumb_url: p.thumb_url ?? null,
        media_type: p.media_type ?? null,
      })),
    },
  });
}